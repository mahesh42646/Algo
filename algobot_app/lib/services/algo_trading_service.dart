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
    int leverage = 1,
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
          'leverage': leverage,
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

  // Get profit details
  Future<Map<String, dynamic>> getProfitDetails({String period = '7d'}) async {
    if (_userId == null) {
      throw Exception('User not logged in');
    }

    try {
      final response = await _apiHandler.get(
        '/algo-trading/$_userId/profits?period=$period',
      );

      if (response.statusCode == 200) {
        return response.data['data'] ?? {
          'totalProfit': 0.0,
          'todayProfit': 0.0,
          'tradeHistory': [],
        };
      } else {
        return {
          'totalProfit': 0.0,
          'todayProfit': 0.0,
          'tradeHistory': [],
        };
      }
    } catch (e) {
      if (Env.enableApiLogs) {
        print('Error getting profit details: $e');
      }
      return {
        'totalProfit': 0.0,
        'todayProfit': 0.0,
        'tradeHistory': [],
      };
    }
  }

  // Start manual trade
  Future<Map<String, dynamic>> startManualTrade({
    required String symbol,
    required String apiId,
    required double amountPerLevel,
    required int numberOfLevels,
  }) async {
    if (_userId == null) {
      throw Exception('User not logged in');
    }

    try {
      final response = await _apiHandler.post(
        '/algo-trading/$_userId/start-manual',
        data: {
          'symbol': symbol,
          'apiId': apiId,
          'amountPerLevel': amountPerLevel,
          'numberOfLevels': numberOfLevels,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data['data'] ?? {};
      } else {
        throw Exception(response.data['error'] ?? 'Failed to start manual trade');
      }
    } catch (e) {
      if (Env.enableApiLogs) {
        print('Error starting manual trade: $e');
      }
      rethrow;
    }
  }

  // Start admin strategy
  Future<Map<String, dynamic>> startAdminStrategy({String? symbol}) async {
    if (_userId == null) {
      throw Exception('User not logged in');
    }

    try {
      final response = await _apiHandler.post(
        '/algo-trading/$_userId/start-admin',
        data: {
          if (symbol != null) 'symbol': symbol,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data['data'] ?? {};
      } else {
        throw Exception(response.data['error'] ?? 'Failed to start admin strategy');
      }
    } catch (e) {
      if (Env.enableApiLogs) {
        print('Error starting admin strategy: $e');
      }
      rethrow;
    }
  }

  // Get detailed transaction history for a specific trade
  Future<Map<String, dynamic>> getTradeHistory(String symbol) async {
    if (_userId == null) {
      throw Exception('User not logged in');
    }

    try {
      final response = await _apiHandler.get(
        '/algo-trading/$_userId/trade-history/$symbol',
      );

      if (response.statusCode == 200) {
        return response.data['data'] ?? {};
      } else {
        throw Exception(response.data['error'] ?? 'Failed to get trade history');
      }
    } catch (e) {
      if (Env.enableApiLogs) {
        print('Error getting trade history: $e');
      }
      rethrow;
    }
  }
}
