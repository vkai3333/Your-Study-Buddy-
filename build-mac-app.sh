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
/bin/cp "$SCRIPT_DIR/dist/atkins-data.js" "$RESOURCES_DIR/Web/atkins-data.js"
/bin/cp "$SCRIPT_DIR/dist/raven-data.js" "$RESOURCES_DIR/Web/raven-data.js"
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
/bin/cp "$SCRIPT_DIR/dist/app.js" "$RESOURCES_DIR/Web/app.js"
/usr/bin/codesign --force --deep --sign - "$APP_DIR"

if [[ -d "$FINAL_APP" ]]; then
  /bin/rm -rf -- "$FINAL_APP"
fi
/bin/mv "$APP_DIR" "$FINAL_APP"

echo "$FINAL_APP"
