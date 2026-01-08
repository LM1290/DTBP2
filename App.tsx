import React, { useState, useEffect } from 'react';
import { AccountSettings, DEFAULT_SETTINGS, Trade, CalculationResult } from './types';
import { calculateBuyingPower } from './services/engine';
import { SettingsPanel } from './components/SettingsPanel';
import { TradeForm } from './components/TradeForm';
import { Dashboard } from './components/Dashboard';
import { Reconciliation } from './components/Reconciliation';
import { Settings, ShieldCheck, RefreshCw, RotateCcw } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<AccountSettings>(DEFAULT_SETTINGS);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [calculationResult, setCalculationResult] = useState<CalculationResult>(
    calculateBuyingPower(DEFAULT_SETTINGS, [])
  );
  
  // Scenario Mode State
  const [previewTrade, setPreviewTrade] = useState<Trade | null>(null);
  const [scenarioResult, setScenarioResult] = useState<CalculationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reconcile'>('dashboard');

  // Recalculate whenever inputs change
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

  const handleAddTrade = (trade: Trade) => {
    setTrades(prev => [...prev, trade]);
  };

  const handleDeleteTrade = (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  const handleResetSession = () => {
    if (window.confirm("Are you sure you want to clear all trades and reset the session?")) {
      setTrades([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-blue-500" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              True DTBP
            </h1>
            <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700 ml-2">
              {settings.broker} Mode
            </span>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
              onClick={handleResetSession}
              className="text-slate-400 hover:text-rose-400 transition-colors p-2"
              title="Reset Session (Clear All Trades)"
            >
              <RotateCcw size={20} />
            </button>
            <div className="h-6 w-px bg-slate-800"></div>
             <button 
              onClick={() => setActiveTab('reconcile')}
              className={`text-sm font-medium flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${activeTab === 'reconcile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <RefreshCw size={16} /> <span className="hidden sm:inline">Reconcile</span>
            </button>
            <button 
              onClick={() => setActiveTab('dashboard')}
               className={`text-sm font-medium flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${activeTab === 'dashboard' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {activeTab === 'dashboard' ? (
          <div className="space-y-6">
            <TradeForm onAddTrade={handleAddTrade} onPreview={setPreviewTrade} />
            <Dashboard 
              data={calculationResult} 
              trades={trades} 
              scenarioData={scenarioResult}
              onDeleteTrade={handleDeleteTrade}
            />
          </div>
        ) : (
          <Reconciliation calculated={calculationResult} />
        )}

      </main>

      <SettingsPanel 
        settings={settings} 
        onSave={setSettings} 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      
      {/* Disclaimer Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-8 text-center border-t border-slate-800 mt-8">
        <p className="text-xs text-slate-600">
          DISCLAIMER: This application is a simulation and planning tool only. Broker margin rules are complex and subject to change. 
          Real-time broker data may differ due to intraday volatility, specific house rules, or delayed reporting. 
          Always confirm buying power with your broker before executing trades. Not financial advice.
        </p>
      </footer>

    </div>
  );
}