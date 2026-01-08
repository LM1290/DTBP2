import React, { useMemo } from 'react';
import { CalculationResult, Trade, InstrumentType } from '../types';
import { AlertTriangle, CheckCircle, Info, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  data: CalculationResult;
  trades: Trade[];
  scenarioData: CalculationResult | null;
  onDeleteTrade: (id: string) => void;
}

export const Dashboard: React.FC<Props> = ({ data, trades, scenarioData, onDeleteTrade }) => {
  // Use scenario data if available for "What-If" analysis
  const displayData = scenarioData || data;
  const isScenario = !!scenarioData;

  const bpUtilization = useMemo(() => {
    // Determine usage percentage for visual bar
    const max = displayData.dtbpStartOfDay;
    const current = displayData.stockBP;
    return Math.max(0, Math.min(100, (current / max) * 100));
  }, [displayData]);

  const riskColor = displayData.warnings.length > 0 ? 'bg-rose-500' : (bpUtilization < 20 ? 'bg-amber-500' : 'bg-emerald-500');

  // Chart Data Preparation
  const chartData = [
    { name: 'Stock BP', value: displayData.stockBP },
    { name: 'Option BP', value: displayData.optionBP },
    { name: 'Cash', value: displayData.currentCash },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* KPI Cards */}
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Stock BP Card */}
        <div className={`relative p-6 rounded-xl border ${isScenario ? 'border-amber-500/50 bg-amber-900/10' : 'border-slate-700 bg-slate-800'} overflow-hidden`}>
           {isScenario && <div className="absolute top-2 right-2 text-amber-500 text-xs font-bold uppercase tracking-wider">Scenario Mode</div>}
           <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Stock Buying Power</h3>
           <div className="text-4xl font-bold text-white tracking-tight">
             ${displayData.stockBP.toLocaleString()}
           </div>
           <div className="mt-4 h-2 w-full bg-slate-700 rounded-full overflow-hidden">
             <div 
               className={`h-full ${riskColor} transition-all duration-500`} 
               style={{ width: `${bpUtilization}%` }}
             />
           </div>
           <p className="text-xs text-slate-500 mt-2">
             {bpUtilization.toFixed(1)}% of Start Day Limit Remaining
           </p>
        </div>

        {/* Option BP Card */}
        <div className={`relative p-6 rounded-xl border ${isScenario ? 'border-amber-500/50 bg-amber-900/10' : 'border-slate-700 bg-slate-800'}`}>
           <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Option Buying Power</h3>
           <div className="text-4xl font-bold text-white tracking-tight">
             ${displayData.optionBP.toLocaleString()}
           </div>
           <p className="text-xs text-slate-500 mt-2">
             Cash Available (Conservative Model)
           </p>
        </div>

        {/* Warnings Panel */}
        {displayData.warnings.length > 0 && (
          <div className="sm:col-span-2 bg-rose-900/20 border border-rose-800 rounded-lg p-4 flex items-start gap-3">
             <AlertTriangle className="text-rose-500 shrink-0" />
             <div>
               <h4 className="text-rose-400 font-bold text-sm">Risk Warning</h4>
               <ul className="text-rose-300 text-sm list-disc list-inside">
                 {displayData.warnings.map((w, i) => <li key={i}>{w}</li>)}
               </ul>
             </div>
          </div>
        )}
      </div>

      {/* Chart Panel */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 min-h-[200px]">
        <h4 className="text-slate-400 text-xs uppercase mb-4">Liquidity Overview</h4>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
              cursor={{fill: 'transparent'}}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : index === 1 ? '#8b5cf6' : '#10b981'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Audit Log / Explain Panel */}
      <div className="lg:col-span-3 bg-slate-900 rounded-lg border border-slate-700 p-4">
        <h4 className="text-slate-400 text-xs uppercase mb-2 flex items-center gap-2">
          <Info size={14} /> Calculation Audit Trail
        </h4>
        <div className="bg-black/40 rounded p-3 h-48 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
          {displayData.auditLog.map((log, i) => (
            <div key={i} className="border-b border-slate-800/50 pb-1 mb-1 last:border-0">
              <span className="text-slate-500 select-none mr-2">{i+1}.</span>
              {log}
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Trades Table */}
      <div className="lg:col-span-3">
        <h3 className="text-white font-bold text-lg mb-4">Recent Trades</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-800 text-xs uppercase">
              <tr>
                <th className="p-3 rounded-l">Time</th>
                <th className="p-3">Symbol</th>
                <th className="p-3">Side</th>
                <th className="p-3 text-right">Qty</th>
                <th className="p-3 text-right">Price</th>
                <th className="p-3 text-right">Cost</th>
                <th className="p-3 text-center rounded-r w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {trades.length === 0 ? (
                <tr><td colSpan={7} className="p-4 text-center text-slate-600">No trades logged yet.</td></tr>
              ) : (
                [...trades].reverse().map(trade => {
                   const isOption = trade.instrument === InstrumentType.OPTION;
                   const multiplier = isOption ? 100 : 1;
                   const totalCost = (trade.quantity * trade.price * multiplier) + trade.fees;
                   
                   return (
                    <tr key={trade.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-3">{new Date(trade.timestamp).toLocaleTimeString()}</td>
                      <td className="p-3 font-bold text-white">
                        {trade.symbol}
                        {isOption && <span className="text-xs text-slate-500 font-normal ml-1">(Opt)</span>}
                      </td>
                      <td className={`p-3 font-medium ${trade.side.includes('Buy') ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trade.side}
                      </td>
                      <td className="p-3 text-right">{trade.quantity}</td>
                      <td className="p-3 text-right">${trade.price.toFixed(2)}</td>
                      <td className="p-3 text-right text-slate-300">
                        ${totalCost.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => onDeleteTrade(trade.id)}
                          className="text-slate-500 hover:text-rose-500 transition-colors p-1"
                          title="Delete Trade"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
