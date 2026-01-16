import 'package:flutter_dotenv/flutter_dotenv.dart';

class Env {
  // Backend API Configuration
  static String get backendUrl {
    final url = dotenv.env['BACKEND_URL']?.trim();
    if (url == null || url.isEmpty) {
      throw Exception('BACKEND_URL is required in .env file');
    }
    return url.endsWith('/api') ? url : '$url/api';
  }
  static String get backendBaseUrl {
    final url = dotenv.env['BACKEND_URL']?.trim();
    if (url == null || url.isEmpty) {
      throw Exception('BACKEND_URL is required in .env file');
    }
    // Remove /api suffix if present, then remove trailing slashes
    final baseUrl = url.replaceAll(RegExp(r'/api/?$'), '');
    return baseUrl.replaceAll(RegExp(r'/+$'), '');
  }

  // App Configuration
  static String get appName => dotenv.env['APP_NAME'] ?? 'AlgoBot';
  static String get appVersion => dotenv.env['APP_VERSION'] ?? '1.0.0';

  // API Configuration
  static int get apiTimeout => int.tryParse(dotenv.env['API_TIMEOUT'] ?? '30000') ?? 30000;
  static int get apiRetryCount => int.tryParse(dotenv.env['API_RETRY_COUNT'] ?? '3') ?? 3;

  // Environment
  static String get environment => dotenv.env['ENVIRONMENT'] ?? 'development';
  static bool get isDevelopment => environment == 'development';
  static bool get isProduction => environment == 'production';

  // Validate required environment variables
  static void validate() {
    final requiredVars = ['BACKEND_URL'];
    final missingVars = <String>[];

    for (final varName in requiredVars) {
      if (dotenv.env[varName] == null || dotenv.env[varName]!.isEmpty) {
        missingVars.add(varName);
      }
    }

    if (missingVars.isNotEmpty && isProduction) {
      throw Exception(
        'Missing required environment variables: ${missingVars.join(', ')}',
      );
    }
  }
}
