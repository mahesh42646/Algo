import '../config/env.dart';
import 'api_handler.dart';
import 'auth_service.dart';

class AlgoTradingService {
  final ApiHandler _apiHandler = ApiHandler();
  final AuthService _authService = AuthService();

  String? get _userId => _authService.currentUser?.uid;

  // Start algo trading
  Future<Map<String, dynamic>> startAlgoTrade({
    required String symbol,
    required String apiId,
    required double maxLossPerTrade,
    required double maxLossOverall,
    required double maxProfitBook,
    required double amountPerLevel,
    required int numberOfLevels,
    bool useMargin = false,
  }) async {
    if (_userId == null) {
      throw Exception('User not logged in');
    }

    try {
      final response = await _apiHandler.post(
        '/algo-trading/$_userId/start',
        data: {
          'symbol': symbol,
          'apiId': apiId,
          'maxLossPerTrade': maxLossPerTrade,
          'maxLossOverall': maxLossOverall,
          'maxProfitBook': maxProfitBook,
          'amountPerLevel': amountPerLevel,
          'numberOfLevels': numberOfLevels,
          'useMargin': useMargin,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data['data'] ?? {};
      } else {
        throw Exception(response.data['error'] ?? 'Failed to start algo trading');
      }
    } catch (e) {
      if (Env.enableApiLogs) {
        print('Error starting algo trade: $e');
      }
      rethrow;
    }
  }

  // Stop algo trading
  Future<void> stopAlgoTrade(String symbol) async {
    if (_userId == null) {
      throw Exception('User not logged in');
    }

    try {
      final response = await _apiHandler.post(
        '/algo-trading/$_userId/stop',
        data: {'symbol': symbol},
      );

      if (response.statusCode != 200) {
        throw Exception(response.data['error'] ?? 'Failed to stop algo trading');
      }
    } catch (e) {
      if (Env.enableApiLogs) {
        print('Error stopping algo trade: $e');
      }
      rethrow;
    }
  }

  // Get trade status
  Future<Map<String, dynamic>> getTradeStatus(String symbol) async {
    if (_userId == null) {
      throw Exception('User not logged in');
    }

    try {
      final response = await _apiHandler.get(
        '/algo-trading/$_userId/status?symbol=$symbol',
      );

      if (response.statusCode == 200) {
        return response.data['data'] ?? {};
      } else {
        return {'isActive': false};
      }
    } catch (e) {
      if (Env.enableApiLogs) {
        print('Error getting trade status: $e');
      }
      return {'isActive': false};
    }
  }

  // Get all active trades
  Future<List<Map<String, dynamic>>> getActiveTrades() async {
    if (_userId == null) {
      throw Exception('User not logged in');
    }

    try {
      final response = await _apiHandler.get(
        '/algo-trading/$_userId/trades',
      );

      if (response.statusCode == 200) {
        final data = response.data['data'] ?? [];
        return List<Map<String, dynamic>>.from(data);
      } else {
        return [];
      }
    } catch (e) {
      if (Env.enableApiLogs) {
        print('Error getting active trades: $e');
      }
      return [];
    }
  }
}
