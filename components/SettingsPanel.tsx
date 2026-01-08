import React from 'react';
import { AccountSettings, AccountType, BrokerType, DEFAULT_SETTINGS } from '../types';

interface Props {
  settings: AccountSettings;
  onSave: (s: AccountSettings) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<Props> = ({ settings, onSave, isOpen, onClose }) => {
  const [localSettings, setLocalSettings] = React.useState<AccountSettings>(settings);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-lg shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-2">Configuration</h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1">Broker Logic</label>
              <select 
                className="w-full bg-slate-800 border border-slate-600 text-white p-2 rounded"
                value={localSettings.broker}
                onChange={(e) => setLocalSettings({...localSettings, broker: e.target.value as BrokerType})}
              >
                {Object.values(BrokerType).map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {localSettings.broker === BrokerType.FIDELITY && "Uses fixed Start-of-Day DTBP. Intraday gains restore BP, overnight sales do not."}
                {localSettings.broker === BrokerType.SCHWAB_TOS && "Dynamic DTBP. Leveraged ETFs consume extra BP."}
              </p>
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-1">Account Type</label>
              <select 
                className="w-full bg-slate-800 border border-slate-600 text-white p-2 rounded"
                value={localSettings.accountType}
                onChange={(e) => setLocalSettings({...localSettings, accountType: e.target.value as AccountType})}
              >
                <option value={AccountType.MARGIN}>Margin</option>
                <option value={AccountType.CASH}>Cash</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-3 mt-4">
              <input 
                type="checkbox" 
                id="isPDT"
                className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                checked={localSettings.isPDT}
                onChange={(e) => setLocalSettings({...localSettings, isPDT: e.target.checked})}
              />
              <label htmlFor="isPDT" className="text-white">Pattern Day Trader (PDT)</label>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-lg text-blue-400 font-semibold mb-3">Start of Day Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-sm mb-1">Prior Day Equity ($)</label>
                <input 
                  type="number"
                  className="w-full bg-slate-800 border border-slate-600 text-white p-2 rounded"
                  value={localSettings.startOfDayEquity}
                  onChange={(e) => setLocalSettings({...localSettings, startOfDayEquity: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Prior Day Maint. Req ($)</label>
                <input 
                  type="number"
                  className="w-full bg-slate-800 border border-slate-600 text-white p-2 rounded"
                  value={localSettings.startOfDayMaintReq}
                  onChange={(e) => setLocalSettings({...localSettings, startOfDayMaintReq: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Start Cash Balance ($)</label>
                <input 
                  type="number"
                  className="w-full bg-slate-800 border border-slate-600 text-white p-2 rounded"
                  value={localSettings.startOfDayCash}
                  onChange={(e) => setLocalSettings({...localSettings, startOfDayCash: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Broker DTBP Override ($)</label>
                <input 
                  type="number"
                  placeholder="Optional"
                  className="w-full bg-slate-800 border border-slate-600 text-white p-2 rounded"
                  value={localSettings.startOfDayDTBP || ''}
                  onChange={(e) => setLocalSettings({...localSettings, startOfDayDTBP: Number(e.target.value)})}
                />
                <p className="text-xs text-slate-500 mt-1">Leave 0 to calculate from Equity/Maint.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white">Cancel</button>
          <button onClick={() => { onSave(localSettings); onClose(); }} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
