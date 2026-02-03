import 'dart:io';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

/// Requests notifications + location permissions and provides current location for trade history.
class PermissionLocationService {
  /// Request notification and location permissions. Call after app init (e.g. when user is logged in).
  static Future<void> requestPermissions() async {
    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    if (Platform.isAndroid) {
      final status = await Permission.notification.request();
      if (status.isDenied) {
        await Permission.notification.request();
      }
    }
    final locStatus = await Permission.location.request();
    if (locStatus.isDenied || locStatus.isPermanentlyDenied) {
      await Permission.locationWhenInUse.request();
    }
  }

  /// Get current position. Returns null if permission denied or location unavailable.
  /// Returns { latitude, longitude, address? } - address is null unless geocoding is used.
  static Future<Map<String, dynamic>?> getCurrentLocation() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return null;
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return null;
      }
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
        timeLimit: const Duration(seconds: 10),
      );
      return {
        'latitude': position.latitude,
        'longitude': position.longitude,
        'address': null,
      };
    } catch (_) {
      return null;
    }
  }
}
