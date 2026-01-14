import 'package:dio/dio.dart';
import '../models/candlestick.dart';

class ChartService {
  static const String baseUrl = 'https://api.binance.com/api/v3';
  
  late final Dio _dio;

  ChartService() {
    _dio = Dio(BaseOptions(
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ));
  }

  Future<List<Candlestick>> getCandlesticks({
    required String symbol,
    required String interval,
    int limit = 500,
  }) async {
    try {
      final url = '$baseUrl/klines?symbol=$symbol&interval=$interval&limit=$limit';
      print('[CHART SERVICE] Fetching candlesticks: $url');

      final response = await _dio.get(url);

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data as List<dynamic>;
        final List<Candlestick> candles = data
            .map((item) => Candlestick.fromBinanceJson(item as List<dynamic>))
            .toList();

        print('[CHART SERVICE] ✅ Fetched ${candles.length} candlesticks');
        return candles;
      } else {
        throw Exception('Failed to load candlestick data: ${response.statusCode}');
      }
    } catch (e) {
      print('[CHART SERVICE] ❌ Error: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> get24hStats(String symbol) async {
    try {
      final url = '$baseUrl/ticker/24hr?symbol=$symbol';
      final response = await _dio.get(url);

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        return {
          'highPrice': double.tryParse(data['highPrice'] as String? ?? '0') ?? 0.0,
          'lowPrice': double.tryParse(data['lowPrice'] as String? ?? '0') ?? 0.0,
          'volume': double.tryParse(data['volume'] as String? ?? '0') ?? 0.0,
          'quoteVolume': double.tryParse(data['quoteVolume'] as String? ?? '0') ?? 0.0,
        };
      }
      throw Exception('Failed to load 24h stats');
    } catch (e) {
      print('[CHART SERVICE] ❌ Error loading 24h stats: $e');
      rethrow;
    }
  }
}
