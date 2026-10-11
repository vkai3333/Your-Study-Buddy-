# Your Study Buddy for macOS

Your Study Buddy is a native, fully offline macOS study app with original study companions for biology, physiology, plant biology, general chemistry, and physical chemistry.

## Included courses

Every textbook starts in the textbook catalog. A user must choose **Add textbook** before it appears under **My textbooks**; the choice is saved locally. The app does not include due dates or task-duration estimates. Timers appear only inside Anki and Feynman study sessions.

The **Create** page processes pasted notes once and immediately saves a complete study set containing editable flashcards, practice questions, and broad Feynman prompts without sending the notes anywhere. It can also import `.apkg` packages and Anki-compatible TXT, CSV, and TSV note exports as flashcard-only sets. APKG processing happens locally in the Mac wrapper; readable text fields become card fronts and backs, while media-only notes are skipped. Modern zstd-compressed packages are supported when a compatible `zstd` executable is available; otherwise the app asks the user to re-export with Anki's older-version compatibility option. All generated material appears in one continuous workspace; there are no Flashcards/Questions or notes/manual-card switches. An inline manual-card form sits directly below the notes generator, and manually added cards are preserved when notes are generated. The newly generated set appears in **My study sets** immediately, and later draft edits are kept with **Update study set**. Feynman topics use multiword candidate scoring and diversity filtering inspired by KeyBERT's keyphrase-selection approach, without bundling a BERT model. Question generation follows offline Q-GEN-style patterns: fact-to-question transformations, original and altered True/False statements, key-term cloze deletions, and four-choice MCQs with local distractors. The question player provides clickable choices, written responses, scoring feedback, and model answers instead of treating questions like flip cards. Users can create as many separate study sets as local storage permits, add cards and questions manually, then save, revise, or delete each set independently. Deleting opens a dedicated confirmation screen that names the set and summarizes its contents before anything is removed. Choosing **Study** opens a dedicated in-app page—never an overlay—with regular flashcards, scheduled Anki review, question practice, and Feynman practice. Each mode then opens its own full study view. Custom Anki ratings save each card's next return time on this Mac.

The **Study** page puts **My study sets** first. Personal sets have a wrench control for editing. Added built-in decks provide **Study**, **Edit**, and **Delete** actions; built-in edits are saved locally while preserving the deck's unit structure, and deleting one returns its original version to the library so it can be added again. The built-in library contains AP Human Geography as one seven-unit collection with 656 unique highlighted-term cards and broad, sub-unit-style Feynman topics. AP World History is a separate nine-unit collection built from the supplied guide, with 407 explanation, comparison, cause-and-effect, historical-significance, and definition cards plus 91 concrete Feynman topics covering individual empires, movements, trade routes, tributary relationships, decolonization, and other unit-level ideas. Learners can add either collection and select any combination of units before studying.

Anki sessions display separate New, Learning, and Review counts. Cards flip in both directions. After an answer has been revealed once, its difficulty controls remain available even when the card is flipped back to the question. Minute-scale learning choices reinsert unresolved cards into the active session, with minute intervals capped at 15 minutes. A rating that schedules a card for one day or longer graduates it from today's session. The session ends only after all requested cards have graduated and all three counters reach zero.

Content rule: unit, chapter, and topic labels are organizational metadata only. They must not be included in an Anki card's question or answer. Card text should ask directly about the subject itself, without phrases such as "in Unit 3" or "in the context of Empires Expand."

## Open the app

Open `build/Your Study Buddy.app` in Finder. The included build targets Apple silicon Macs running macOS 13 or later.

## Rebuild

Run:

```sh
./build-mac-app.sh
```

The app bundle is created at `build/Your Study Buddy.app` and is ad-hoc signed for local use.
