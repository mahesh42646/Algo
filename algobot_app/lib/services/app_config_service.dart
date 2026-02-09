import 'package:flutter/foundation.dart';
import '../config/env.dart';
import 'api_handler.dart';

/// Fetches and caches app config from backend (app name, icon, theme, language, charges).
/// App can use this to update theme, title, and locale without a new build.
class AppConfigService extends ChangeNotifier {
  static final AppConfigService _instance = AppConfigService._();
  factory AppConfigService() => _instance;

  AppConfigService._();

  final ApiHandler _api = ApiHandler();
  AppConfig? _config;
  bool _loaded = false;

  AppConfig? get config => _config;
  bool get loaded => _loaded;

  String get appName => _config?.appName ?? Env.appName;
  String get appIconUrl => _config?.appIconUrl ?? '';
  String get theme => _config?.theme ?? 'system';
  String get language => _config?.language ?? 'en';
  String get platformChargeType => _config?.platformChargeType ?? 'percent';
  double get platformChargeValue => _config?.platformChargeValue ?? 0.3;

  ThemeMode get themeMode {
    switch (_config?.theme) {
      case 'light': return ThemeMode.light;
      case 'dark': return ThemeMode.dark;
      default: return ThemeMode.system;
    }
  }

  /// Call on app startup and optionally on resume.
  Future<void> fetch() async {
    try {
      final response = await _api.get('/app-config');
      if (response.statusCode == 200 && response.data != null) {
        final data = response.data is Map ? response.data as Map<String, dynamic> : null;
        final d = data?['data'];
        if (d is Map) {
          _config = AppConfig(
            appName: (d['appName'] as String?) ?? Env.appName,
            appIconUrl: (d['appIconUrl'] as String?) ?? '',
            theme: (d['theme'] as String?) ?? 'system',
            language: (d['language'] as String?) ?? 'en',
            platformChargeType: (d['platformChargeType'] as String?) ?? 'percent',
            platformChargeValue: (d['platformChargeValue'] as num?)?.toDouble() ?? 0.3,
          );
          _loaded = true;
          notifyListeners();
        }
      }
    } catch (e) {
      if (kDebugMode) debugPrint('[AppConfig] fetch error: $e');
    }
  }
}

class AppConfig {
  final String appName;
  final String appIconUrl;
  final String theme;
  final String language;
  final String platformChargeType;
  final double platformChargeValue;

  AppConfig({
    required this.appName,
    required this.appIconUrl,
    required this.theme,
    required this.language,
    required this.platformChargeType,
    required this.platformChargeValue,
  });
}
