import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'auth_service.dart';
import 'user_service.dart';

class FavoritesService {
  static const String _favoritesKey = 'favorite_coins';

  final AuthService _auth = AuthService();
  final UserService _userService = UserService();
  List<String>? _cache;

  void updateFromSocket(List<dynamic> data) {
    _cache = data.map((e) => e.toString()).toList();
  }

  Future<List<String>> getFavorites() async {
    final userId = _auth.currentUser?.uid;
    if (userId != null) {
      if (_cache != null) return List.from(_cache!);
      try {
        final list = await _userService.getFavorites(userId);
        await _migrateLocalToBackend(userId, list);
        final merged = await _userService.getFavorites(userId);
        _cache = merged;
        return merged;
      } catch (_) {
        return _cache ?? [];
      }
    }
    try {
      final prefs = await SharedPreferences.getInstance();
      final favoritesJson = prefs.getString(_favoritesKey);
      if (favoritesJson == null) return [];
      final List<dynamic> decoded = json.decode(favoritesJson);
      return decoded.map((e) => e.toString()).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> _migrateLocalToBackend(String userId, List<String> backendList) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final localJson = prefs.getString(_favoritesKey);
      if (localJson == null) return;
      final local = (json.decode(localJson) as List<dynamic>).map((e) => e.toString().toUpperCase()).toList();
      if (local.isEmpty) return;
      final combined = <String>{...backendList.map((e) => e.toUpperCase()), ...local};
      await _userService.putFavorites(userId, combined.toList());
      await prefs.remove(_favoritesKey);
    } catch (_) {}
  }

  Future<bool> isFavorite(String symbol, String quoteCurrency) async {
    final favorites = await getFavorites();
    final pair = '${symbol.toUpperCase()}${quoteCurrency.toUpperCase()}';
    return favorites.any((fav) => fav.toUpperCase() == pair);
  }

  Future<void> addFavorite(String symbol, String quoteCurrency) async {
    final pair = '${symbol.toUpperCase()}${quoteCurrency.toUpperCase()}';
    final userId = _auth.currentUser?.uid;
    if (userId != null) {
      final favorites = await getFavorites();
      if (favorites.any((fav) => fav.toUpperCase() == pair)) return;
      final updated = [...favorites, pair];
      await _userService.putFavorites(userId, updated);
      _cache = updated;
      return;
    }
    final favorites = await getFavorites();
    if (favorites.any((fav) => fav.toUpperCase() == pair)) return;
    favorites.add(pair);
    await _saveLocal(favorites);
  }

  Future<void> removeFavorite(String symbol, String quoteCurrency) async {
    final pair = '${symbol.toUpperCase()}${quoteCurrency.toUpperCase()}';
    final userId = _auth.currentUser?.uid;
    if (userId != null) {
      final favorites = await getFavorites();
      final updated = favorites.where((fav) => fav.toUpperCase() != pair).toList();
      await _userService.putFavorites(userId, updated);
      _cache = updated;
      return;
    }
    final favorites = await getFavorites();
    favorites.removeWhere((fav) => fav.toUpperCase() == pair);
    await _saveLocal(favorites);
  }

  Future<void> toggleFavorite(String symbol, String quoteCurrency) async {
    final isFav = await isFavorite(symbol, quoteCurrency);
    if (isFav) {
      await removeFavorite(symbol, quoteCurrency);
    } else {
      await addFavorite(symbol, quoteCurrency);
    }
  }

  Future<void> _saveLocal(List<String> favorites) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_favoritesKey, json.encode(favorites));
  }
}
