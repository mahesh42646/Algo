import 'dart:io';
import 'package:dio/dio.dart';
import 'api_handler.dart';

class UserService {
  final ApiHandler _apiHandler = ApiHandler();

  Future<Map<String, dynamic>> createUser({
    required String userId,
    required String email,
    String? nickname,
  }) async {
    try {
      print('📤 API Call: POST /users - Creating user: $userId');
      final response = await _apiHandler.post(
        '/users',
        data: {
          'userId': userId,
          'email': email,
          if (nickname != null) 'nickname': nickname,
        },
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        print('✅ API Success: User created/verified - Status: ${response.statusCode}');
        // Safely extract data from response
        if (response.data is Map<String, dynamic>) {
          final data = response.data as Map<String, dynamic>;
          if (data.containsKey('data') && data['data'] is Map) {
            return data['data'] as Map<String, dynamic>;
          }
          // If response.data is the user object directly
          return data;
        }
        throw Exception('Invalid response format from API');
      } else {
        print('❌ API Error: Failed to create user - Status: ${response.statusCode}');
        String errorMessage = 'Failed to create user';
        if (response.data is Map<String, dynamic>) {
          errorMessage = (response.data as Map<String, dynamic>)['error'] ?? 
                        (response.data as Map<String, dynamic>)['message'] ?? 
                        errorMessage;
        } else if (response.data is String) {
          errorMessage = response.data as String;
        }
        throw Exception(errorMessage);
      }
    } on DioException catch (e) {
      print('❌ API Exception: ${e.message}');
      if (e.response != null) {
        final statusCode = e.response?.statusCode;
        final errorData = e.response?.data;
        print('   Status: $statusCode, Error: $errorData');
        
        // If user already exists (409 or 200), return the existing user data
        if (statusCode == 409 || statusCode == 200) {
          if (errorData is Map<String, dynamic> && errorData.containsKey('data') && errorData['data'] is Map) {
            return errorData['data'] as Map<String, dynamic>;
          }
          // Try to get the user
          return await getUser(userId);
        }
        
        String errorMessage = 'Failed to create user';
        if (errorData is Map<String, dynamic>) {
          errorMessage = errorData['error'] ?? errorData['message'] ?? errorMessage;
        } else if (errorData is String) {
          errorMessage = errorData;
        }
        throw Exception(errorMessage);
      }
      throw Exception('Network error: ${e.message}');
    } catch (e) {
      print('❌ Unexpected error: $e');
      throw Exception('Failed to create user: $e');
    }
  }

  Future<Map<String, dynamic>> getUser(String userId) async {
    try {
      print('📤 API Call: GET /users/$userId - Fetching user');
      final response = await _apiHandler.get('/users/$userId');

      if (response.statusCode == 200) {
        print('✅ API Success: User fetched - Status: ${response.statusCode}');
        // Safely extract data from response
        if (response.data is Map<String, dynamic>) {
          final data = response.data as Map<String, dynamic>;
          if (data.containsKey('data') && data['data'] is Map) {
            return data['data'] as Map<String, dynamic>;
          }
          // If response.data is the user object directly
          return data;
        }
        throw Exception('Invalid response format from API');
      } else {
        print('❌ API Error: Failed to get user - Status: ${response.statusCode}');
        String errorMessage = 'Failed to get user';
        if (response.data is Map<String, dynamic>) {
          errorMessage = (response.data as Map<String, dynamic>)['error'] ?? errorMessage;
        } else if (response.data is String) {
          errorMessage = response.data as String;
        }
        throw Exception(errorMessage);
      }
    } on DioException catch (e) {
      print('❌ API Exception: ${e.message}');
      if (e.response != null) {
        final statusCode = e.response?.statusCode;
        final errorData = e.response?.data;
        print('   Status: $statusCode, Error: $errorData');
        
        String errorMessage = 'Failed to get user';
        if (errorData is Map<String, dynamic>) {
          errorMessage = errorData['error'] ?? errorData['message'] ?? errorMessage;
        } else if (errorData is String) {
          errorMessage = errorData;
        }
        throw Exception(errorMessage);
      }
      throw Exception('Network error: ${e.message}');
    } catch (e) {
      print('❌ Unexpected error: $e');
      throw Exception('Failed to get user: $e');
    }
  }

  Future<Map<String, dynamic>> updateUser({
    required String userId,
    String? nickname,
    Map<String, dynamic>? location,
    String? language,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (nickname != null) data['nickname'] = nickname;
      if (location != null) data['location'] = location;
      if (language != null) data['language'] = language;

      final response = await _apiHandler.put(
        '/users/$userId',
        data: data,
      );

      if (response.statusCode == 200) {
        return response.data['data'] as Map<String, dynamic>;
      } else {
        throw Exception(response.data['error'] ?? 'Failed to update user');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Failed to update user');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  Future<String> uploadAvatar(String userId, File imageFile) async {
    try {
      final response = await _apiHandler.uploadFile(
        '/users/$userId/avatar',
        imageFile.path,
        fieldName: 'avatar',
      );

      if (response.statusCode == 200) {
        return response.data['data']['avatar'] as String;
      } else {
        throw Exception(response.data['error'] ?? 'Failed to upload avatar');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Failed to upload avatar');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  Future<List<dynamic>> getReferrals(String userId) async {
    try {
      final response = await _apiHandler.get('/users/$userId/referrals');
      if (response.statusCode == 200) {
        return response.data['data']['referrals'] as List<dynamic>;
      }
      throw Exception(response.data['error'] ?? 'Failed to get referrals');
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Failed to get referrals');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  Future<List<dynamic>> getActivities(String userId) async {
    try {
      final response = await _apiHandler.get('/users/$userId/activities');
      if (response.statusCode == 200) {
        return response.data['data'] as List<dynamic>;
      }
      throw Exception(response.data['error'] ?? 'Failed to get activities');
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Failed to get activities');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  Future<List<dynamic>> getNotifications(String userId) async {
    try {
      final response = await _apiHandler.get('/users/$userId/notifications');
      if (response.statusCode == 200) {
        return response.data['data'] as List<dynamic>;
      }
      throw Exception(response.data['error'] ?? 'Failed to get notifications');
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Failed to get notifications');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  Future<List<dynamic>> getStrategies(String userId) async {
    try {
      final response = await _apiHandler.get('/users/$userId/strategies');
      if (response.statusCode == 200) {
        return response.data['data'] as List<dynamic>;
      }
      throw Exception(response.data['error'] ?? 'Failed to get strategies');
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Failed to get strategies');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  Future<Map<String, dynamic>> getWallet(String userId) async {
    try {
      final response = await _apiHandler.get('/users/$userId/wallet');
      if (response.statusCode == 200) {
        return response.data['data'] as Map<String, dynamic>;
      }
      throw Exception(response.data['error'] ?? 'Failed to get wallet');
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Failed to get wallet');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  Future<Map<String, dynamic>> getPermissions(String userId) async {
    try {
      final response = await _apiHandler.get('/users/$userId/permissions');
      if (response.statusCode == 200) {
        return response.data['data'] as Map<String, dynamic>;
      }
      throw Exception(response.data['error'] ?? 'Failed to get permissions');
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Failed to get permissions');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  Future<List<dynamic>> getKyc(String userId) async {
    try {
      final response = await _apiHandler.get('/users/$userId/kyc');
      if (response.statusCode == 200) {
        return response.data['data'] as List<dynamic>;
      }
      throw Exception(response.data['error'] ?? 'Failed to get KYC');
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['error'] ?? 'Failed to get KYC');
      }
      throw Exception('Network error: ${e.message}');
    }
  }
}
