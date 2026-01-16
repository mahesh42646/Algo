import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../config/env.dart';

class ApiLog {
  final String endpoint;
  final String method;
  final int? statusCode;
  final DateTime timestamp;
  final Duration? duration;
  final String? error;
  final Map<String, dynamic>? requestData;
  final Map<String, dynamic>? responseData;
  final bool isSuccess;

  ApiLog({
    required this.endpoint,
    required this.method,
    this.statusCode,
    required this.timestamp,
    this.duration,
    this.error,
    this.requestData,
    this.responseData,
    required this.isSuccess,
  });

  Map<String, dynamic> toJson() {
    return {
      'endpoint': endpoint,
      'method': method,
      'statusCode': statusCode,
      'timestamp': timestamp.toIso8601String(),
      'duration': duration?.inMilliseconds,
      'error': error,
      'requestData': requestData,
      'responseData': responseData,
      'isSuccess': isSuccess,
    };
  }
}

class ApiHandler {
  static final ApiHandler _instance = ApiHandler._internal();
  factory ApiHandler() => _instance;
  ApiHandler._internal();

  late Dio _dio;
  final List<ApiLog> _logs = [];
  static const int maxLogs = 1000;

  String _baseUrl = Env.backendUrl;

  String get baseUrl => _baseUrl;
  String get baseUrlWithoutApi => _baseUrl.replaceAll('/api', '');

  void initialize() {
    // Clean base URL (remove trailing slashes and ensure proper format)
    final cleanBaseUrl = _baseUrl.trim().replaceAll(RegExp(r'/+$'), '');
    
    _dio = Dio(BaseOptions(
      baseUrl: cleanBaseUrl,
      connectTimeout: Duration(milliseconds: Env.apiTimeout),
      receiveTimeout: Duration(milliseconds: Env.apiTimeout),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true', // Bypass ngrok browser warning
      },
      validateStatus: (status) {
        return status! < 500; // Don't throw for 4xx errors, let us handle them
      },
    ));

    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      error: true,
      logPrint: (object) {
        if (kDebugMode) {
          print(object);
        }
      },
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        _logRequest(options);
        handler.next(options);
      },
      onResponse: (response, handler) {
        _logResponse(response);
        handler.next(response);
      },
      onError: (error, handler) {
        _logError(error);
        handler.next(error);
      },
    ));
  }

  void updateBaseUrl(String newUrl) {
    _baseUrl = newUrl;
    _dio.options.baseUrl = _baseUrl;
  }

  void _logRequest(RequestOptions options) {
    final log = ApiLog(
      endpoint: options.path,
      method: options.method,
      timestamp: DateTime.now(),
      requestData: options.data is Map
          ? Map<String, dynamic>.from(options.data as Map)
          : null,
      isSuccess: false,
    );
    _addLog(log);
  }

  void _logResponse(Response response) {
    final requestOptions = response.requestOptions;
    final startTime = requestOptions.extra['startTime'] as DateTime?;
    final duration = startTime != null
        ? DateTime.now().difference(startTime)
        : null;

    final log = ApiLog(
      endpoint: requestOptions.path,
      method: requestOptions.method,
      statusCode: response.statusCode,
      timestamp: DateTime.now(),
      duration: duration,
      responseData: response.data is Map
          ? Map<String, dynamic>.from(response.data as Map)
          : null,
      isSuccess: true,
    );
    _addLog(log);
  }

  void _logError(DioException error) {
    final requestOptions = error.requestOptions;
    final startTime = requestOptions.extra['startTime'] as DateTime?;
    final duration = startTime != null
        ? DateTime.now().difference(startTime)
        : null;

    final log = ApiLog(
      endpoint: requestOptions.path,
      method: requestOptions.method,
      statusCode: error.response?.statusCode,
      timestamp: DateTime.now(),
      duration: duration,
      error: error.message,
      requestData: requestOptions.data is Map
          ? Map<String, dynamic>.from(requestOptions.data as Map)
          : null,
      responseData: error.response?.data is Map
          ? Map<String, dynamic>.from(error.response!.data as Map)
          : null,
      isSuccess: false,
    );
    _addLog(log);
  }

  void _addLog(ApiLog log) {
    _logs.add(log);
    if (_logs.length > maxLogs) {
      _logs.removeAt(0);
    }
  }

  List<ApiLog> getLogs() => List.unmodifiable(_logs);

  List<ApiLog> getErrorLogs() {
    return _logs.where((log) => !log.isSuccess).toList();
  }

  List<ApiLog> getSlowLogs({Duration threshold = const Duration(seconds: 2)}) {
    return _logs
        .where((log) =>
            log.duration != null && log.duration! > threshold)
        .toList();
  }

  Map<String, int> getEndpointStats() {
    final stats = <String, int>{};
    for (final log in _logs) {
      stats[log.endpoint] = (stats[log.endpoint] ?? 0) + 1;
    }
    return stats;
  }

  Map<String, dynamic> getApiHealthReport() {
    final totalCalls = _logs.length;
    final successCalls = _logs.where((log) => log.isSuccess).length;
    final errorCalls = totalCalls - successCalls;
    final avgDuration = _logs
            .where((log) => log.duration != null)
            .map((log) => log.duration!.inMilliseconds)
            .fold(0, (sum, duration) => sum + duration) /
        (_logs.where((log) => log.duration != null).length);

    return {
      'totalCalls': totalCalls,
      'successCalls': successCalls,
      'errorCalls': errorCalls,
      'successRate': totalCalls > 0 ? (successCalls / totalCalls * 100) : 0,
      'averageDuration': avgDuration.isNaN ? 0 : avgDuration,
      'endpointStats': getEndpointStats(),
      'recentErrors': getErrorLogs().take(10).map((e) => e.toJson()).toList(),
      'slowEndpoints': getSlowLogs().take(10).map((e) => e.toJson()).toList(),
    };
  }

  void clearLogs() {
    _logs.clear();
  }

  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    final requestOptions = (options ?? Options()).copyWith(
      extra: {
        ...?options?.extra,
        'startTime': DateTime.now(),
      },
    );
    return await _dio.get(
      path,
      queryParameters: queryParameters,
      options: requestOptions,
    );
  }

  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    final requestOptions = (options ?? Options()).copyWith(
      extra: {
        ...?options?.extra,
        'startTime': DateTime.now(),
      },
    );
    return await _dio.post(
      path,
      data: data,
      queryParameters: queryParameters,
      options: requestOptions,
    );
  }

  Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    final requestOptions = (options ?? Options()).copyWith(
      extra: {
        ...?options?.extra,
        'startTime': DateTime.now(),
      },
    );
    return await _dio.put(
      path,
      data: data,
      queryParameters: queryParameters,
      options: requestOptions,
    );
  }

  Future<Response> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    final requestOptions = (options ?? Options()).copyWith(
      extra: {
        ...?options?.extra,
        'startTime': DateTime.now(),
      },
    );
    return await _dio.delete(
      path,
      data: data,
      queryParameters: queryParameters,
      options: requestOptions,
    );
  }

  Future<Response> uploadFile(
    String path,
    String filePath, {
    String fieldName = 'file',
    Map<String, dynamic>? additionalData,
    ProgressCallback? onSendProgress,
  }) async {
    final formData = FormData.fromMap({
      fieldName: await MultipartFile.fromFile(filePath),
      ...?additionalData,
    });

    final requestOptions = Options(
      extra: {
        'startTime': DateTime.now(),
      },
    );

    return await _dio.post(
      path,
      data: formData,
      options: requestOptions,
      onSendProgress: onSendProgress,
    );
  }
}
