/**
 * Alternative Text Capture Service using Electron APIs
 * This replaces robotjs with a more reliable, cross-platform solution
 */

const { globalShortcut, clipboard } = require('electron');
const { exec } = require('child_process');

class AlternativeTextCapture {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.lastClipboardContent = '';
        this.isCapturing = false;
    }

    /**
     * Initialize the text capture service
     */
    initialize() {
        this.registerHotkeys();
        this.startClipboardMonitoring();
    }

    /**
     * Register global hotkeys
     */
    registerHotkeys() {
        // Register Ctrl+Shift+D for text capture
        const captureHotkey = 'CommandOrControl+Shift+D';
        
        const registered = globalShortcut.register(captureHotkey, () => {
            this.captureSelectedText();
        });

        if (!registered) {
            console.error('Failed to register global hotkey:', captureHotkey);
        }

        console.log('Global hotkey registered:', captureHotkey);
    }

    /**
     * Capture selected text using system clipboard
     */
    async captureSelectedText() {
        try {
            this.isCapturing = true;
            
            // Store current clipboard content
            const originalClipboard = clipboard.readText();
            
            // Send Ctrl+C to copy selected text
            await this.sendCtrlC();
            
            // Wait a bit for clipboard to update
            await this.sleep(100);
            
            // Read the new clipboard content
            const capturedText = clipboard.readText();
            
            // Check if we got new content
            if (capturedText && capturedText !== originalClipboard && capturedText.trim().length > 0) {
                console.log('Captured text:', capturedText);
                
                // Send captured text to renderer
                this.mainWindow.webContents.send('text-captured', {
                    text: capturedText.trim(),
                    timestamp: Date.now()
                });
                
                // Restore original clipboard content after a delay
                setTimeout(() => {
                    clipboard.writeText(originalClipboard);
                }, 1000);
            }
        } catch (error) {
            console.error('Error capturing text:', error);
        } finally {
            this.isCapturing = false;
        }
    }

    /**
     * Send Ctrl+C using system commands (cross-platform)
     */
    sendCtrlC() {
        return new Promise((resolve) => {
            const platform = process.platform;
            
            let command;
            if (platform === 'win32') {
                // Windows: Use PowerShell to send Ctrl+C
                command = 'powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^c\')"';
            } else if (platform === 'darwin') {
                // macOS: Use osascript
                command = 'osascript -e "tell application \\"System Events\\" to keystroke \\"c\\" using command down"';
            } else {
                // Linux: Use xdotool
                command = 'xdotool key ctrl+c';
            }

            exec(command, (error) => {
                if (error) {
                    console.error('Error sending Ctrl+C:', error);
                }
                resolve();
            });
        });
    }

    /**
     * Monitor clipboard for changes (alternative method)
     */
    startClipboardMonitoring() {
        setInterval(() => {
            if (!this.isCapturing) {
                const currentClipboard = clipboard.readText();
                if (currentClipboard !== this.lastClipboardContent) {
                    this.lastClipboardContent = currentClipboard;
                    // Optionally handle clipboard changes here
                }
            }
        }, 500);
    }

    /**
     * Utility function to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Unregister hotkeys when shutting down
     */
    destroy() {
        globalShortcut.unregisterAll();
    }
}

module.exports = AlternativeTextCapture;