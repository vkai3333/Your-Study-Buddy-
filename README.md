# Your Study Buddy

**Your Study Buddy** is a free, open-source desktop study application for macOS and Windows. It combines flashcards, notes, Anki-style spaced repetition, practice questions, Feynman prompts, textbook-aligned resources, and pre-built course libraries in one app.

No account is required. Study data, review progress, notes, and generated material are stored locally, and the built-in generator uses local rules rather than sending notes to a hosted AI service.

## Features

### Flashcards and study sets

- Create and edit flashcards, questions, and Feynman prompts. A set only needs one item of any supported type.
- Add formatted text, images, drawings, code blocks, and typeset mathematical notation.
- Organize sets in folders with drag and drop, duplicate sets, search the library, and star frequently used sets.
- Build multi-column sets whose fields can be selected and reversed for different study directions.
- Study configurable data banks such as countries, territories, and U.S. states without duplicating the underlying facts.
- Use images and diagrams on built-in cards where they materially help learning.

### Anki-style review

- Schedule cards through new, learning, review, and relearning states.
- Carry review state and due dates across days.
- Review one deck or select several active decks for a combined session.
- Flip cards, choose Again, Hard, Good, or Easy, and remove cards or decks from active Anki study with confirmation.
- Star active decks, track completed daily work, and customize scheduling options.
- Import and export Anki packages (`.apkg`).

The review experience follows Anki's core workflow, but this project is independent from Anki and is not an exact reimplementation of every Anki feature, add-on, or scheduling option.

### Notes workspace

- Create page notes or an expandable open canvas.
- Combine typed text, headings, lists, tables, images, handwriting, highlighting, and drawing in the same note.
- Move, resize, rotate, caption, reorder, and remove inserted images.
- Group notes into notebooks, choose notebook colors, duplicate notes, and drag notes between notebooks.
- Import PDFs as editable annotation notes with page controls and drawing tools.
- Create flashcards from an existing note.
- Show a note by itself in full-screen view.
- Export page notes or a selected region of an open note with a preview.

### Local study-material generator

Paste notes or import a supported document to generate editable study material. The current generator can:

- Detect headings, bullet hierarchies, definitions, tables, comparisons, sequences, timelines, people, places, and formulas.
- Produce flashcards, multiple-choice and true-or-false questions, and practical Feynman prompts.
- Preserve mathematical expressions and prefer complete, answerable prompts over sentence fragments.
- Apply subject-aware rules for science, mathematics, history, literature, and other common note styles.
- Filter duplicates and low-information items instead of adding cards only to increase the count.
- Add new material to an existing set while detecting duplicates, or create a separate set when requested.

Generation runs locally and deterministically. It is not model training and does not upload the user's documents.

### Import, export, and recovery

- Import PDF, PowerPoint (`.pptx`), TXT, CSV, TSV, images, notes exports, and Anki packages.
- Keep note importing separate from the Create workflow: importing a document into Notes creates a note.
- Export study sets as APKG, CSV, TSV, TXT, or a complete JSON archive containing cards, questions, and Feynman prompts.
- Export notes as PDF, HTML, TXT, or PNG where supported.
- Back up and restore user data, including study progress, notes, and imported PDFs.
- Inspect local storage health from Settings.

Large built-in collections and PDF annotation data are loaded only when needed to reduce startup time and memory use.

## Built-in content

### Textbook-aligned resources

The textbook library currently contains original study material aligned with:

1. Campbell Biology, 12th Edition
2. Vander's Human Physiology, 16th Edition
3. Atkins' Physical Chemistry, 8th Edition
4. Raven Biology of Plants, 8th Edition
5. Zumdahl Chemistry, 7th Edition
6. Chemistry: The Central Science, 12th Edition

The app does not distribute copies of these textbooks.

### Course and exam libraries

The app currently includes more than 35 built-in collections, organized into units or themes where appropriate.

**Advanced Placement**

- African American Studies
- Art History
- Biology
- Business with Personal Finance
- Calculus AB/BC, with an AB content toggle
- Chemistry
- Comparative Government and Politics
- Computer Science Principles
- Cybersecurity
- Environmental Science
- European History
- Human Geography
- Latin
- Macroeconomics
- Microeconomics
- Music Theory
- Precalculus, including all four course units
- Psychology
- Statistics
- U.S. Government and Politics
- U.S. History
- World History: Modern

**International Baccalaureate**

- Biology
- Chemistry
- Economics
- Environmental Systems and Societies
- Geography
- History of the Americas
- Mathematics: Analysis and Approaches
- Psychology

IB libraries use one collection with an SL/HL toggle rather than duplicating the shared material into separate sets.

**Admissions, professional, and reference collections**

- DAT review
- MCAT review
- USMLE Step 1 and Step 2 CK review
- SAT Vocabulary
- Countries of the World, including optional territories
- U.S. States
- U.S. Presidents

Built-in course decks are study aids, not official materials from the organizations that administer the associated courses or exams. Source links and image attribution are retained where applicable.

## Other tools

- Light and dark themes
- Searchable personal, textbook, course, and exam libraries
- Birthday profile easter egg
- Cross-platform keyboard shortcuts, including undo and redo in note editors
- Study alarms shown as **Coming soon** while the existing alarm code remains disabled

## Download

1. Open the [Your Study Buddy releases page](https://github.com/vkai3333/Your-Study-Buddy-/releases).
2. Select the newest release.
3. Under **Assets**, download the build for your operating system:
   - **macOS:** macOS ZIP
   - **Windows:** Windows installer (`.exe`)
4. Open the downloaded file and follow the installation prompts.

Builds may not be code-signed, so macOS Gatekeeper or Windows SmartScreen can display a warning the first time the app is opened.

## Development

### Requirements

- Node.js and npm
- macOS or Windows for platform-specific packaging

### Run locally

```sh
npm install
npm start
```

The Electron wrapper loads the application from `dist/`.

### Run regression tests

```sh
npm test
npm run test:syntax
```

The regression suite covers generator quality, imports, multi-field decks, review behavior, note persistence, and other high-risk workflows.

### Build and package

```sh
npm run package
npm run make
```

On macOS, the local helper can also be used:

```sh
./build-mac-app.sh
```

The macOS app bundle is written to `build/Your Study Buddy.app` and ad-hoc signed for local use. Windows packages use Electron Forge's Squirrel target and can also be generated by `.github/workflows/windows-build.yml`. The workflow supports manual runs and version tags beginning with `v`.

## Privacy and network access

Personal study sets, notes, backups, and review progress remain on the user's computer unless the user explicitly exports or moves them. Core studying, scheduling, note editing, and generation work offline. Downloading releases and opening externally linked references or media requires an internet connection.

## License

The application code is released under the ISC license. Third-party libraries, referenced source material, and externally sourced media remain subject to their respective licenses or terms.

**Your Study Buddy — one place to write, generate, organize, and review.**
