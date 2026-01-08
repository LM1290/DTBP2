export enum BrokerType {
  GENERIC_FINRA = 'Generic (FINRA Rule 4210)',
  FIDELITY = 'Fidelity',
  SCHWAB_TOS = 'Schwab / thinkorswim'
}

export enum AccountType {
  MARGIN = 'Margin',
  CASH = 'Cash',
}

export enum InstrumentType {
  STOCK = 'Stock',
  OPTION = 'Option',
  ETF_LEVERAGED = 'ETF (Leveraged)'
}

export enum Side {
  BUY = 'Buy',
  SELL = 'Sell',
  SELL_SHORT = 'Sell Short',
  BUY_TO_COVER = 'Buy to Cover'
}

export interface Trade {
  id: string;
  timestamp: number;
  symbol: string;
  instrument: InstrumentType;
  side: Side;
  quantity: number;
  price: number;
  fees: number;
  leverageFactor?: number; // For leveraged ETFs (e.g. 3x)
  notes?: string;
}

export interface AccountSettings {
  broker: BrokerType;
  accountType: AccountType;
  isPDT: boolean;
  startOfDayEquity: number;
  startOfDayMaintReq: number; // Maintenance Requirement
  startOfDayCash: number; // Settled Cash
  startOfDayDTBP?: number; // Broker reported start value
  maintenanceMarginPct: number; // e.g., 0.25 for 25%
}

export interface CalculationResult {
  currentEquity: number;
  currentCash: number;
  stockBP: number; // Day Trade BP for stocks
  optionBP: number; // Cash BP for options
  dtbpStartOfDay: number; // The static cap (for Fidelity/Generic)
  intradayBP: number; // The dynamic component
  warnings: string[];
  auditLog: string[];
  openPositions: Record<string, { quantity: number; avgCost: number }>;
}

export const DEFAULT_SETTINGS: AccountSettings = {
  broker: BrokerType.GENERIC_FINRA,
  accountType: AccountType.MARGIN,
  isPDT: true,
  startOfDayEquity: 30000,
  startOfDayMaintReq: 0,
  startOfDayCash: 30000,
  startOfDayDTBP: 0, // 0 implies calc from equity/maint
  maintenanceMarginPct: 0.25,
};
