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

  // Load initial data from Supabase
  useEffect(() => {
    const loadData = async () => {
      const { data: tradesData } = await supabase.from('trades').select('*').order('timestamp', { ascending: true });
      const { data: settingsData } = await supabase.from('settings').select('*').single();

      if (tradesData) setTrades(tradesData);
      if (settingsData) setSettings(settingsData);
    };
    loadData();
  }, []);

  // Recalculate whenever local state changes
  useEffect(() => {
    const res = calculateBuyingPower(settings, trades);
    setCalculationResult(res);
  }, [settings, trades]);

  // Handle Scenario Calculation
  useEffect(() => {
    if (previewTrade) {
      const scenarioTrades = [...trades, previewTrade];
      setScenarioResult(calculateBuyingPower(settings, scenarioTrades));
    } else {
      setScenarioResult(null);
    }
  }, [previewTrade, settings, trades]);

  const handleAddTrade = async (trade: Trade) => {
    const { error } = await supabase.from('trades').insert([trade]);
    if (!error) {
      setTrades(prev => [...prev, trade]);
    } else {
      console.error("Error saving trade:", error);
    }
  };

  const handleDeleteTrade = async (id: string) => {
    const { error } = await supabase.from('trades').delete().eq('id', id);
    if (!error) {
      setTrades(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleSaveSettings = async (newSettings: AccountSettings) => {
    const { error } = await supabase.from('settings').upsert({ id: 1, ...newSettings });
    if (!error) {
      setSettings(newSettings);
    }
  };

  const handleResetSession = async () => {
    if (window.confirm("Are you sure you want to clear all trades?")) {
      const { error } = await supabase.from('trades').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (!error) {
        setTrades([]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-blue-500" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">True DTBP</h1>
            <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700 ml-2">
              {settings.broker} Mode
            </span>
          </div>
          
          <div className="flex items-center gap-4">
             <button onClick={handleResetSession} className="text-slate-400 hover:text-rose-400 transition-colors p-2"><RotateCcw size={20} /></button>
             <div className="h-6 w-px bg-slate-800"></div>
             <button onClick={() => setActiveTab('reconcile')} className={`text-sm font-medium flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${activeTab === 'reconcile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>
              <RefreshCw size={16} /> <span className="hidden sm:inline">Reconcile</span>
            </button>
            <button onClick={() => setActiveTab('dashboard')} className={`text-sm font-medium flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${activeTab === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>
              Dashboard
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="text-slate-400 hover:text-white transition-colors"><Settings size={20} /></button>
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
      
      <footer className="max-w-7xl mx-auto px-4 py-8 text-center border-t border-slate-800 mt-8">
        <p className="text-xs text-slate-600">DISCLAIMER: Simulation tool only. Verify with your broker before trading.</p>
      </footer>
    </div>
  );
}
