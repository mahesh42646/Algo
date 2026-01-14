# Firebase Quick Setup

## Step 1: Login to Firebase

Run this command in your terminal:
```bash
firebase login
```

This will open a browser window for you to authenticate with your Google account.

## Step 2: Configure Flutter App

After logging in, run:
```bash
cd algobot_app
export PATH="$PATH:$HOME/.pub-cache/bin"
flutterfire configure --project=algo-bot-396c8 --platforms=ios,android
```

If the project doesn't exist, you can:
1. Create it in Firebase Console: https://console.firebase.google.com/
2. Or let FlutterFire create it for you

## Step 3: Enable Email/Password Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `algo-bot-396c8`
3. Go to **Authentication** → **Sign-in method**
4. Click on **Email/Password**
5. Enable it and click **Save**

## Step 4: Test the App

```bash
flutter run
```

## Alternative: Manual Configuration

If FlutterFire CLI doesn't work, you can manually configure:

### For Android:
1. Go to Firebase Console → Project Settings → Your apps
2. Add Android app (if not added)
3. Download `google-services.json`
4. Place it in `android/app/google-services.json`
5. Update `android/build.gradle`:
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```
6. Update `android/app/build.gradle`:
```gradle
apply plugin: 'com.google.gms.google-services'
```

### For iOS:
1. Go to Firebase Console → Project Settings → Your apps
2. Add iOS app (if not added)
3. Download `GoogleService-Info.plist`
4. Place it in `ios/Runner/GoogleService-Info.plist`
5. Add to Xcode project (drag and drop in Xcode)

## Troubleshooting

- **"Failed to authenticate"**: Run `firebase login` first
- **"Project not found"**: Create project in Firebase Console first
- **Build errors**: Run `flutter clean && flutter pub get`
