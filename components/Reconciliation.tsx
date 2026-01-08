import React, { useState } from 'react';
import { CalculationResult } from '../types';

interface Props {
  calculated: CalculationResult;
}

export const Reconciliation: React.FC<Props> = ({ calculated }) => {
  const [brokerValues, setBrokerValues] = useState({
    dtbp: '',
    optionBP: '',
    availableCash: ''
  });

  const getDrift = (calc: number, broker: string) => {
    const val = parseFloat(broker);
    if (isNaN(val)) return null;
    return val - calc;
  };

  const dtbpDrift = getDrift(calculated.stockBP, brokerValues.dtbp);
  const optionDrift = getDrift(calculated.optionBP, brokerValues.optionBP);

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 mt-6">
      <h3 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2">Broker Reconciliation</h3>
      <p className="text-sm text-slate-400 mb-4">
        Enter the values currently displayed on your broker's platform (Fidelity/Schwab/ToS) to check for discrepancies.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* DTBP Comparison */}
        <div className="bg-slate-900 p-4 rounded border border-slate-700">
          <label className="block text-slate-400 text-xs uppercase font-bold mb-2">Stock / Day Trade BP</label>
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500">Calculated:</span>
            <span className="text-white font-mono">${calculated.stockBP.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-blue-400">Broker:</span>
            <input 
              type="number" 
              className="w-24 bg-slate-800 border border-slate-600 text-right text-white text-sm p-1 rounded"
              placeholder="0.00"
              value={brokerValues.dtbp}
              onChange={e => setBrokerValues({...brokerValues, dtbp: e.target.value})}
            />
          </div>
          {dtbpDrift !== null && (
            <div className={`text-right text-xs font-bold ${Math.abs(dtbpDrift) < 1 ? 'text-emerald-500' : 'text-rose-500'}`}>
              Drift: ${dtbpDrift.toLocaleString()}
            </div>
          )}
          {dtbpDrift !== null && Math.abs(dtbpDrift) > 100 && (
             <div className="mt-2 text-xs text-amber-500 bg-amber-900/20 p-2 rounded">
               Tip: Check "Leveraged ETF" settings or confirm if broker includes unsettled cash.
             </div>
          )}
        </div>

        {/* Option BP Comparison */}
        <div className="bg-slate-900 p-4 rounded border border-slate-700">
          <label className="block text-slate-400 text-xs uppercase font-bold mb-2">Option BP / Cash</label>
           <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500">Calculated:</span>
            <span className="text-white font-mono">${calculated.optionBP.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-blue-400">Broker:</span>
             <input 
              type="number" 
              className="w-24 bg-slate-800 border border-slate-600 text-right text-white text-sm p-1 rounded"
              placeholder="0.00"
              value={brokerValues.optionBP}
              onChange={e => setBrokerValues({...brokerValues, optionBP: e.target.value})}
            />
          </div>
           {optionDrift !== null && (
            <div className={`text-right text-xs font-bold ${Math.abs(optionDrift) < 1 ? 'text-emerald-500' : 'text-rose-500'}`}>
              Drift: ${optionDrift.toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
