# Cryptocurrency API Implementation Guide

## Overview

The app uses **CoinGecko API** to fetch real-time cryptocurrency market data. CoinGecko is a free, reliable API that doesn't require authentication for basic endpoints.

## API Details

### Base URL
```
https://api.coingecko.com/api/v3
```

### Endpoint Used
```
GET /coins/markets
```

### Parameters
- `vs_currency`: Quote currency (usd, btc, eth, usdc, etc.)
- `order`: Sort order (market_cap_desc, market_cap_asc, etc.)
- `per_page`: Number of results per page (default: 100)
- `page`: Page number (default: 1)
- `sparkline`: Include sparkline data (false for performance)

### Rate Limits
- **Free Tier**: 10-50 calls/minute (depending on endpoint)
- **Pro Tier**: Higher limits available
- Current implementation includes 1-minute caching to respect rate limits

## Implementation Details

### Files Created

1. **`lib/models/crypto_coin.dart`**
   - Data model for cryptocurrency coins
   - Parses JSON response from CoinGecko API

2. **`lib/services/crypto_service.dart`**
   - Service class to fetch crypto data
   - Implements caching (1-minute cache)
   - Handles errors gracefully

3. **`lib/widgets/crypto_list_widget.dart`**
   - UI component displaying crypto list
   - Includes filters, sorting, and search

### Features Implemented

✅ **Real-time Price Data**
- Fetches current market prices
- Updates every minute (cached)

✅ **Quote Currency Filters**
- USDT, BTC, ETH, USDC filters
- Click to filter by quote currency

✅ **Sorting**
- Sort by Currency (symbol)
- Sort by Last Price
- Sort by 24h Change
- Toggle ascending/descending

✅ **Search**
- Search by coin symbol or name
- Real-time filtering

✅ **24h Change Display**
- Shows percentage change
- Color-coded (green for positive, red for negative)
- Badge-style display

## Usage

The crypto list widget is automatically integrated into the home screen after the platform options grid.

### Manual Refresh

To refresh data manually, you can add a refresh button or use pull-to-refresh:

```dart
RefreshIndicator(
  onRefresh: () async {
    await _cryptoService.clearCache();
    await _loadCryptoData();
  },
  child: // your list widget
)
```

## API Alternatives

If CoinGecko has issues, here are alternative free APIs:

### 1. Binance API (Free, No Auth Required)
```
GET https://api.binance.com/api/v3/ticker/24hr
```
- Real-time data
- High rate limits
- Requires parsing different response format

### 2. CoinCap API (Free)
```
GET https://api.coincap.io/v2/assets
```
- Simple REST API
- Good rate limits
- Different data structure

### 3. CryptoCompare API (Free Tier)
```
GET https://min-api.cryptocompare.com/data/pricemultifull
```
- Good for multiple currencies
- Requires API key for higher limits

## Error Handling

The service includes:
- Network error handling
- Cache fallback on errors
- User-friendly error messages
- Loading states

## Performance Optimization

1. **Caching**: 1-minute cache to reduce API calls
2. **Lazy Loading**: Only loads when widget is visible
3. **Pagination**: Can be extended to load more coins
4. **Debouncing**: Search can be debounced for better performance

## Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] Pull-to-refresh
- [ ] Pagination for more coins
- [ ] Favorite coins
- [ ] Price alerts
- [ ] Historical charts

## Troubleshooting

### No Data Loading
1. Check internet connection
2. Verify CoinGecko API is accessible
3. Check rate limits (may be temporarily blocked)
4. Review error logs in console

### Slow Loading
1. Increase cache duration
2. Reduce number of coins per page
3. Implement pagination

### API Rate Limit Exceeded
1. Increase cache duration
2. Reduce refresh frequency
3. Consider upgrading to Pro tier
4. Implement request queuing

## Testing

Test the API directly:
```bash
curl "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false"
```

Expected response:
```json
[
  {
    "id": "bitcoin",
    "symbol": "btc",
    "name": "Bitcoin",
    "current_price": 90061.90,
    "price_change_24h": -1945.5,
    "price_change_percentage_24h": -2.16,
    ...
  }
]
```
