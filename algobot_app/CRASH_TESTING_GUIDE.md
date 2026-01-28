# AlgoBot Crash Testing Guide

This guide helps you identify and fix crashes in the AlgoBot mobile app.

## Quick Start

### Run All Tests
```bash
cd algobot_app
flutter test
```

### Run Specific Test Files
```bash
# Unit and widget crash tests
flutter test test/crash_tests.dart -v

# Integration crash tests
flutter test test/integration_crash_tests.dart -v

# Basic widget tests
flutter test test/widget_test.dart -v
```

## Test Coverage

### 1. Widget Crash Tests (`test/crash_tests.dart`)
Tests for common widget-level crashes:
- Null context handling
- Empty list rendering
- Rapid setState calls
- Theme changes
- PageView navigation
- ScrollController disposal
- Deep widget nesting
- Image loading errors
- Form validation
- Animation controller lifecycle

### 2. Integration Crash Tests (`test/integration_crash_tests.dart`)
Tests for app-level crashes:
- Home page states (loading, error, data)
- Navigation flow
- Coin detail with null/empty data
- User profile edge cases
- Trading screen boundary values
- Form submissions
- API response handling
- Memory stress tests
- Concurrent operations

## Crash Reporter Integration

The app now includes a built-in crash reporter (`lib/services/crash_reporter.dart`) that:
- Captures Flutter errors automatically
- Logs platform errors
- Tracks async errors via `runZonedGuarded`
- Stores crash logs persistently
- Provides crash summaries

### View Crash Logs (Debug Mode)
```dart
// In any widget or service
final crashes = CrashReporter().crashLogs;
final summary = CrashReporter().getCrashSummary();
print(CrashReporter().exportLogs());
```

### Manual Crash Logging
```dart
CrashReporter().logCrash(
  error: 'Description of the crash',
  stackTrace: StackTrace.current.toString(),
  context: 'ScreenName or operation',
  metadata: {'userId': 'abc123'},
);
```

## Common Crash Causes & Fixes

### 1. Null Pointer Exceptions
**Symptom:** App crashes when accessing data
**Test:** `test/crash_tests.dart` - "Should handle null JSON values"
**Fix:**
```dart
// Before (crashes)
final name = user['name'] as String;

// After (safe)
final name = user['name'] as String? ?? 'Unknown';
// Or use SafeJson utility
final name = SafeJson.getString(user, 'name', defaultValue: 'Unknown');
```

### 2. setState After Dispose
**Symptom:** Crash during navigation or when closing screens
**Test:** `test/crash_tests.dart` - "Should handle setState after dispose"
**Fix:**
```dart
// Before (crashes)
Future.delayed(Duration(seconds: 1), () {
  setState(() => _loading = false);
});

// After (safe)
Future.delayed(Duration(seconds: 1), () {
  if (mounted) {
    setState(() => _loading = false);
  }
});
```

### 3. List Index Out of Bounds
**Symptom:** Crash when accessing list elements
**Test:** `test/crash_tests.dart` - "Should handle empty and malformed lists"
**Fix:**
```dart
// Before (crashes)
final first = myList[0];

// After (safe)
final first = myList.isNotEmpty ? myList[0] : null;
// Or
final first = myList.firstOrNull;
```

### 4. Type Cast Errors
**Symptom:** Crash when parsing API responses
**Test:** `test/crash_tests.dart` - "Should handle type mismatches in JSON"
**Fix:**
```dart
// Before (crashes)
final price = json['price'] as double;

// After (safe)
final price = SafeJson.getDouble(json, 'price', defaultValue: 0.0);
```

### 5. Animation Controller Not Disposed
**Symptom:** Memory leaks and eventual crash
**Test:** `test/crash_tests.dart` - "Should handle animation controller disposal"
**Fix:**
```dart
class _MyWidgetState extends State<MyWidget> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: Duration(seconds: 1));
  }

  @override
  void dispose() {
    _controller.dispose(); // Always dispose!
    super.dispose();
  }
}
```

### 6. Network Timeout Not Handled
**Symptom:** App hangs or crashes on slow network
**Test:** `test/crash_tests.dart` - "Should handle Future timeout"
**Fix:**
```dart
// Before (hangs indefinitely)
final response = await apiCall();

// After (with timeout)
final response = await apiCall().timeout(
  Duration(seconds: 10),
  onTimeout: () => throw TimeoutException('Request timed out'),
);
```

### 7. Provider Not Found
**Symptom:** "Could not find the correct Provider" error
**Fix:**
```dart
// Ensure provider is above the widget that needs it
MaterialApp(
  home: ChangeNotifierProvider(
    create: (_) => MyProvider(),
    child: MyScreen(), // This can access MyProvider
  ),
);
```

## Running Tests on Device

### Debug Build with Crash Reporting
```bash
flutter run --debug
```
Crashes will be logged to console and stored in SharedPreferences.

### Profile Build (for performance issues)
```bash
flutter run --profile
```
Use this to identify memory leaks and performance crashes.

### Release Build Test
```bash
flutter build apk --release
flutter install
```
Test the actual release build, as some crashes only occur in release mode.

## Stress Testing

### Memory Stress Test
```bash
# Run the memory stress tests
flutter test test/crash_tests.dart --name "Memory"
```

### Rapid Navigation Test
```bash
flutter test test/integration_crash_tests.dart --name "Navigation"
```

## Debugging Tips

### 1. Enable Verbose Logging
In `.env`:
```
ENABLE_API_LOGS=true
```

### 2. Check Device Logs
```bash
# Android
adb logcat | grep -i flutter

# iOS
flutter logs
```

### 3. Check Crash Summary
Add this to any screen for debugging:
```dart
ElevatedButton(
  onPressed: () {
    final summary = CrashReporter().getCrashSummary();
    print(summary);
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Crash Summary'),
        content: Text(summary.toString()),
      ),
    );
  },
  child: Text('View Crashes'),
)
```

### 4. Export Crash Logs
```dart
final logs = CrashReporter().exportLogs();
// Share or email the logs
```

## Platform-Specific Crashes

### Android
- Check `minSdkVersion` in `android/app/build.gradle.kts`
- Check for missing permissions in `AndroidManifest.xml`
- Check ProGuard rules if using obfuscation

### iOS
- Check minimum deployment target in Xcode
- Check `Info.plist` for required permissions
- Check for ARC memory issues

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run Tests
  run: |
    cd algobot_app
    flutter test --coverage
    
- name: Check Coverage
  run: |
    genhtml coverage/lcov.info -o coverage/html
```

## Files Created

| File | Purpose |
|------|---------|
| `test/crash_tests.dart` | Unit tests for crash scenarios |
| `test/integration_crash_tests.dart` | Integration tests for app flows |
| `test/widget_test.dart` | Basic widget tests |
| `lib/services/crash_reporter.dart` | Runtime crash capture and logging |

## Next Steps

1. Run all tests: `flutter test`
2. Fix any failing tests
3. Run the app in debug mode and reproduce crashes
4. Check `CrashReporter().exportLogs()` for crash details
5. Fix identified issues using the patterns above
6. Re-run tests to verify fixes
