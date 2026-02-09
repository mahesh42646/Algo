import 'dart:convert';
import 'package:dio/dio.dart';
import '../config/env.dart';
import '../models/crypto_coin.dart';
import 'api_handler.dart';

class CryptoService {
  static const String baseUrl = 'https://api.binance.com/api/v3';
  static const Duration cacheDuration = Duration(minutes: 1);

  final ApiHandler _apiHandler = ApiHandler();
  final Map<String, List<CryptoCoin>> _cache = {};
  final Map<String, DateTime> _cacheTimestamps = {};
  
  late final Dio _externalDio;

  CryptoService() {
    _externalDio = Dio(BaseOptions(
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      sendTimeout: const Duration(seconds: 10),
    ));
  }

  Future<List<CryptoCoin>> getCoinsByQuoteCurrency(String quoteCurrency, {bool forceRefresh = false}) async {
    final cacheKey = quoteCurrency.toUpperCase();
    final now = DateTime.now();

    if (!forceRefresh &&
        _cache.containsKey(cacheKey) &&
        _cacheTimestamps.containsKey(cacheKey)) {
      final cacheTime = _cacheTimestamps[cacheKey]!;
      if (now.difference(cacheTime) < cacheDuration) {
        if (Env.enableApiLogs) {
          print('[CRYPTO SERVICE] ✅ Returning cached data for $cacheKey');
        }
        return _cache[cacheKey]!;
      }
    }

    try {
      final quoteUpper = quoteCurrency.toUpperCase();
      if (Env.enableApiLogs) {
        print('[CRYPTO SERVICE] Fetching Binance trading pairs for quote: $quoteUpper');
      }

      // Get all 24h ticker data from Binance
      final url = '$baseUrl/ticker/24hr';
      if (Env.enableApiLogs) {
        print('[CRYPTO SERVICE] Making API request to: $url');
      }

      final response = await _externalDio.get(
        url,
        options: Options(
          validateStatus: (status) => status! < 500,
        ),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data as List<dynamic>;
        
        // Filter pairs that end with the quote currency (e.g., BTCUSDT, ETHUSDT)
        final List<CryptoCoin> coins = data
            .where((item) {
              final symbol = item['symbol'] as String? ?? '';
              return symbol.endsWith(quoteUpper) && 
                     symbol.length > quoteUpper.length; // Ensure it's a pair, not just the quote itself
            })
            .map((json) {
              try {
                return CryptoCoin.fromBinanceJson(json as Map<String, dynamic>, quoteUpper);
              } catch (e) {
                if (Env.enableApiLogs) {
                  print('[CRYPTO SERVICE] ⚠️ Error parsing coin: $e');
                }
                return null;
              }
            })
            .where((coin) => coin != null && coin.currentPrice > 0)
            .cast<CryptoCoin>()
            .toList();

        // Sort by volume (most traded first)
        coins.sort((a, b) => b.volume24h.compareTo(a.volume24h));

        // Cache the results
        _cache[cacheKey] = coins;
        _cacheTimestamps[cacheKey] = now;

        if (Env.enableApiLogs) {
          print('[CRYPTO SERVICE] ✅ Successfully fetched ${coins.length} trading pairs for $quoteUpper');
        }
        return coins;
      } else {
        final errorMsg = 'Failed to load market data: ${response.statusCode}';
        if (response.data != null) {
          if (Env.enableApiLogs) {
            print('[CRYPTO SERVICE] ❌ Error response: ${response.data}');
          }
        }
        throw Exception(errorMsg);
      }
    } catch (e) {
      if (Env.enableApiLogs) {
        print('[CRYPTO SERVICE] ❌ Exception: $e');
      }
      // Return cache if available
      if (_cache.containsKey(cacheKey)) {
        if (Env.enableApiLogs) {
          print('[CRYPTO SERVICE] ⚠️ Returning cached data due to error');
        }
        return _cache[cacheKey]!;
      }
      rethrow;
    }
  }

  void clearCache() {
    _cache.clear();
    _cacheTimestamps.clear();
  }
}
