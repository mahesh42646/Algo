import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class FavoritesService {
  static const String _favoritesKey = 'favorite_coins';
  
  Future<List<String>> getFavorites() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final favoritesJson = prefs.getString(_favoritesKey);
      if (favoritesJson == null) return [];
      final List<dynamic> decoded = json.decode(favoritesJson);
      return decoded.map((e) => e.toString()).toList();
    } catch (e) {
      return [];
    }
  }
  
  Future<bool> isFavorite(String symbol, String quoteCurrency) async {
    final favorites = await getFavorites();
    final pair = '${symbol.toUpperCase()}${quoteCurrency.toUpperCase()}';
    return favorites.any((fav) => fav.toUpperCase() == pair);
  }
  
  Future<void> addFavorite(String symbol, String quoteCurrency) async {
    final favorites = await getFavorites();
    final pair = '${symbol.toUpperCase()}${quoteCurrency.toUpperCase()}';
    // Check case-insensitive
    final exists = favorites.any((fav) => fav.toUpperCase() == pair);
    if (!exists) {
      favorites.add(pair);
      await _saveFavorites(favorites);
    }
  }
  
  Future<void> removeFavorite(String symbol, String quoteCurrency) async {
    final favorites = await getFavorites();
    final pair = '${symbol.toUpperCase()}${quoteCurrency.toUpperCase()}';
    favorites.removeWhere((fav) => fav.toUpperCase() == pair);
    await _saveFavorites(favorites);
  }
  
  Future<void> toggleFavorite(String symbol, String quoteCurrency) async {
    final isFav = await isFavorite(symbol, quoteCurrency);
    if (isFav) {
      await removeFavorite(symbol, quoteCurrency);
    } else {
      await addFavorite(symbol, quoteCurrency);
    }
  }
  
  Future<void> _saveFavorites(List<String> favorites) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_favoritesKey, json.encode(favorites));
  }
}
