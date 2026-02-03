#!/usr/bin/env bash
# Builds a single release APK that runs on any Android device (all CPU architectures).
# Do not use --split-per-abi or you will get separate APKs per ABI.
# Output: build/app/outputs/flutter-apk/app-release.apk
set -e
cd "$(dirname "$0")"
flutter build apk --release
echo "Universal APK: build/app/outputs/flutter-apk/app-release.apk"
