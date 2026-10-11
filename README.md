# Your Study Buddy
# Your Study Buddy

**Your Study Buddy** is a completely free, open-source, and fully offline study application for macOS and Windows. Unlike many modern study tools, it does not rely on AI assistants or require an internet connection.

Our goal is to create a better, free, and open-source alternative to Anki. Like Anki, Your Study Buddy allows users to create and import flashcards, but it also offers a growing collection of pre-built flashcard decks, textbooks, and additional study tools.

## Features

### Flashcards
- Create and customize your own flashcards.
- Import existing flashcard decks.
- Access a collection of pre-made flashcard sets.

### Built-in Textbooks
Your Study Buddy currently includes six textbooks:

1. Campbell's Biology
2. Raven's Plant Anatomy
3. Vander's Human Physiology
4. Kumbahl Chemistry
5. Atkins' Chemistry
6. Chemistry: The General Science

### Pre-made Flashcard Decks
Seven flashcard decks are currently available:

1. AP Psychology
2. AP U.S. Government and Politics
3. AP Environmental Science
4. AP European History
5. AP World History
6. AP Human Geography
7. SAT Vocabulary

### Additional Study Tools
Your Study Buddy also includes **Feynman Technique-based study tools** to help users strengthen their understanding by explaining concepts in their own words.

More textbooks, flashcard decks, and features are planned for future updates.

**Note:** Your Study Buddy does not currently focus on mathematics or physics, as these subjects are better suited to problem-solving and practice-based learning rather than traditional flashcard memorization.

## How to Download

1. Visit the [Your Study Buddy GitHub repository](https://github.com/vkai3333/Your-Study-Buddy-).
2. Click the green **Code** button.
3. Select **Download ZIP** from the dropdown menu.
4. Once downloaded, extract the ZIP file.
5. Open the extracted folder and navigate to the **builds** folder.
6. Locate the version of **Your Study Buddy** for your operating system (macOS or Windows).
7. Open the application to get started.

**Your Study Buddy — Study smarter, completely free and offline.**

## Rebuild

Run:

```sh
./build-mac-app.sh
```

The app bundle is created at `build/Your Study Buddy.app` and is ad-hoc signed for local use.

## Windows and Electron

The Electron wrapper reuses the same files in `dist/` as the native Mac app.

```sh
npm install
npm start
```

To create a platform package, run `npm run make`. Windows installers are built automatically by `.github/workflows/windows-build.yml` when a version tag beginning with `v` is pushed, or when the workflow is started manually from GitHub Actions.
