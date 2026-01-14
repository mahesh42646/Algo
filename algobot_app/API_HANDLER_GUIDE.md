# API Handler Guide

## Overview

The API Handler provides centralized API management, logging, and optimization for all backend API calls in the app.

## Features

- **Centralized API Management**: Single point to update backend URL
- **Automatic Logging**: All API calls are logged with details
- **Performance Monitoring**: Track slow endpoints and errors
- **Health Reports**: Get API usage statistics
- **Request Optimization**: Built-in retry and timeout handling

## Updating Backend URL

### Method 1: Environment Variables (Recommended)

Update `.env.local`:
```env
BACKEND_URL=https://your-domain.com/api
BACKEND_BASE_URL=https://your-domain.com
```

The API handler will automatically use the new URL on app restart.

### Method 2: Runtime Update

```dart
ApiHandler().updateBaseUrl('https://your-domain.com/api');
```

## Using API Handler

All services should use `ApiHandler` instead of direct Dio instances:

```dart
import 'package:algobot_app/services/api_handler.dart';

class MyService {
  final ApiHandler _apiHandler = ApiHandler();

  Future<Response> getData() async {
    return await _apiHandler.get('/endpoint');
  }

  Future<Response> postData(Map<String, dynamic> data) async {
    return await _apiHandler.post('/endpoint', data: data);
  }
}
```

## API Logging

### View All Logs

```dart
final logs = ApiHandler().getLogs();
```

### View Error Logs Only

```dart
final errorLogs = ApiHandler().getErrorLogs();
```

### View Slow Endpoints

```dart
final slowLogs = ApiHandler().getSlowLogs(
  threshold: Duration(seconds: 2),
);
```

### Get API Health Report

```dart
final report = ApiHandler().getApiHealthReport();
// Returns:
// {
//   'totalCalls': 100,
//   'successCalls': 95,
//   'errorCalls': 5,
//   'successRate': 95.0,
//   'averageDuration': 250.5,
//   'endpointStats': {...},
//   'recentErrors': [...],
//   'slowEndpoints': [...]
// }
```

### Get Endpoint Statistics

```dart
final stats = ApiHandler().getEndpointStats();
// Returns: {'/users': 50, '/crypto': 30, ...}
```

## Log Structure

Each log entry contains:
- `endpoint`: API endpoint path
- `method`: HTTP method (GET, POST, etc.)
- `statusCode`: HTTP status code
- `timestamp`: When the call was made
- `duration`: How long the call took
- `error`: Error message (if any)
- `requestData`: Request payload
- `responseData`: Response data
- `isSuccess`: Whether the call succeeded

## Admin Monitoring

For admin dashboard integration, you can:

1. **Export logs as JSON**:
```dart
final logs = ApiHandler().getLogs();
final jsonLogs = logs.map((log) => log.toJson()).toList();
// Send to admin API
```

2. **Get health report**:
```dart
final report = ApiHandler().getApiHealthReport();
// Send to admin API for monitoring
```

3. **Monitor specific endpoints**:
```dart
final userEndpointLogs = ApiHandler()
    .getLogs()
    .where((log) => log.endpoint.contains('/users'))
    .toList();
```

## Best Practices

1. **Always use ApiHandler**: Don't create direct Dio instances
2. **Check logs regularly**: Monitor for errors and slow endpoints
3. **Update URL in one place**: Use environment variables
4. **Clear logs periodically**: Use `ApiHandler().clearLogs()` if needed
5. **Monitor health reports**: Set up alerts for high error rates

## Log Limits

- Maximum logs stored: 1000
- Oldest logs are automatically removed when limit is reached
- Logs are kept in memory (not persisted to disk)

## Example: Sending Logs to Admin

```dart
Future<void> sendLogsToAdmin() async {
  final report = ApiHandler().getApiHealthReport();
  final errorLogs = ApiHandler().getErrorLogs();
  
  await adminService.sendApiReport({
    'health': report,
    'errors': errorLogs.take(50).map((e) => e.toJson()).toList(),
  });
}
```
