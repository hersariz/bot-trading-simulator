export interface ConfigType {
  symbol: string;
  timeframe: string;
  quantity: number;
  leverage: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  trailingStop: boolean;
  trailingStopPercent: number;
  plusDiThreshold: number;
  minusDiThreshold: number;
  adxMinimum: number;
  marketDataSource?: 'binance' | 'coingecko';
}

export interface OrderType {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: string;
  quantity: number;
  price: number;
  status: string;
  entryTime: string;
  closeTime?: string;
  closePrice?: number;
  profit?: number;
  profitPercent?: number;
}

export interface PositionType {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  quantity: number;
  leverage: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  status: 'OPEN' | 'CLOSED';
  pnl: number;
  pnlPercent: number;
  createdAt: string;
  closedAt?: string;
}

export interface MarketDataType {
  symbol: string;
  price: number;
  timestamp: number;
  currentPrice?: number;
}

export interface WebhookSignalType {
  symbol: string;
  plusDI: number;
  minusDI: number;
  adx: number;
  timeframe: string;
} 