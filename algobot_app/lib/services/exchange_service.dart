import 'package:dio/dio.dart';
import 'api_handler.dart';
import 'auth_service.dart';

class ExchangeApi {
  final String id;
  final String platform;
  final String apiKey;
  final String label;
  final List<String> permissions;
  final bool isActive;
  final DateTime? lastUsed;
  final DateTime createdAt;

  ExchangeApi({
    required this.id,
    required this.platform,
    required this.apiKey,
    required this.label,
    required this.permissions,
    required this.isActive,
    this.lastUsed,
    required this.createdAt,
  });

  factory ExchangeApi.fromJson(Map<String, dynamic> json) {
    return ExchangeApi(
      id: json['_id'] ?? '',
      platform: json['platform'] ?? '',
      apiKey: json['apiKey'] ?? '',
      label: json['label'] ?? 'Default',
      permissions: List<String>.from(json['permissions'] ?? []),
      isActive: json['isActive'] ?? true,
      lastUsed: json['lastUsed'] != null ? DateTime.parse(json['lastUsed']) : null,
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
    );
  }
}

class ExchangeBalance {
  final String asset;
  final double free;
  final double locked;
  final double total;

  ExchangeBalance({
    required this.asset,
    required this.free,
    required this.locked,
    required this.total,
  });

  factory ExchangeBalance.fromJson(Map<String, dynamic> json) {
    return ExchangeBalance(
      asset: json['asset'] ?? '',
      free: (json['free'] ?? 0).toDouble(),
      locked: (json['locked'] ?? 0).toDouble(),
      total: (json['total'] ?? 0).toDouble(),
    );
  }
}

class OrderResult {
  final String orderId;
  final String symbol;
  final String side;
  final String type;
  final String quantity;
  final String price;
  final String status;
  final String executedQty;

  OrderResult({
    required this.orderId,
    required this.symbol,
    required this.side,
    required this.type,
    required this.quantity,
    required this.price,
    required this.status,
    required this.executedQty,
  });

  factory OrderResult.fromJson(Map<String, dynamic> json) {
    return OrderResult(
      orderId: json['orderId']?.toString() ?? '',
      symbol: json['symbol'] ?? '',
      side: json['side'] ?? '',
      type: json['type'] ?? '',
      quantity: json['quantity'] ?? '',
      price: json['price'] ?? '',
      status: json['status'] ?? '',
      executedQty: json['executedQty'] ?? '',
    );
  }
}

class ExchangeService {
  final ApiHandler _apiHandler = ApiHandler();
  final AuthService _authService = AuthService();

  String? get _userId => _authService.currentUser?.uid;

  // Supported platforms
  static const List<Map<String, dynamic>> supportedPlatforms = [
    {
      'id': 'binance',
      'name': 'Binance',
      'icon': 'assets/icons/binance.png',
      'description': 'World\'s largest crypto exchange',
      'color': 0xFFF3BA2F,
    },
    {
      'id': 'kucoin',
      'name': 'KuCoin',
      'icon': 'assets/icons/kucoin.png',
      'description': 'People\'s Exchange',
      'color': 0xFF24AE8F,
    },
    {
      'id': 'bybit',
      'name': 'Bybit',
      'icon': 'assets/icons/bybit.png',
      'description': 'Derivatives exchange',
      'color': 0xFFF7A600,
    },
    {
      'id': 'okx',
      'name': 'OKX',
      'icon': 'assets/icons/okx.png',
      'description': 'Leading exchange',
      'color': 0xFF000000,
    },
  ];

  // Get all linked exchange APIs
  Future<List<ExchangeApi>> getLinkedApis() async {
    if (_userId == null) {
      throw Exception('User not logged in');
    }

    try {
      final response = await _apiHandler.get('/exchange/$_userId');
      
      if (response.statusCode == 200) {
        final data = response.data['data'] as List;
        return data.map((api) => ExchangeApi.fromJson(api)).toList();
      } else {
        throw Exception(response.data['error'] ?? 'Failed to get linked APIs');
      }
    } catch (e) {
      print('Error getting linked APIs: $e');
      rethrow;
    }
  }

  // Add new exchange API
  Future<ExchangeApi> addApi({
    required String platform,
    required String apiKey,
    required String apiSecret,
    String? label,
    List<String>? permissions,
  }) async {
    if (_userId == null) {
      throw Exception('User not logged in');
    }

    try {
      final response = await _apiHandler.post('/exchange/$_userId', data: {
        'platform': platform,
        'apiKey': apiKey,
        'apiSecret': apiSecret,
        'label': label ?? 'Default',
        'permissions': permissions ?? ['read', 'spot_trade'],
      });
      
      if (response.statusCode == 201) {
        return ExchangeApi.fromJson(response.data['data']);
      } else {
        throw Exception(response.data['error'] ?? 'Failed to add API');
      }
    } catch (e) {
      print('Error adding API: $e');
      rethrow;
    }
  }

  // Update exchange API
  Future<void> updateApi({
    required String apiId,
    String? apiKey,
    String? apiSecret,
    String? label,
    List<String>? permissions,
    bool? isActive,
  }) async {
    if (_userId == null) {
      throw Exception('User not logged in');
    }

    try {
      final data = <String, dynamic>{};
      if (apiKey != null) data['apiKey'] = apiKey;
      if (apiSecret != null) data['apiSecret'] = apiSecret;
      if (label != null) data['label'] = label;
      if (permissions != null) data['permissions'] = permissions;
      if (isActive != null) data['isActive'] = isActive;

      final response = await _apiHandler.put('/exchange/$_userId/$apiId', data: data);
      
      if (response.statusCode != 200) {
        throw Exception(response.data['error'] ?? 'Failed to update API');
      }
    } catch (e) {
      print('Error updating API: $e');
      rethrow;
    }
  }

  // Delete exchange API
  Future<void> deleteApi(String apiId) async {
    if (_userId == null) {
      throw Exception('User not logged in');
    }

    try {
      final response = await _apiHandler.delete('/exchange/$_userId/$apiId');
      
      if (response.statusCode != 200) {
        throw Exception(response.data['error'] ?? 'Failed to delete API');
      }
    } catch (e) {
      print('Error deleting API: $e');
      rethrow;
    }
  }

  // Verify API connection
  Future<Map<String, dynamic>> verifyApi(String platform) async {
    if (_userId == null) {
      throw Exception('User not logged in');
    }

    try {
      final response = await _apiHandler.post('/exchange/$_userId/$platform/verify');
      
      if (response.statusCode == 200) {
        // Safely extract data from response
        if (response.data is Map<String, dynamic>) {
          final data = response.data as Map<String, dynamic>;
          if (data.containsKey('data') && data['data'] is Map) {
            return data['data'] as Map<String, dynamic>;
          }
          return data;
        }
        return {};
      } else {
        String errorMessage = 'API verification failed';
        if (response.data is Map<String, dynamic>) {
          errorMessage = (response.data as Map<String, dynamic>)['error'] ?? 
                        (response.data as Map<String, dynamic>)['details'] ?? 
                        errorMessage;
        } else if (response.data is String) {
          errorMessage = response.data as String;
        }
        throw Exception(errorMessage);
      }
    } on DioException catch (e) {
      print('Error verifying API: $e');
      String errorMessage = 'API verification failed';
      
      if (e.response != null) {
        final errorData = e.response?.data;
        if (errorData is Map<String, dynamic>) {
          errorMessage = errorData['error'] ?? 
                        errorData['details'] ?? 
                        errorData['message'] ?? 
                        errorMessage;
        } else if (errorData is String) {
          errorMessage = errorData;
        }
      } else {
        errorMessage = e.message ?? 'Network error occurred';
      }
      
      throw Exception(errorMessage);
    } catch (e) {
      print('Error verifying API: $e');
      throw Exception('API verification failed: $e');
    }
  }

  // Get account balance
  Future<List<ExchangeBalance>> getBalance(String platform) async {
    if (_userId == null) {
      throw Exception('User not logged in');
    }

    try {
      final response = await _apiHandler.get('/exchange/$_userId/$platform/balance');
      
      if (response.statusCode == 200) {
        // Safely extract balances from response
        if (response.data is Map<String, dynamic>) {
          final data = response.data as Map<String, dynamic>;
          if (data.containsKey('data') && data['data'] is Map) {
            final responseData = data['data'] as Map<String, dynamic>;
            if (responseData.containsKey('balances') && responseData['balances'] is List) {
              final balances = responseData['balances'] as List;
              return balances.map((b) => ExchangeBalance.fromJson(b as Map<String, dynamic>)).toList();
            }
          }
        }
        return [];
      } else {
        String errorMessage = 'Failed to get balance';
        if (response.data is Map<String, dynamic>) {
          errorMessage = (response.data as Map<String, dynamic>)['error'] ?? 
                        (response.data as Map<String, dynamic>)['details'] ?? 
                        errorMessage;
        } else if (response.data is String) {
          errorMessage = response.data as String;
        }
        throw Exception(errorMessage);
      }
    } on DioException catch (e) {
      print('Error getting balance: $e');
      String errorMessage = 'Failed to get balance';
      
      if (e.response != null) {
        final errorData = e.response?.data;
        if (errorData is Map<String, dynamic>) {
          errorMessage = errorData['error'] ?? 
                        errorData['details'] ?? 
                        errorData['message'] ?? 
                        errorMessage;
        } else if (errorData is String) {
          errorMessage = errorData;
        }
      } else {
        errorMessage = e.message ?? 'Network error occurred';
      }
      
      throw Exception(errorMessage);
    } catch (e) {
      print('Error getting balance: $e');
      throw Exception('Failed to get balance: $e');
    }
  }

  // Place order
  Future<OrderResult> placeOrder({
    required String platform,
    required String symbol,
    required String side, // BUY or SELL
    required String type, // MARKET or LIMIT
    required double quantity,
    double? price, // Required for LIMIT orders
  }) async {
    if (_userId == null) {
      throw Exception('User not logged in');
    }

    try {
      final data = {
        'symbol': symbol,
        'side': side,
        'type': type,
        'quantity': quantity,
      };
      
      if (type == 'LIMIT' && price != null) {
        data['price'] = price;
      }

      final response = await _apiHandler.post(
        '/exchange/$_userId/$platform/order',
        data: data,
      );
      
      if (response.statusCode == 200) {
        return OrderResult.fromJson(response.data['data']);
      } else {
        throw Exception(response.data['error'] ?? 'Failed to place order');
      }
    } catch (e) {
      print('Error placing order: $e');
      rethrow;
    }
  }

  // Check if platform is linked
  Future<bool> isPlatformLinked(String platform) async {
    try {
      final apis = await getLinkedApis();
      return apis.any((api) => api.platform == platform && api.isActive);
    } catch (e) {
      return false;
    }
  }
}
