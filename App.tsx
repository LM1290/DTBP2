import React, { useState, useEffect } from 'react';
import { AccountSettings, DEFAULT_SETTINGS, Trade, CalculationResult } from './types';
import { calculateBuyingPower } from './services/engine';
import { SettingsPanel } from './components/SettingsPanel';
import { TradeForm } from './components/TradeForm';
import { Dashboard } from './components/Dashboard';
import { Reconciliation } from './components/Reconciliation';
import { Settings, ShieldCheck, RefreshCw, RotateCcw } from 'lucide-react';
import { supabase } from './services/supabase';

export default function App() {
  const [settings, setSettings] = useState<AccountSettings>(DEFAULT_SETTINGS);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [calculationResult, setCalculationResult] = useState<CalculationResult>(
    calculateBuyingPower(DEFAULT_SETTINGS, [])
  );
  
  const [previewTrade, setPreviewTrade] = useState<Trade | null>(null);
  const [scenarioResult, setScenarioResult] = useState<CalculationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reconcile'>('dashboard');

  // Load data from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      const { data: tradesData } = await supabase.from('trades').select('*').order('timestamp', { ascending: true });
      const { data: settingsData } = await supabase.from('settings').select('*').single();
      if (tradesData) setTrades(tradesData);
      if (settingsData) setSettings(settingsData);
    };
    loadData();
  }, []);

  useEffect(() => {
    setCalculationResult(calculateBuyingPower(settings, trades));
  }, [settings, trades]);

  const handleAddTrade = async (trade: Trade) => {
    setTrades(prev => [...prev, trade]); // Immediate UI update
    await supabase.from('trades').insert([trade]); // Background save
  };

  const handleDeleteTrade = async (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
    await supabase.from('trades').delete().eq('id', id);
  };

  const handleSaveSettings = async (newSettings: AccountSettings) => {
    setSettings(newSettings);
    await supabase.from('settings').upsert({ id: 1, ...newSettings });
  };

  const handleResetSession = async () => {
    if (window.confirm("Clear all trades?")) {
      setTrades([]);
      await supabase.from('trades').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-blue-500" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">True DTBP</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleResetSession} className="p-2 text-slate-400 hover:text-rose-400"><RotateCcw size={20} /></button>
            <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1.5 rounded ${activeTab === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>Dashboard</button>
            <button onClick={() => setIsSettingsOpen(true)} className="text-slate-400 hover:text-white"><Settings size={20} /></button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' ? (
          <div className="space-y-6">
            <TradeForm onAddTrade={handleAddTrade} onPreview={setPreviewTrade} />
            <Dashboard data={calculationResult} trades={trades} scenarioData={scenarioResult} onDeleteTrade={handleDeleteTrade} />
          </div>
        ) : (
          <Reconciliation calculated={calculationResult} />
        )}
      </main>
      <SettingsPanel settings={settings} onSave={handleSaveSettings} isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
