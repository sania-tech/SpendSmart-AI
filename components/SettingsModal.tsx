
import React from 'react';
import { Category, CategoryColors, Currency } from '../types';
import { CATEGORIES, CURRENCIES } from '../constants';

interface SettingsModalProps {
  colors: CategoryColors;
  onUpdateColor: (category: Category, color: string) => void;
  currency: Currency;
  onUpdateCurrency: (currency: Currency) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  colors, 
  onUpdateColor, 
  currency, 
  onUpdateCurrency, 
  onClose 
}) => {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Preferences
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-8">
          {/* Currency Section */}
          <section>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Currency Settings</h4>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Currency</label>
              <select 
                value={currency.code}
                onChange={(e) => {
                  const selected = CURRENCIES.find(c => c.code === e.target.value);
                  if (selected) onUpdateCurrency(selected);
                }}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label} ({c.symbol})</option>
                ))}
              </select>
            </div>
          </section>

          {/* Colors Section */}
          <section>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Category Visuals</h4>
            <div className="space-y-3">
              {CATEGORIES.map(cat => (
                <div key={cat} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <span className="text-sm font-medium text-slate-700">{cat}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{colors[cat]}</span>
                    <input 
                      type="color" 
                      value={colors[cat]} 
                      onChange={(e) => onUpdateColor(cat, e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 bg-transparent overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-lg shadow-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-indigo-600 text-white font-bold py-2.5 px-8 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
