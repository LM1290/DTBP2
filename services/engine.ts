import {
  AccountSettings,
  BrokerType,
  CalculationResult,
  InstrumentType,
  Side,
  Trade,
} from "../types";

/**
 * CONSERVATIVE MARGIN ENGINE (Custom House Rules Included)
 *
 * Updates:
 * - Checks 'SPECIAL_MARGIN_REQS' for specific stocks (AVGO, MSTR, etc).
 * - Defaults to standard Reg T rules if ticker is not found.
 */

// 1. Define your custom rules here
const SPECIAL_MARGIN_REQS: Record<string, number> = {
  "AVGO": 0.30,
  "SPY":  0.30,
  "QQQ":  0.30,
  "TSLA": 0.40,
  "NVDA": 0.30,
  "GS":   0.30,
  "GOOG": 0.30,
  "AMD":  0.30,
  "MSTR": 1.00,
  "GLD":  0.30,
};

export const calculateBuyingPower = (
  settings: AccountSettings,
  trades: Trade[]
): CalculationResult => {
  const auditLog: string[] = [];
  const warnings: string[] = [];

  // ------------------------------------------
  // 1. Initialize Start-of-Day State
  // ------------------------------------------
  const startEquity = settings.startOfDayEquity;
  
  // Base DTBP Calc
  const maintenanceExcessStart = Math.max(0, startEquity - settings.startOfDayMaintReq);
  const dtbpCap =
    settings.startOfDayDTBP && settings.startOfDayDTBP > 0
      ? settings.startOfDayDTBP
      : settings.isPDT
        ? maintenanceExcessStart * 4 
        : maintenanceExcessStart * 2;

  auditLog.push(`[Init] Equity: $${startEquity.toLocaleString()} | DTBP Cap: $${dtbpCap.toLocaleString()}`);

  // Trackers
  let dtbpUsed = 0;             
  let currentEquity = startEquity; 
  let currentMaintenanceReq = 0;   

  const openPositions: Record<string, { quantity: number; avgPrice: number }> = {};
  const sortedTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp);

  // ------------------------------------------
  // 2. Process Trades
  // ------------------------------------------
  for (const trade of sortedTrades) {
    const isOption = trade.instrument === InstrumentType.OPTION;
    const isLeveragedETF = trade.instrument === InstrumentType.ETF_LEVERAGED;
    const leverageFactor = trade.leverageFactor || 1; 
    const multiplier = isOption ? 100 : 1;

    // Normalize Symbol for Lookup
    const symbol = trade.symbol.toUpperCase();

    // Financials
    const tradeNotional = trade.quantity * trade.price * multiplier;
    const totalCost = tradeNotional + trade.fees;

    // Action Classification
    const isEntryLong = trade.side === Side.BUY;
    const isEntryShort = trade.side === Side.SELL_SHORT;
    const isEntry = isEntryLong || isEntryShort;

    const isExitLong = trade.side === Side.SELL;
    const isExitShort = trade.side === Side.BUY_TO_COVER;
    const isExit = isExitLong || isExitShort;

    // ------------------------------------------
    // A) REGULATORY CHECK: DTBP Usage
    // ------------------------------------------
    if (isEntry) {
      let consumption = totalCost;

      if (isOption) {
        consumption = totalCost; // Options consume 1:1
      } 
      else if (isLeveragedETF && leverageFactor > 1) {
         // Leverage Penalty
         const penalty = Math.min(leverageFactor, 4);
         consumption = totalCost * penalty;
      }

      dtbpUsed += consumption;
    }

    // ------------------------------------------
    // B) FINANCIAL CHECK: Custom Maintenance Requirements
    // ------------------------------------------
    
    // DETERMINE PERCENTAGE REQUIREMENT
    let reqPercent = 0.25; // Default Standard Stock (25%)

    if (isOption) {
      reqPercent = 1.00; // Options are 100%
    }
    else if (SPECIAL_MARGIN_REQS[symbol]) {
      // *** CUSTOM LOOKUP HAPPENS HERE ***
      reqPercent = SPECIAL_MARGIN_REQS[symbol];
      // Special logic: If shorting a custom stock, add 10% safety buffer? 
      // usually short req = long req + 5-10%, but using flat rate is fine for now.
      if (isEntryShort) reqPercent = Math.max(reqPercent, 0.40); // Shorts minimum 40% usually
    }
    else if (isEntryShort) {
       // Generic Short Rule (Conservative)
       const shortRate = isLeveragedETF ? Math.min(0.40 * leverageFactor, 1.0) : 0.40;
       reqPercent = shortRate;
    } 
    else if (isLeveragedETF) {
       // Generic Lev ETF Rule
       reqPercent = Math.min(0.25 * leverageFactor, 1.0);
    }

    // Calculate Dollar Amount
    const tradeReq = tradeNotional * reqPercent;

    // UPDATE ACCOUNT STATE
    if (isEntry) {
       currentMaintenanceReq += tradeReq;
       currentEquity -= trade.fees; 
       
       if (SPECIAL_MARGIN_REQS[symbol]) {
         auditLog.push(`   -> Custom Rule Applied for ${symbol}: ${reqPercent*100}% Margin Req`);
       }
    } 
    else if (isExit) {
       // Release Margin
       currentMaintenanceReq -= tradeReq;
       
       // Calculate PnL
       const pos = openPositions[symbol];
       if (pos) {
          const costBasis = pos.avgPrice * trade.quantity;
          let pnl = 0;
          if (isExitLong) pnl = tradeNotional - costBasis; 
          if (isExitShort) pnl = costBasis - tradeNotional; 
          
          currentEquity += pnl;
       }
       currentEquity -= trade.fees;
    }

    // ------------------------------------------
    // C) Position Tracking
    // ------------------------------------------
    if (!openPositions[symbol]) {
        openPositions[symbol] = { quantity: 0, avgPrice: 0 };
    }
    
    if (isEntry) {
        const oldQty = openPositions[symbol].quantity;
        const newQty = oldQty + trade.quantity;
        if (newQty > 0) {
          const oldCost = oldQty * openPositions[symbol].avgPrice;
          const newCost = tradeNotional;
          openPositions[symbol].avgPrice = (oldCost + newCost) / newQty;
        }
        openPositions[symbol].quantity = newQty;
    } else {
        openPositions[symbol].quantity -= trade.quantity;
    }
    
    if (openPositions[symbol].quantity <= 0.0001) {
       delete openPositions[symbol];
    }

    // ------------------------------------------
    // D) Warnings
    // ------------------------------------------
    if ((dtbpCap - dtbpUsed) < 0) {
       warnings.push(`VIOLATION: DTBP Exceeded on Trade ${trade.id}`);
    }
    if ((currentEquity - currentMaintenanceReq) < 0) {
       warnings.push(`CRITICAL: MARGIN CALL PREDICTED. Equity < Requirement.`);
    }
  }

  // ------------------------------------------
  // 3. Final Outputs
  // ------------------------------------------
  const finalDTBP = Math.max(0, dtbpCap - dtbpUsed);
  const finalExcess = Math.max(0, currentEquity - currentMaintenanceReq);

  // Option BP = Exactly the Maintenance Excess (1:1 Equity)
  const optionBP = finalExcess;

  // Stock BP = DTBP, capped by Ability to Borrow (Excess * 4)
  const stockBP = Math.min(finalDTBP, finalExcess * 4); 

  if (stockBP <= 0) warnings.push("CRITICAL: Stock Buying Power Depleted");

  return {
    currentEquity: currentEquity,
    currentCash: optionBP, 
    stockBP: stockBP,
    optionBP: optionBP,
    dtbpStartOfDay: dtbpCap,
    intradayBP: stockBP,
    warnings: Array.from(new Set(warnings)),
    auditLog,
    openPositions,
  };
};
