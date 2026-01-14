# AlgoBot Mobile App

Flutter mobile application for AlgoBot. This is a **separate project** from the web admin dashboard and connects only via the backend API.

## Project Structure

```
algobot_app/
├── lib/
│   ├── config/
│   │   └── env.dart          # Environment configuration
│   ├── models/               # Data models
│   ├── services/             # API services
│   ├── screens/              # App screens
│   ├── widgets/              # Reusable widgets
│   └── main.dart             # App entry point
├── .env.local                # Environment variables (not committed)
├── .gitignore                # Git ignore rules
└── .cursorrules              # Cursor IDE rules
```

## Setup

### Prerequisites
- Flutter SDK (3.10.4 or higher)
- Dart SDK (3.10.4 or higher)
- Android Studio / Xcode (for mobile development)

### Installation

1. Install dependencies:
```bash
flutter pub get
```

2. Configure network access:
```bash
# IMPORTANT: Mobile devices need local network IP, not localhost
# See SETUP_NETWORK.md for detailed instructions
# Update .env.local with your local IP address:
# BACKEND_URL=http://YOUR_LOCAL_IP:4040/api
```

3. Run the app:
```bash
flutter run
```

## Environment Configuration

The app uses `.env.local` for configuration. Key variables:

- `BACKEND_URL` - Backend API endpoint (**use local network IP, not localhost**)
- `APP_NAME` - App display name (default: AlgoBot)
- `ENVIRONMENT` - Environment (development/production)

**⚠️ Important**: Mobile devices cannot use `localhost`. You must use your local network IP address (e.g., `http://192.168.1.100:4040/api`). See `SETUP_NETWORK.md` for instructions.

## Backend Connection

This app connects **only** to the backend API:
- Backend URL: Configured in `.env.local`
- No direct connection to web project
- All communication via REST API

## Development

### Code Organization
- Follow `.cursorrules` for coding standards
- Use environment variables from `lib/config/env.dart`
- Keep business logic separate from UI
- Use proper state management

### Testing
```bash
# Run tests
flutter test

# Run with coverage
flutter test --coverage
```

## Building

### Android
```bash
flutter build apk --release
flutter build appbundle --release
```

### iOS
```bash
flutter build ios --release
```

## Security

- Never commit `.env.local` to version control
- Use secure storage for sensitive data
- Validate all API responses
- Use HTTPS in production

## Separate Repository

This Flutter app is designed to be in a **separate repository** from the web project:
- Independent version control
- Separate deployment pipeline
- Only shares backend API

## Backend API

The backend API is shared between:
- Web Admin Dashboard (Next.js)
- Mobile App (Flutter)

Both connect to the same backend:
- **Web**: `http://localhost:4040/api` (same machine)
- **Mobile**: `http://YOUR_LOCAL_IP:4040/api` (network IP address)

See `SETUP_NETWORK.md` for network configuration details.
