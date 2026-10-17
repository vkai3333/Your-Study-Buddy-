#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="${0:A:h}"
BUILD_DIR="$SCRIPT_DIR/build"
FINAL_APP="$BUILD_DIR/Your Study Buddy.app"
STAGING_ROOT="$(mktemp -d "$BUILD_DIR/study-desk-build.XXXXXX")"
APP_DIR="$STAGING_ROOT/Your Study Buddy.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"
ICONSET_DIR="$STAGING_ROOT/YourStudyBuddy.iconset"
ICON_SOURCE="$STAGING_ROOT/icon_1024x1024.png"
MODULE_CACHE="/private/tmp/study-desk-swift-module-cache"

cleanup() {
  rm -rf "$STAGING_ROOT"
}
trap cleanup EXIT

"$SCRIPT_DIR/node_modules/.bin/esbuild" "$SCRIPT_DIR/dist/pdf-annotation.js" --bundle --format=iife --platform=browser --target=safari16 --minify --outfile="$SCRIPT_DIR/dist/pdf-annotation.bundle.js"

mkdir -p "$MACOS_DIR" "$RESOURCES_DIR/Web" "$ICONSET_DIR" "$MODULE_CACHE"

/usr/bin/swiftc \
  -parse-as-library \
  -target arm64-apple-macos13.0 \
  -module-cache-path "$MODULE_CACHE" \
  -framework AppKit \
  -framework WebKit \
  "$SCRIPT_DIR/macOS/StudyDeskApp.swift" \
  -o "$MACOS_DIR/YourStudyBuddy"

/bin/cp "$SCRIPT_DIR/dist/your-study-buddy-icon.png" "$ICON_SOURCE"

for spec in "16:16x16" "32:16x16@2x" "32:32x32" "64:32x32@2x" "128:128x128" "256:128x128@2x" "256:256x256" "512:256x256@2x" "512:512x512" "1024:512x512@2x"; do
  pixels="${spec%%:*}"
  name="${spec##*:}"
  /usr/bin/sips -z "$pixels" "$pixels" "$ICON_SOURCE" --out "$ICONSET_DIR/icon_${name}.png" >/dev/null
done

/bin/cp "$ICON_SOURCE" "$RESOURCES_DIR/YourStudyBuddy.png"
/bin/cp "$SCRIPT_DIR/macOS/Info.plist" "$CONTENTS_DIR/Info.plist"
/usr/libexec/PlistBuddy -c "Add :CFBundleIconFile string YourStudyBuddy.png" "$CONTENTS_DIR/Info.plist" 2>/dev/null || true
/bin/cp "$SCRIPT_DIR/dist/index.html" "$RESOURCES_DIR/Web/index.html"
/bin/cp "$SCRIPT_DIR/dist/styles.css" "$RESOURCES_DIR/Web/styles.css"
/bin/cp "$SCRIPT_DIR/dist/your-study-buddy-icon.png" "$RESOURCES_DIR/Web/your-study-buddy-icon.png"
/bin/cp "$SCRIPT_DIR/dist/vocabulary-data.js" "$RESOURCES_DIR/Web/vocabulary-data.js"
/bin/cp "$SCRIPT_DIR/dist/vanders-data.js" "$RESOURCES_DIR/Web/vanders-data.js"
/bin/cp "$SCRIPT_DIR/dist/vanders-glossary-data.js" "$RESOURCES_DIR/Web/vanders-glossary-data.js"
/bin/cp "$SCRIPT_DIR/dist/atkins-data.js" "$RESOURCES_DIR/Web/atkins-data.js"
/bin/cp "$SCRIPT_DIR/dist/raven-data.js" "$RESOURCES_DIR/Web/raven-data.js"
/bin/cp "$SCRIPT_DIR/dist/raven-glossary-data.js" "$RESOURCES_DIR/Web/raven-glossary-data.js"
/bin/cp "$SCRIPT_DIR/dist/zumdahl-data.js" "$RESOURCES_DIR/Web/zumdahl-data.js"
/bin/cp "$SCRIPT_DIR/dist/central-science-data.js" "$RESOURCES_DIR/Web/central-science-data.js"
/bin/cp "$SCRIPT_DIR/dist/source-expansions.js" "$RESOURCES_DIR/Web/source-expansions.js"
/bin/cp "$SCRIPT_DIR/dist/atkins-details.js" "$RESOURCES_DIR/Web/atkins-details.js"
/bin/cp "$SCRIPT_DIR/dist/aphug-data.js" "$RESOURCES_DIR/Web/aphug-data.js"
/bin/cp "$SCRIPT_DIR/dist/apworld-data.js" "$RESOURCES_DIR/Web/apworld-data.js"
/bin/cp "$SCRIPT_DIR/dist/apes-data.js" "$RESOURCES_DIR/Web/apes-data.js"
/bin/cp "$SCRIPT_DIR/dist/apeuro-data.js" "$RESOURCES_DIR/Web/apeuro-data.js"
/bin/cp "$SCRIPT_DIR/dist/apgov-data.js" "$RESOURCES_DIR/Web/apgov-data.js"
/bin/cp "$SCRIPT_DIR/dist/sat-vocabulary-data.js" "$RESOURCES_DIR/Web/sat-vocabulary-data.js"
/bin/cp "$SCRIPT_DIR/dist/appsych-data.js" "$RESOURCES_DIR/Web/appsych-data.js"
/bin/cp "$SCRIPT_DIR/dist/apush-textbook-data.js" "$RESOURCES_DIR/Web/apush-textbook-data.js"
/bin/cp "$SCRIPT_DIR/dist/history-visuals.js" "$RESOURCES_DIR/Web/history-visuals.js"
/bin/cp -R "$SCRIPT_DIR/dist/history-images" "$RESOURCES_DIR/Web/history-images"
/bin/cp "$SCRIPT_DIR/dist/apart-data.js" "$RESOURCES_DIR/Web/apart-data.js"
/bin/cp -R "$SCRIPT_DIR/dist/ap-art-history-images" "$RESOURCES_DIR/Web/ap-art-history-images"
/bin/cp "$SCRIPT_DIR/dist/apcsp-data.js" "$RESOURCES_DIR/Web/apcsp-data.js"
/bin/cp "$SCRIPT_DIR/dist/apbiology-data.js" "$RESOURCES_DIR/Web/apbiology-data.js"
/bin/cp "$SCRIPT_DIR/dist/science-diagrams.js" "$RESOURCES_DIR/Web/science-diagrams.js"
/bin/cp -R "$SCRIPT_DIR/dist/science-diagrams" "$RESOURCES_DIR/Web/science-diagrams"
/bin/cp "$SCRIPT_DIR/dist/apstats-data.js" "$RESOURCES_DIR/Web/apstats-data.js"
/bin/cp -R "$SCRIPT_DIR/dist/ap-statistics-images" "$RESOURCES_DIR/Web/ap-statistics-images"
/bin/cp "$SCRIPT_DIR/dist/apchem-data.js" "$RESOURCES_DIR/Web/apchem-data.js"
/bin/cp -R "$SCRIPT_DIR/dist/ap-chemistry-images" "$RESOURCES_DIR/Web/ap-chemistry-images"
/bin/cp "$SCRIPT_DIR/dist/apcalculus-data.js" "$RESOURCES_DIR/Web/apcalculus-data.js"
/bin/cp "$SCRIPT_DIR/dist/apprecalculus-data.js" "$RESOURCES_DIR/Web/apprecalculus-data.js"
/bin/cp "$SCRIPT_DIR/dist/apcomparative-government-data.js" "$RESOURCES_DIR/Web/apcomparative-government-data.js"
/bin/cp "$SCRIPT_DIR/dist/ap-economics-data.js" "$RESOURCES_DIR/Web/ap-economics-data.js"
/bin/cp "$SCRIPT_DIR/dist/ap-music-theory-data.js" "$RESOURCES_DIR/Web/ap-music-theory-data.js"
/bin/cp "$SCRIPT_DIR/dist/ap-latin-data.js" "$RESOURCES_DIR/Web/ap-latin-data.js"
/bin/cp "$SCRIPT_DIR/dist/ib-diploma-data.js" "$RESOURCES_DIR/Web/ib-diploma-data.js"
/bin/cp "$SCRIPT_DIR/dist/ib-course-crosswalk.js" "$RESOURCES_DIR/Web/ib-course-crosswalk.js"
/bin/cp "$SCRIPT_DIR/dist/ib-math-aa-data.js" "$RESOURCES_DIR/Web/ib-math-aa-data.js"
/bin/cp "$SCRIPT_DIR/dist/ib-history-americas-data.js" "$RESOURCES_DIR/Web/ib-history-americas-data.js"
/bin/cp "$SCRIPT_DIR/dist/ib-visuals.js" "$RESOURCES_DIR/Web/ib-visuals.js"
/bin/cp "$SCRIPT_DIR/dist/mcat-review-data.js" "$RESOURCES_DIR/Web/mcat-review-data.js"
/bin/cp "$SCRIPT_DIR/dist/mcat-biochem-expansion.js" "$RESOURCES_DIR/Web/mcat-biochem-expansion.js"
/bin/cp "$SCRIPT_DIR/dist/usmle-data.js" "$RESOURCES_DIR/Web/usmle-data.js"
/bin/cp "$SCRIPT_DIR/dist/usmle-expansion.js" "$RESOURCES_DIR/Web/usmle-expansion.js"
/bin/cp -R "$SCRIPT_DIR/dist/usmle-images" "$RESOURCES_DIR/Web/usmle-images"
/bin/cp "$SCRIPT_DIR/dist/admissions-exam-data.js" "$RESOURCES_DIR/Web/admissions-exam-data.js"
/bin/cp -R "$SCRIPT_DIR/dist/mcat-images" "$RESOURCES_DIR/Web/mcat-images"
/bin/cp "$SCRIPT_DIR/dist/ap-african-american-studies-data.js" "$RESOURCES_DIR/Web/ap-african-american-studies-data.js"
/bin/cp "$SCRIPT_DIR/dist/ap-cybersecurity-data.js" "$RESOURCES_DIR/Web/ap-cybersecurity-data.js"
/bin/cp "$SCRIPT_DIR/dist/ap-business-personal-finance-data.js" "$RESOURCES_DIR/Web/ap-business-personal-finance-data.js"
/bin/cp "$SCRIPT_DIR/dist/ap-new-course-expansions.js" "$RESOURCES_DIR/Web/ap-new-course-expansions.js"
/bin/cp "$SCRIPT_DIR/dist/formula-enrichments.js" "$RESOURCES_DIR/Web/formula-enrichments.js"
/bin/cp "$SCRIPT_DIR/dist/geography-locations-data.js" "$RESOURCES_DIR/Web/geography-locations-data.js"
/bin/cp "$SCRIPT_DIR/dist/us-civics-data.js" "$RESOURCES_DIR/Web/us-civics-data.js"
/bin/mkdir -p "$RESOURCES_DIR/Web/assets"
/bin/cp -R "$SCRIPT_DIR/dist/assets/geography" "$RESOURCES_DIR/Web/assets/geography"
/bin/cp -R "$SCRIPT_DIR/dist/assets/us-presidents" "$RESOURCES_DIR/Web/assets/us-presidents"
/bin/cp -R "$SCRIPT_DIR/dist/assets/us-states" "$RESOURCES_DIR/Web/assets/us-states"
/bin/mkdir -p "$RESOURCES_DIR/Web/vendor"
/bin/cp "$SCRIPT_DIR/dist/vendor/ts-fsrs.umd.js" "$RESOURCES_DIR/Web/vendor/ts-fsrs.umd.js"
/bin/cp "$SCRIPT_DIR/dist/vendor/ts-fsrs-LICENSE.txt" "$RESOURCES_DIR/Web/vendor/ts-fsrs-LICENSE.txt"
/bin/cp "$SCRIPT_DIR/dist/vendor/pdf.mjs" "$RESOURCES_DIR/Web/vendor/pdf.mjs"
/bin/cp "$SCRIPT_DIR/dist/vendor/pdf.worker.mjs" "$RESOURCES_DIR/Web/vendor/pdf.worker.mjs"
/bin/cp "$SCRIPT_DIR/dist/anki-selection-storage.js" "$RESOURCES_DIR/Web/anki-selection-storage.js"
/bin/cp "$SCRIPT_DIR/dist/app.js" "$RESOURCES_DIR/Web/app.js"
/bin/cp "$SCRIPT_DIR/dist/fullscreen.js" "$RESOURCES_DIR/Web/fullscreen.js"
/bin/cp "$SCRIPT_DIR/dist/table-editing.js" "$RESOURCES_DIR/Web/table-editing.js"
/bin/cp "$SCRIPT_DIR/dist/open-note-controls.js" "$RESOURCES_DIR/Web/open-note-controls.js"
/bin/cp "$SCRIPT_DIR/dist/pdf-annotation.js" "$RESOURCES_DIR/Web/pdf-annotation.js"
/bin/cp "$SCRIPT_DIR/dist/pdf-annotation.bundle.js" "$RESOURCES_DIR/Web/pdf-annotation.bundle.js"
/bin/cp "$SCRIPT_DIR/dist/birthday-easter-egg.js" "$RESOURCES_DIR/Web/birthday-easter-egg.js"
/usr/bin/codesign --force --deep --sign - "$APP_DIR"

if [[ -d "$FINAL_APP" ]]; then
  /bin/rm -rf -- "$FINAL_APP"
fi
/bin/mv "$APP_DIR" "$FINAL_APP"

echo "$FINAL_APP"
