import React, { useState } from 'react';
import { InstrumentType, Side, Trade } from '../types';
import { PlusCircle, Calculator } from 'lucide-react';

interface Props {
  onAddTrade: (t: Trade) => void;
  onPreview: (t: Trade | null) => void;
}

export const TradeForm: React.FC<Props> = ({ onAddTrade, onPreview }) => {
  const [formData, setFormData] = useState<Partial<Trade>>({
    instrument: InstrumentType.STOCK,
    side: Side.BUY,
    quantity: 100,
    price: 0,
    fees: 0,
    symbol: 'SPY'
  });

  const handleChange = (field: keyof Trade, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    // Trigger preview for scenario mode
    if (updated.price && updated.quantity && updated.symbol) {
      onPreview({
        id: 'preview',
        timestamp: Date.now(),
        ...updated
      } as Trade);
    } else {
      onPreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.symbol || !formData.price || !formData.quantity) return;
    
    onAddTrade({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      symbol: formData.symbol.toUpperCase(),
      instrument: formData.instrument || InstrumentType.STOCK,
      side: formData.side || Side.BUY,
      quantity: Number(formData.quantity),
      price: Number(formData.price),
      fees: Number(formData.fees || 0),
      leverageFactor: formData.leverageFactor,
      notes: formData.notes
    });
    
    // Reset critical fields
    setFormData({ ...formData, quantity: 100, price: 0, notes: '' });
    onPreview(null);
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm">
      <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
        <PlusCircle size={20} className="text-emerald-400" /> Log Trade
      </h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="col-span-1">
          <label className="text-xs text-slate-400 block mb-1">Instrument</label>
          <select 
            className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
            value={formData.instrument}
            onChange={e => handleChange('instrument', e.target.value)}
          >
            {Object.values(InstrumentType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="col-span-1">
          <label className="text-xs text-slate-400 block mb-1">Side</label>
          <select 
            className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
            value={formData.side}
            onChange={e => handleChange('side', e.target.value)}
          >
            {Object.values(Side).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="col-span-1">
          <label className="text-xs text-slate-400 block mb-1">Symbol</label>
          <input 
            className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-sm text-white uppercase focus:ring-1 focus:ring-blue-500 outline-none"
            type="text" 
            value={formData.symbol}
            onChange={e => handleChange('symbol', e.target.value)}
          />
        </div>

        <div className="col-span-1">
          <label className="text-xs text-slate-400 block mb-1">Quantity</label>
          <input 
            className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
            type="number" 
            min="1"
            value={formData.quantity}
            onChange={e => handleChange('quantity', Number(e.target.value))}
          />
        </div>

        <div className="col-span-1">
          <label className="text-xs text-slate-400 block mb-1">Price</label>
          <input 
            className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
            type="number" 
            step="0.01"
            value={formData.price || ''}
            onChange={e => handleChange('price', Number(e.target.value))}
          />
        </div>
        
        {formData.instrument === InstrumentType.ETF_LEVERAGED && (
          <div className="col-span-1">
             <label className="text-xs text-slate-400 block mb-1">Leverage (e.g. 3)</label>
             <input 
              className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
              type="number" 
              value={formData.leverageFactor || 3}
              onChange={e => handleChange('leverageFactor', Number(e.target.value))}
            />
          </div>
        )}

        <div className="col-span-2 flex items-end">
          <button 
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-1.5 rounded text-sm transition-colors flex items-center justify-center gap-2"
          >
             <Calculator size={16} /> Enter Trade
          </button>
        </div>
      </form>
    </div>
  );
};
