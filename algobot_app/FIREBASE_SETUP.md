# Firebase Setup Guide

## Prerequisites

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

## Setup Steps

### 1. Create Firebase Project (if not exists)

Go to [Firebase Console](https://console.firebase.google.com/) and create a new project or use existing project `algo-bot-396c8`.

### 2. Enable Email/Password Authentication

1. Go to Firebase Console → Authentication
2. Click "Get Started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Enable "Email link (passwordless sign-in)" if needed

### 3. Configure Flutter App

#### Option A: Using FlutterFire CLI (Recommended)

```bash
cd algobot_app
export PATH="$PATH:$HOME/.pub-cache/bin"
flutterfire configure --project=algo-bot-396c8 --platforms=ios,android
```

This will automatically:
- Download `google-services.json` (Android)
- Download `GoogleService-Info.plist` (iOS)
- Update configuration files

#### Option B: Manual Setup

**For Android:**

1. Download `google-services.json` from Firebase Console
   - Go to Project Settings → Your apps → Android app
   - Download `google-services.json`
2. Place it in `android/app/google-services.json`
3. Update `android/build.gradle`:
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```
4. Update `android/app/build.gradle`:
```gradle
apply plugin: 'com.google.gms.google-services'
```

**For iOS:**

1. Download `GoogleService-Info.plist` from Firebase Console
   - Go to Project Settings → Your apps → iOS app
   - Download `GoogleService-Info.plist`
2. Place it in `ios/Runner/GoogleService-Info.plist`
3. Add to Xcode project (drag and drop in Xcode)

### 4. Configure Email Templates (Optional)

In Firebase Console → Authentication → Templates:
- Customize email verification template
- Customize password reset template

### 5. Test the Setup

Run the app:
```bash
flutter run
```

## Authentication Flow

1. **Sign Up Flow:**
   - User enters email → Sends verification code
   - User clicks link in email → Email verified
   - User sets password → Account created

2. **Login Flow:**
   - User enters email and password → Logged in

3. **Password Reset Flow:**
   - User enters email → Reset code sent
   - User clicks link in email → Sets new password

## Troubleshooting

### Firebase not initialized
- Make sure `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) are in correct locations
- Run `flutter clean` and `flutter pub get`

### Email verification not working
- Check Firebase Console → Authentication → Templates
- Ensure email provider is enabled
- Check spam folder

### Build errors
- Make sure Firebase dependencies are added: `firebase_core` and `firebase_auth`
- Run `flutter pub get`
- Clean build: `flutter clean && flutter pub get`

## Security Rules

Configure Firebase Security Rules in Firebase Console → Firestore/Database → Rules (if using Firestore).

For authentication only, default rules are usually sufficient.
