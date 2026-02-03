import 'package:shared_preferences/shared_preferences.dart';

class OnboardingService {
  static const String _prefix = 'onboarding_seen_';

  Future<bool> hasSeenOnboarding(String userId) async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('$_prefix$userId') ?? false;
  }

  Future<void> setOnboardingSeen(String userId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('$_prefix$userId', true);
  }
}
