# Your Study Buddy

**Your Study Buddy** is a free, open-source study application for macOS and Windows. It works fully offline, does not require an account, and does not send your study materials to an AI service.

The app combines customizable flashcards, Anki-style spaced repetition, pre-built study decks, textbook-aligned resources, practice questions, and Feynman Technique prompts in one place.

## Features

### Flashcards and spaced repetition

- Create, edit, organize, and delete your own flashcards.
- Review cards normally or with Anki-style spaced repetition.
- Track new, learning, and review cards in daily sessions.
- Add text, images, drawings, and mathematical notation to cards.
- Organize study sets into customizable folders and study an entire folder at once.
- Search your personal collection and the built-in deck library.

### Create from notes

- Paste formatted notes to create an editable study set.
- Generate flashcards, practice questions, and Feynman prompts in one pass.
- Preserve useful structure such as headings, bold text, and bullet points.
- Add or revise cards, questions, and prompts before saving the set.

All note processing is performed locally. The app uses offline text-processing rules rather than a hosted AI model.

### Import and export

- Import Anki packages (`.apkg`) and common study formats.
- Import notes from PDF, PowerPoint (`.pptx`), text, CSV, and TSV files.
- Choose a file or drag and drop it into the app.
- Export study sets as APKG, CSV, TSV, or JSON files.

Import and export are designed to work on both macOS and Windows.

### Built-in textbooks

The current textbook library contains study resources aligned with:

1. Campbell Biology, 12th Edition
2. Vander's Human Physiology, 16th Edition
3. Atkins' Physical Chemistry, 8th Edition
4. Raven Biology of Plants, 8th Edition
5. Zumdahl Chemistry, 7th Edition
6. Chemistry: The Central Science, 12th Edition

The app contains original study material organized around these books; it does not distribute copies of the textbooks themselves.

### Pre-built study decks

The current release includes:

1. AP Psychology
2. AP U.S. Government and Politics
3. AP Environmental Science
4. AP European History
5. AP World History: Modern
6. AP Human Geography
7. SAT Vocabulary

Each collection is divided into smaller units so students can study a specific topic or combine multiple units into one session.

### Additional study tools

- Feynman Technique prompts for explaining broad concepts in your own words
- Multiple-choice and true-or-false practice questions
- Light and dark themes
- Searchable textbook and study-deck libraries
- Configurable Anki review settings
- Study alarms with custom descriptions

More textbooks, pre-built decks, and study features are planned for future releases.

## Download

1. Open the [Your Study Buddy releases page](https://github.com/vkai3333/Your-Study-Buddy-/releases).
2. Select the newest release.
3. Under **Assets**, download the file for your operating system:
   - **macOS:** the macOS ZIP file
   - **Windows:** the Windows installer (`.exe`)
4. Open the downloaded file and follow the installation prompts.

Because builds may not yet be code-signed, macOS Gatekeeper or Windows SmartScreen may display a warning when the app is opened for the first time.

## Development

### Run the Electron app

```sh
npm install
npm start
```

The Electron wrapper uses the application files in `dist/`.

### Build the macOS app

```sh
./build-mac-app.sh
```

The app bundle is created at `build/Your Study Buddy.app` and is ad-hoc signed for local use.

### Create a platform package

```sh
npm run make
```

Windows packages can also be generated with `.github/workflows/windows-build.yml`. The workflow can be started manually from GitHub Actions and runs automatically when a version tag beginning with `v` is pushed.

## Privacy

Your study sets and progress are stored locally on your computer. The app does not require an internet connection for its study features and does not upload your notes to an AI provider.

**Your Study Buddy — study smarter, completely free and offline.**
