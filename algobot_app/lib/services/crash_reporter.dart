/// Crash Reporter Service
/// Captures, logs, and reports app crashes for debugging
///
/// Usage in main.dart:
/// ```dart
/// void main() async {
///   WidgetsFlutterBinding.ensureInitialized();
///   await CrashReporter.initialize();
///   runApp(const AlgoBotApp());
/// }
/// ```

import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CrashLog {
  final DateTime timestamp;
  final String error;
  final String? stackTrace;
  final String? context;
  final Map<String, dynamic>? metadata;

  CrashLog({
    required this.timestamp,
    required this.error,
    this.stackTrace,
    this.context,
    this.metadata,
  });

  Map<String, dynamic> toJson() => {
    'timestamp': timestamp.toIso8601String(),
    'error': error,
    'stackTrace': stackTrace,
    'context': context,
    'metadata': metadata,
  };

  @override
  String toString() {
    final buffer = StringBuffer();
    buffer.writeln('=== CRASH LOG ===');
    buffer.writeln('Time: ${timestamp.toIso8601String()}');
    buffer.writeln('Error: $error');
    if (context != null) buffer.writeln('Context: $context');
    if (stackTrace != null) buffer.writeln('Stack:\n$stackTrace');
    if (metadata != null) buffer.writeln('Metadata: $metadata');
    buffer.writeln('=================');
    return buffer.toString();
  }
}

class CrashReporter {
  static final CrashReporter _instance = CrashReporter._internal();
  factory CrashReporter() => _instance;
  CrashReporter._internal();

  final List<CrashLog> _crashLogs = [];
  static const int _maxLogs = 100;
  static const String _prefsKey = 'crash_logs';

  bool _isInitialized = false;
  String? _currentScreen;
  String? _currentUserId;
  Map<String, dynamic> _deviceInfo = {};

  /// Initialize crash reporting
  static Future<void> initialize() async {
    final reporter = CrashReporter();
    
    // Collect device info
    reporter._deviceInfo = {
      'platform': Platform.operatingSystem,
      'version': Platform.operatingSystemVersion,
      'locale': Platform.localeName,
      'dartVersion': Platform.version,
    };

    // Set up Flutter error handler
    FlutterError.onError = (FlutterErrorDetails details) {
      reporter._handleFlutterError(details);
    };

    // Set up platform dispatcher error handler
    PlatformDispatcher.instance.onError = (error, stack) {
      reporter._handlePlatformError(error, stack);
      return true;
    };

    // Load previous crash logs
    await reporter._loadCrashLogs();

    reporter._isInitialized = true;

    if (kDebugMode) {
      print('🔧 CrashReporter initialized');
      print('   Previous crashes: ${reporter._crashLogs.length}');
    }
  }

  /// Wrap app with crash zone
  static void runAppWithCrashReporting(Widget app) {
    runZonedGuarded(
      () => runApp(app),
      (error, stackTrace) {
        CrashReporter()._logCrash(
          error: error.toString(),
          stackTrace: stackTrace.toString(),
          context: 'runZonedGuarded',
        );
      },
    );
  }

  /// Set current screen for context
  void setCurrentScreen(String screenName) {
    _currentScreen = screenName;
  }

  /// Set current user ID for context
  void setCurrentUser(String? userId) {
    _currentUserId = userId;
  }

  /// Log a crash manually
  void logCrash({
    required String error,
    String? stackTrace,
    String? context,
    Map<String, dynamic>? metadata,
  }) {
    _logCrash(
      error: error,
      stackTrace: stackTrace,
      context: context,
      metadata: metadata,
    );
  }

  /// Log a non-fatal error
  void logError(String error, {String? context}) {
    if (kDebugMode) {
      print('⚠️ Non-fatal error: $error');
      if (context != null) print('   Context: $context');
    }
  }

  /// Get all crash logs
  List<CrashLog> get crashLogs => List.unmodifiable(_crashLogs);

  /// Get recent crashes (last 24 hours)
  List<CrashLog> get recentCrashes {
    final cutoff = DateTime.now().subtract(const Duration(hours: 24));
    return _crashLogs.where((log) => log.timestamp.isAfter(cutoff)).toList();
  }

  /// Clear all crash logs
  Future<void> clearLogs() async {
    _crashLogs.clear();
    await _saveCrashLogs();
  }

  /// Export crash logs as string
  String exportLogs() {
    if (_crashLogs.isEmpty) return 'No crash logs';
    return _crashLogs.map((log) => log.toString()).join('\n');
  }

  /// Get crash summary
  Map<String, dynamic> getCrashSummary() {
    final now = DateTime.now();
    final last24h = _crashLogs.where(
      (log) => log.timestamp.isAfter(now.subtract(const Duration(hours: 24))),
    ).length;
    final lastWeek = _crashLogs.where(
      (log) => log.timestamp.isAfter(now.subtract(const Duration(days: 7))),
    ).length;

    // Group by error type
    final errorTypes = <String, int>{};
    for (final log in _crashLogs) {
      final type = _extractErrorType(log.error);
      errorTypes[type] = (errorTypes[type] ?? 0) + 1;
    }

    return {
      'totalCrashes': _crashLogs.length,
      'last24Hours': last24h,
      'lastWeek': lastWeek,
      'errorTypes': errorTypes,
      'lastCrash': _crashLogs.isNotEmpty
          ? _crashLogs.last.timestamp.toIso8601String()
          : null,
    };
  }

  // Private methods

  void _handleFlutterError(FlutterErrorDetails details) {
    if (kDebugMode) {
      FlutterError.dumpErrorToConsole(details);
    }

    _logCrash(
      error: details.exceptionAsString(),
      stackTrace: details.stack?.toString(),
      context: 'FlutterError: ${details.context?.toString() ?? 'unknown'}',
      metadata: {
        'library': details.library ?? 'unknown',
        'silent': details.silent,
      },
    );
  }

  void _handlePlatformError(Object error, StackTrace stack) {
    if (kDebugMode) {
      print('🔴 Platform Error: $error');
      print(stack);
    }

    _logCrash(
      error: error.toString(),
      stackTrace: stack.toString(),
      context: 'PlatformDispatcher',
    );
  }

  void _logCrash({
    required String error,
    String? stackTrace,
    String? context,
    Map<String, dynamic>? metadata,
  }) {
    final log = CrashLog(
      timestamp: DateTime.now(),
      error: error,
      stackTrace: stackTrace,
      context: context ?? _currentScreen,
      metadata: {
        ...?metadata,
        'userId': _currentUserId,
        'screen': _currentScreen,
        'device': _deviceInfo,
      },
    );

    _crashLogs.add(log);

    // Keep only recent logs
    while (_crashLogs.length > _maxLogs) {
      _crashLogs.removeAt(0);
    }

    // Save async
    _saveCrashLogs();

    if (kDebugMode) {
      print('💥 CRASH LOGGED:');
      print(log);
    }
  }

  Future<void> _loadCrashLogs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final logsJson = prefs.getStringList(_prefsKey);
      
      if (logsJson != null) {
        // Parse stored logs (simplified - store as strings)
        for (final logStr in logsJson) {
          try {
            final parts = logStr.split('|||');
            if (parts.length >= 2) {
              _crashLogs.add(CrashLog(
                timestamp: DateTime.tryParse(parts[0]) ?? DateTime.now(),
                error: parts[1],
                stackTrace: parts.length > 2 ? parts[2] : null,
                context: parts.length > 3 ? parts[3] : null,
              ));
            }
          } catch (e) {
            // Skip invalid log
          }
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('Failed to load crash logs: $e');
      }
    }
  }

  Future<void> _saveCrashLogs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final logsJson = _crashLogs.map((log) {
        return '${log.timestamp.toIso8601String()}|||${log.error}|||${log.stackTrace ?? ''}|||${log.context ?? ''}';
      }).toList();
      await prefs.setStringList(_prefsKey, logsJson);
    } catch (e) {
      if (kDebugMode) {
        print('Failed to save crash logs: $e');
      }
    }
  }

  String _extractErrorType(String error) {
    // Extract common error types
    final patterns = [
      RegExp(r'(Null\w*Exception)'),
      RegExp(r'(RangeError)'),
      RegExp(r'(TypeError)'),
      RegExp(r'(FormatException)'),
      RegExp(r'(StateError)'),
      RegExp(r'(AssertionError)'),
      RegExp(r'(NetworkError|SocketException|DioError)'),
      RegExp(r'(Firebase\w+Exception)'),
      RegExp(r'(PlatformException)'),
    ];

    for (final pattern in patterns) {
      final match = pattern.firstMatch(error);
      if (match != null) return match.group(1)!;
    }

    return 'Unknown';
  }
}

/// Widget to track screen changes for crash context
class CrashReportingNavigatorObserver extends NavigatorObserver {
  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    _updateCurrentScreen(route);
  }

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {
    if (previousRoute != null) {
      _updateCurrentScreen(previousRoute);
    }
  }

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) {
    if (newRoute != null) {
      _updateCurrentScreen(newRoute);
    }
  }

  void _updateCurrentScreen(Route<dynamic> route) {
    final screenName = route.settings.name ?? route.runtimeType.toString();
    CrashReporter().setCurrentScreen(screenName);
  }
}

/// Error boundary widget
class CrashBoundary extends StatefulWidget {
  final Widget child;
  final Widget Function(FlutterErrorDetails)? errorBuilder;

  const CrashBoundary({
    super.key,
    required this.child,
    this.errorBuilder,
  });

  @override
  State<CrashBoundary> createState() => _CrashBoundaryState();
}

class _CrashBoundaryState extends State<CrashBoundary> {
  FlutterErrorDetails? _error;

  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return widget.errorBuilder?.call(_error!) ?? _defaultErrorWidget();
    }

    return widget.child;
  }

  Widget _defaultErrorWidget() {
    return Material(
      child: Container(
        color: Colors.white,
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            const Text(
              'Something went wrong',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              _error?.exceptionAsString() ?? 'Unknown error',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                setState(() => _error = null);
              },
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }
}

/// Extension for safe operations
extension SafeOperations<T> on T? {
  /// Safely execute operation with fallback
  R safeMap<R>(R Function(T) mapper, R fallback) {
    if (this == null) return fallback;
    try {
      return mapper(this as T);
    } catch (e) {
      CrashReporter().logError('SafeMap failed: $e');
      return fallback;
    }
  }
}

/// Safe JSON parsing utilities
class SafeJson {
  /// Safely get string from JSON
  static String getString(Map<String, dynamic>? json, String key, {String defaultValue = ''}) {
    if (json == null) return defaultValue;
    final value = json[key];
    if (value == null) return defaultValue;
    if (value is String) return value;
    return value.toString();
  }

  /// Safely get int from JSON
  static int getInt(Map<String, dynamic>? json, String key, {int defaultValue = 0}) {
    if (json == null) return defaultValue;
    final value = json[key];
    if (value == null) return defaultValue;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value) ?? defaultValue;
    return defaultValue;
  }

  /// Safely get double from JSON
  static double getDouble(Map<String, dynamic>? json, String key, {double defaultValue = 0.0}) {
    if (json == null) return defaultValue;
    final value = json[key];
    if (value == null) return defaultValue;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? defaultValue;
    return defaultValue;
  }

  /// Safely get bool from JSON
  static bool getBool(Map<String, dynamic>? json, String key, {bool defaultValue = false}) {
    if (json == null) return defaultValue;
    final value = json[key];
    if (value == null) return defaultValue;
    if (value is bool) return value;
    if (value is String) return value.toLowerCase() == 'true';
    if (value is int) return value != 0;
    return defaultValue;
  }

  /// Safely get list from JSON
  static List<T> getList<T>(Map<String, dynamic>? json, String key) {
    if (json == null) return [];
    final value = json[key];
    if (value == null) return [];
    if (value is List) return value.whereType<T>().toList();
    return [];
  }

  /// Safely get map from JSON
  static Map<String, dynamic> getMap(Map<String, dynamic>? json, String key) {
    if (json == null) return {};
    final value = json[key];
    if (value == null) return {};
    if (value is Map<String, dynamic>) return value;
    if (value is Map) return Map<String, dynamic>.from(value);
    return {};
  }
}
