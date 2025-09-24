# Browser Helper - Personal Dictionary Extension

Browser Helper is a Chromium-based browser extension that lets you create a personal dictionary of words and phrases, highlighting them on any web page and providing custom descriptions, including with the help of generative AI.

## Features

- **Personal Dictionary:** Save words/phrases and add custom descriptions.
- **Automatic Highlighting:** Saved words are highlighted on all pages.
- **Quick Edit:** Click a highlighted word to edit or remove it.
- **AI Integration:** Generate automatic descriptions using OpenAI, Anthropic, or Google Gemini.
- **Multi-language:** Interface and AI responses in Brazilian Portuguese, English, and Spanish.
- **Language Selector:** Choose the interface and AI response language in the settings modal.
- **Sync:** Your words are saved in the cloud via Chrome Storage Sync.

## Installation

1. Download or clone this repository:
   ```sh
   git clone https://github.com/Raul-gonc/Browser-helper.git
   ```
2. In Chrome, go to `chrome://extensions/`.
3. Enable developer mode.
4. Click "Load unpacked" and select the `extension` folder.
5. Done! The extension icon will appear in your browser bar.

## How to Use

1. **Select** a word or phrase on any page.
2. Click the 📝 button that appears.
3. Add a description manually or generate it with AI.
4. Saved words are highlighted in gold.
5. Click a highlighted word to edit or remove it.
6. Open the settings modal (⚙️) to:
   - Configure AI providers and API keys
   - Change the interface and AI response language

## Supported Languages
- Brazilian Portuguese
- English
- Spanish

## Supported AI Providers
- OpenAI (GPT-4, GPT-4o, GPT-5, etc)
- Anthropic (Claude)
- Google Gemini

> **Note:** You must provide your own API key for each provider.

## Project Structure

```
extension/
├── background.js
├── content.js
├── i18n.js
├── locales/
│   ├── en.json
│   ├── es.json
│   └── pt-BR.json
├── _locales/
│   ├── en/messages.json
│   ├── es/messages.json
│   └── pt_BR/messages.json
├── icon.png
├── manifest.json
├── popup.html
├── popup.js
```

## Permissions
- `storage`: To save the user's dictionary and settings
- `scripting`, `activeTab`: To inject scripts and highlight words
- `host_permissions`: To access AI APIs

## Contributing

Contributions are welcome! Feel free to open issues, pull requests, or suggest improvements.

**Browser Helper** — Make your learning and browsing more productive!
