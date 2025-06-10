# Bot Trading Simulator API Documentation

## Configuration Endpoints

### Get Current Configuration

Retrieves the current trading strategy configuration.

**URL:** `/config`

**Method:** `GET`

**Success Response:**
- **Code:** 200 OK
- **Content Example:**
```json
{
  "symbol": "BTCUSDT",
  "timeframe": "5m",
  "plusDiThreshold": 25,
  "minusDiThreshold": 20,
  "adxMinimum": 20,
  "takeProfitPercent": 2,
  "stopLossPercent": 1,
  "leverage": 10
}
```

**Error Response:**
- **Code:** 500 Internal Server Error
- **Content Example:**
```json
{
  "error": "Failed to retrieve configuration"
}
```

### Update Configuration

Updates the trading strategy configuration.

**URL:** `/config`

**Method:** `POST`

**Data Constraints:**
```json
{
  "symbol": "[uppercase symbol string]",
  "timeframe": "[valid timeframe string]",
  "plusDiThreshold": "[positive number]",
  "minusDiThreshold": "[positive number]",
  "adxMinimum": "[positive number]",
  "takeProfitPercent": "[positive number]",
  "stopLossPercent": "[positive number]",
  "leverage": "[positive number]"
}
```

**Data Example:**
```json
{
  "symbol": "ETHUSDT",
  "timeframe": "15m",
  "plusDiThreshold": 30,
  "minusDiThreshold": 15,
  "adxMinimum": 25,
  "takeProfitPercent": 3,
  "stopLossPercent": 1.5,
  "leverage": 5
}
```

**Success Response:**
- **Code:** 200 OK
- **Content Example:**
```json
{
  "symbol": "ETHUSDT",
  "timeframe": "15m",
  "plusDiThreshold": 30,
  "minusDiThreshold": 15,
  "adxMinimum": 25,
  "takeProfitPercent": 3,
  "stopLossPercent": 1.5,
  "leverage": 5
}
```

**Error Responses:**
- **Code:** 400 Bad Request
- **Content Example:**
```json
{
  "error": "Invalid configuration",
  "details": [
    "Missing required fields: leverage",
    "plusDiThreshold must be a positive number",
    "Symbol must be in uppercase format (e.g., BTCUSDT)",
    "Timeframe must be one of: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M"
  ]
}
```

OR

- **Code:** 500 Internal Server Error
- **Content Example:**
```json
{
  "error": "Failed to update configuration"
}
```

## Market Data Endpoints

### Get Current Price

Retrieves the current price for a trading pair.

**URL:** `/market/price`

**Method:** `GET`

**URL Parameters:**
- `symbol=[string]` (optional) - Trading pair symbol. If not provided, uses the default symbol from configuration.

**Success Response:**
- **Code:** 200 OK
- **Content Example:**
```json
{
  "symbol": "BTCUSDT",
  "price": 27123.45
}
```

**Error Responses:**
- **Code:** 400 Bad Request
- **Content Example:**
```json
{
  "error": "Valid symbol is required"
}
```

OR

- **Code:** 500 Internal Server Error
- **Content Example:**
```json
{
  "error": "Failed to get current price for BTCUSDT"
}
```

### Get Market Data with TP/SL

Retrieves market data with take profit and stop loss calculations.

**URL:** `/market/data`

**Method:** `GET`

**URL Parameters:**
- `symbol=[string]` (optional) - Trading pair symbol. If not provided, uses the default symbol from configuration.
- `action=[string]` (optional) - Trading action ('BUY' or 'SELL'). Defaults to 'BUY'.

**Success Response:**
- **Code:** 200 OK
- **Content Example:**
```json
{
  "symbol": "BTCUSDT",
  "action": "BUY",
  "currentPrice": 27123.45,
  "takeProfitPrice": 27665.92,
  "stopLossPrice": 26852.22,
  "takeProfitPercent": 2,
  "stopLossPercent": 1,
  "leverage": 10,
  "priceChangePercent": 1.25,
  "volume": 12345.67,
  "timestamp": "2025-06-09T12:34:56.789Z"
}
```

**Error Responses:**
- **Code:** 400 Bad Request
- **Content Example:**
```json
{
  "error": "Valid symbol is required"
}
```

OR

```json
{
  "error": "Action must be BUY or SELL"
}
```

OR

- **Code:** 500 Internal Server Error
- **Content Example:**
```json
{
  "error": "Failed to get market data"
}
```

## Webhook Endpoint

### Process TradingView Signal

Processes a trading signal from TradingView and creates an order if the signal is valid.

**URL:** `/webhook`

**Method:** `POST`

**Data Constraints:**
```json
{
  "symbol": "[trading pair symbol]",
  "plusDI": "[+DI value]",
  "minusDI": "[-DI value]",
  "adx": "[ADX value]",
  "timeframe": "[timeframe]"
}
```

**Data Example:**
```json
{
  "symbol": "BTCUSDT",
  "plusDI": 27.5,
  "minusDI": 15.0,
  "adx": 25.0,
  "timeframe": "5m"
}
```

**Success Response:**
- **Code:** 200 OK
- **Content Example:**
```json
{
  "success": true,
  "message": "Successfully created BUY order",
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "symbol": "BTCUSDT",
    "action": "BUY",
    "price_entry": 27123.45,
    "tp_price": 27665.92,
    "sl_price": 26852.22,
    "leverage": 10,
    "timeframe": "5m",
    "signal": {
      "plusDI": 27.5,
      "minusDI": 15.0,
      "adx": 25.0
    },
    "timestamp": "2025-06-09T12:34:56.789Z",
    "status": "OPEN"
  }
}
```

**Error Responses:**
- **Code:** 400 Bad Request
- **Content Example:**
```json
{
  "success": false,
  "message": "Invalid signal: Missing required signal data (plusDI, minusDI, or adx)"
}
```

OR

```json
{
  "success": false,
  "message": "Invalid signal: ADX (15) is below minimum threshold (20)"
}
```

OR

```json
{
  "success": false,
  "message": "Invalid signal: Signal does not meet criteria for BUY or SELL"
}
```

OR

- **Code:** 500 Internal Server Error
- **Content Example:**
```json
{
  "success": false,
  "message": "Error processing signal: Failed to get current price for BTCUSDT"
}
```

## Order Endpoints

### Get All Orders

Retrieves all orders.

**URL:** `/orders`

**Method:** `GET`

**URL Parameters:**
- `symbol=[string]` (optional) - Filter orders by symbol
- `status=[string]` (optional) - Filter orders by status

**Success Response:**
- **Code:** 200 OK
- **Content Example:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "symbol": "BTCUSDT",
    "action": "BUY",
    "price_entry": 27123.45,
    "tp_price": 27665.92,
    "sl_price": 26852.22,
    "leverage": 10,
    "timeframe": "5m",
    "signal": {
      "plusDI": 27.5,
      "minusDI": 15.0,
      "adx": 25.0
    },
    "timestamp": "2025-06-09T12:34:56.789Z",
    "status": "OPEN"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "symbol": "ETHUSDT",
    "action": "SELL",
    "price_entry": 1845.67,
    "tp_price": 1808.76,
    "sl_price": 1864.13,
    "leverage": 5,
    "timeframe": "15m",
    "signal": {
      "plusDI": 15.0,
      "minusDI": 27.5,
      "adx": 25.0
    },
    "timestamp": "2025-06-09T11:22:33.456Z",
    "status": "CLOSED"
  }
]
```

**Error Response:**
- **Code:** 500 Internal Server Error
- **Content Example:**
```json
{
  "error": "Failed to retrieve orders"
}
```

### Get Order by ID

Retrieves an order by its ID.

**URL:** `/orders/:orderId`

**Method:** `GET`

**URL Parameters:**
- `orderId=[string]` - ID of the order to retrieve

**Success Response:**
- **Code:** 200 OK
- **Content Example:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "symbol": "BTCUSDT",
  "action": "BUY",
  "price_entry": 27123.45,
  "tp_price": 27665.92,
  "sl_price": 26852.22,
  "leverage": 10,
  "timeframe": "5m",
  "signal": {
    "plusDI": 27.5,
    "minusDI": 15.0,
    "adx": 25.0
  },
  "timestamp": "2025-06-09T12:34:56.789Z",
  "status": "OPEN"
}
```

**Error Responses:**
- **Code:** 400 Bad Request
- **Content Example:**
```json
{
  "error": "Order ID is required"
}
```

OR

- **Code:** 404 Not Found
- **Content Example:**
```json
{
  "error": "Order with ID 550e8400-e29b-41d4-a716-446655440000 not found"
}
```

OR

- **Code:** 500 Internal Server Error
- **Content Example:**
```json
{
  "error": "Failed to retrieve order"
}
```

### Update Order Status

Updates the status of an order.

**URL:** `/orders/:orderId/status`

**Method:** `PUT`

**URL Parameters:**
- `orderId=[string]` - ID of the order to update

**Data Constraints:**
```json
{
  "status": "[status string]"
}
```

**Data Example:**
```json
{
  "status": "CLOSED"
}
```

**Success Response:**
- **Code:** 200 OK
- **Content Example:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "symbol": "BTCUSDT",
  "action": "BUY",
  "price_entry": 27123.45,
  "tp_price": 27665.92,
  "sl_price": 26852.22,
  "leverage": 10,
  "timeframe": "5m",
  "signal": {
    "plusDI": 27.5,
    "minusDI": 15.0,
    "adx": 25.0
  },
  "timestamp": "2025-06-09T12:34:56.789Z",
  "status": "CLOSED",
  "updatedAt": "2025-06-09T13:45:56.789Z"
}
```

**Error Responses:**
- **Code:** 400 Bad Request
- **Content Example:**
```json
{
  "error": "Order ID is required"
}
```

OR

```json
{
  "error": "Status is required"
}
```

OR

```json
{
  "error": "Invalid status. Must be one of: OPEN, CLOSED, CANCELLED, TP_TRIGGERED, SL_TRIGGERED"
}
```

OR

- **Code:** 404 Not Found
- **Content Example:**
```json
{
  "error": "Order with ID 550e8400-e29b-41d4-a716-446655440000 not found"
}
```

OR

- **Code:** 500 Internal Server Error
- **Content Example:**
```json
{
  "error": "Failed to update order status"
}
```

### Delete Order

Deletes an order.

**URL:** `/orders/:orderId`

**Method:** `DELETE`

**URL Parameters:**
- `orderId=[string]` - ID of the order to delete

**Success Response:**
- **Code:** 200 OK
- **Content Example:**
```json
{
  "success": true,
  "message": "Order with ID 550e8400-e29b-41d4-a716-446655440000 deleted successfully"
}
```

**Error Responses:**
- **Code:** 400 Bad Request
- **Content Example:**
```json
{
  "error": "Order ID is required"
}
```

OR

- **Code:** 404 Not Found
- **Content Example:**
```json
{
  "error": "Order with ID 550e8400-e29b-41d4-a716-446655440000 not found"
}
```

OR

- **Code:** 500 Internal Server Error
- **Content Example:**
```json
{
  "error": "Failed to delete order"
}
```

## Valid Timeframes

The following timeframes are valid:
- `1m` - 1 minute
- `3m` - 3 minutes
- `5m` - 5 minutes
- `15m` - 15 minutes
- `30m` - 30 minutes
- `1h` - 1 hour
- `2h` - 2 hours
- `4h` - 4 hours
- `6h` - 6 hours
- `8h` - 8 hours
- `12h` - 12 hours
- `1d` - 1 day
- `3d` - 3 days
- `1w` - 1 week
- `1M` - 1 month 