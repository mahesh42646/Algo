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
    Map<String, dynamic>? startLocation,
  }) async {
    if (_userId == null) {
      throw Exception('User not logged in');
    }

    try {
      final data = <String, dynamic>{
        'symbol': symbol,
        'apiId': apiId,
        'maxLossPerTrade': maxLossPerTrade,
        'maxLossOverall': maxLossOverall,
        'maxProfitBook': maxProfitBook,
        'amountPerLevel': amountPerLevel,
        'numberOfLevels': numberOfLevels,
        'useMargin': useMargin,
        'leverage': leverage,
      };
      if (startLocation != null) data['startLocation'] = startLocation;
      final response = await _apiHandler.post(
        '/algo-trading/$_userId/start',
        data: data,
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
  Future<void> stopAlgoTrade(String symbol, {Map<String, dynamic>? stopLocation}) async {
    if (_userId == null) {
      throw Exception('User not logged in');
    }

    try {
      final data = <String, dynamic>{'symbol': symbol};
      if (stopLocation != null) data['stopLocation'] = stopLocation;
      final response = await _apiHandler.post(
        '/algo-trading/$_userId/stop',
        data: data,
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

  // Close all active trades
  Future<int> stopAllTrades() async {
    final trades = await getActiveTrades();
    int stopped = 0;
    for (final t in trades) {
      final sym = t['symbol']?.toString();
      if (sym != null && sym.isNotEmpty) {
        try {
          await stopAlgoTrade(sym);
          stopped++;
        } catch (_) {}
      }
    }
    return stopped;
  }

  // Close all active trades that are in profit (unrealized P&L > 0)
  Future<int> stopAllProfitableTrades() async {
    final trades = await getActiveTrades();
    int stopped = 0;
    for (final t in trades) {
      final pnl = _toDouble(t['unrealizedPnL']);
      if (pnl > 0) {
        final sym = t['symbol']?.toString();
        if (sym != null && sym.isNotEmpty) {
          try {
            await stopAlgoTrade(sym);
            stopped++;
          } catch (_) {}
        }
      }
    }
    return stopped;
  }

  // Close all active trades that are in loss (unrealized P&L < 0)
  Future<int> stopAllLossTrades() async {
    final trades = await getActiveTrades();
    int stopped = 0;
    for (final t in trades) {
      final pnl = _toDouble(t['unrealizedPnL']);
      if (pnl < 0) {
        final sym = t['symbol']?.toString();
        if (sym != null && sym.isNotEmpty) {
          try {
            await stopAlgoTrade(sym);
            stopped++;
          } catch (_) {}
        }
      }
    }
    return stopped;
  }

  static double _toDouble(dynamic v) {
    if (v == null) return 0.0;
    if (v is int) return (v as int).toDouble();
    if (v is double) return v;
    return double.tryParse(v.toString()) ?? 0.0;
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

  // Get admin strategies (5)
  Future<List<Map<String, dynamic>>> getAdminStrategies() async {
    try {
      final response = await _apiHandler.get('/algo-trading/strategies/admin');
      if (response.statusCode == 200 && response.data['data'] is List) {
        return List<Map<String, dynamic>>.from(
          (response.data['data'] as List).map((e) => Map<String, dynamic>.from(e as Map)),
        );
      }
      return [];
    } catch (e) {
      if (Env.enableApiLogs) print('Error loading admin strategies: $e');
      return [];
    }
  }

  // Get popular strategies (5)
  Future<List<Map<String, dynamic>>> getPopularStrategies() async {
    try {
      final response = await _apiHandler.get('/algo-trading/strategies/popular');
      if (response.statusCode == 200 && response.data['data'] is List) {
        return List<Map<String, dynamic>>.from(
          (response.data['data'] as List).map((e) => Map<String, dynamic>.from(e as Map)),
        );
      }
      return [];
    } catch (e) {
      if (Env.enableApiLogs) print('Error loading popular strategies: $e');
      return [];
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

  // Get profit details with optional period, symbol filter, and includeAllHistory (default off).
  // includeAllHistory=true returns full history from all sources (other app, Postman, etc.).
  Future<Map<String, dynamic>> getProfitDetails({
    String period = '7d',
    String? symbol,
    bool includeAllHistory = false,
  }) async {
    if (_userId == null) {
      throw Exception('User not logged in');
    }

    try {
      var url = '/algo-trading/$_userId/profits?period=$period';
      if (symbol != null && symbol.isNotEmpty) {
        url += '&symbol=${Uri.encodeComponent(symbol)}';
      }
      if (includeAllHistory) {
        url += '&includeAllHistory=true';
      }
      final response = await _apiHandler.get(url);

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
    Map<String, dynamic>? startLocation,
  }) async {
    if (_userId == null) {
      throw Exception('User not logged in');
    }

    try {
      final data = <String, dynamic>{
        'symbol': symbol,
        'apiId': apiId,
        'amountPerLevel': amountPerLevel,
        'numberOfLevels': numberOfLevels,
      };
      if (startLocation != null) data['startLocation'] = startLocation;
      final response = await _apiHandler.post(
        '/algo-trading/$_userId/start-manual',
        data: data,
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
  Future<Map<String, dynamic>> startAdminStrategy({String? symbol, Map<String, dynamic>? startLocation}) async {
    if (_userId == null) {
      throw Exception('User not logged in');
    }

    try {
      final data = <String, dynamic>{};
      if (symbol != null) data['symbol'] = symbol;
      if (startLocation != null) data['startLocation'] = startLocation;
      final response = await _apiHandler.post(
        '/algo-trading/$_userId/start-admin',
        data: data,
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
