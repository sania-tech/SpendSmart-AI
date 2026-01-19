
import React, { useState, useEffect } from 'react';
import { Expense, Category, TrainingExample, AiInsight, CategoryColors, Currency } from './types';
import ExpenseForm from './components/ExpenseForm';
import Dashboard from './components/Dashboard';
import History from './components/History';
import SettingsModal from './components/SettingsModal';
import { DEFAULT_CATEGORY_COLORS, CURRENCIES } from './constants';
import { generateInsights } from './services/geminiService';

const App: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [trainingData, setTrainingData] = useState<TrainingExample[]>([]);
  const [categoryColors, setCategoryColors] = useState<CategoryColors>(DEFAULT_CATEGORY_COLORS);
  const [currency, setCurrency] = useState<Currency>(CURRENCIES[0]);
  const [insights, setInsights] = useState<AiInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');

  // Persistence
  useEffect(() => {
    const savedExpenses = localStorage.getItem('smarttrack_expenses');
    const savedTraining = localStorage.getItem('smarttrack_training');
    const savedColors = localStorage.getItem('smarttrack_colors');
    const savedCurrencyCode = localStorage.getItem('smarttrack_currency');
    
    if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
    if (savedTraining) setTrainingData(JSON.parse(savedTraining));
    if (savedColors) setCategoryColors(JSON.parse(savedColors));
    if (savedCurrencyCode) {
      const found = CURRENCIES.find(c => c.code === savedCurrencyCode);
      if (found) setCurrency(found);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('smarttrack_expenses', JSON.stringify(expenses));
    localStorage.setItem('smarttrack_training', JSON.stringify(trainingData));
    localStorage.setItem('smarttrack_colors', JSON.stringify(categoryColors));
    localStorage.setItem('smarttrack_currency', currency.code);
  }, [expenses, trainingData, categoryColors, currency]);

  const addExpense = (newExpense: { amount: number, description: string, category: Category, isAiGenerated: boolean }) => {
    const expense: Expense = {
      ...newExpense,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0]
    };
    setExpenses(prev => [...prev, expense]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const updateExpenseCategory = (id: string, newCategory: Category) => {
    setExpenses(prev => prev.map(e => {
      if (e.id === id) {
        if (e.category !== newCategory) {
          const newFeedback: TrainingExample = {
            description: e.description,
            correctCategory: newCategory
          };
          setTrainingData(t => {
             const exists = t.find(item => item.description === e.description);
             if (exists) {
               return t.map(item => item.description === e.description ? newFeedback : item);
             }
             return [...t, newFeedback].slice(-20);
          });
        }
        return { ...e, category: newCategory, userCorrected: true, feedbackStatus: undefined };
      }
      return e;
    }));
  };

  const handleAiFeedback = (id: string, status: 'positive' | 'negative') => {
    setExpenses(prev => prev.map(e => {
      if (e.id === id) {
        if (status === 'positive') {
          // Confirming the AI was right - add to training data to reinforce
          const newFeedback: TrainingExample = {
            description: e.description,
            correctCategory: e.category
          };
          setTrainingData(t => {
             const exists = t.find(item => item.description === e.description);
             if (!exists) return [...t, newFeedback].slice(-20);
             return t;
          });
          return { ...e, feedbackStatus: 'positive', userCorrected: true };
        } else {
          // Marking as wrong - just visually flag it and keep suggested state until changed
          return { ...e, feedbackStatus: 'negative' };
        }
      }
      return e;
    }));
  };

  const updateCategoryColor = (category: Category, color: string) => {
    setCategoryColors(prev => ({ ...prev, [category]: color }));
  };

  const runAnalysis = async () => {
    if (expenses.length === 0) return;
    setIsAnalyzing(true);
    try {
      const newInsights = await generateInsights(expenses, currency);
      setInsights(newInsights);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to generate insights";
      console.error("❌ Analysis error:", errorMsg);
      alert(`Analysis Error: ${errorMsg}\n\nMake sure your VITE_OPENROUTER_API_KEY is set in .env.local`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 mb-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-indigo-200 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">SpendSmart AI</h1>
          </div>
          <div className="flex gap-3 items-center">
            {/* Tab Navigation in Header */}
            <div className="flex gap-4 border-r border-slate-200 pr-4">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-1.5 pb-2 font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 pb-2 font-semibold transition-all ${
                  activeTab === 'history'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                History
              </button>
            </div>

            {/* Settings & AI Analyze */}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <button 
              onClick={runAnalysis}
              disabled={isAnalyzing || expenses.length === 0}
              className="flex items-center gap-2 text-sm font-semibold bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-all border border-indigo-100 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              )}
              AI Analyze
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6">

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <>
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome back</h2>
              <p className="text-slate-500 text-sm">Monitor your wealth in {currency.code} and categorize expenses with precision.</p>
            </div>

            <ExpenseForm onAdd={addExpense} trainingData={trainingData} currency={currency} />

            <Dashboard expenses={expenses} colors={categoryColors} currency={currency} />

            {/* AI Insights Card */}
            {insights && (
              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl shadow-xl shadow-indigo-200 mb-8 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-10 opacity-10">
                    <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
                 </div>
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
                   AI Financial Insights
                 </h3>
                 <div className="flex items-center gap-2 text-xs font-bold uppercase text-indigo-300 mb-2">
                   Insight for {currency.code}
                 </div>
                 <p className="mb-6 opacity-90 leading-relaxed text-indigo-50">{insights.summary}</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-2">Key Suggestions</h4>
                 <ul className="space-y-2">
                   {insights.suggestions.map((s, idx) => (
                     <li key={idx} className="flex items-start gap-2 text-sm bg-white/10 p-3 rounded-xl border border-white/10">
                        <span className="text-indigo-300 font-bold">•</span>
                        {s}
                     </li>
                   ))}
                 </ul>
               </div>
               <div>
                 <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-2">Predictions</h4>
                 <div className="bg-white/10 p-4 rounded-2xl border border-white/10 h-full">
                    <p className="text-sm italic leading-relaxed">{insights.prediction}</p>
                 </div>
               </div>
             </div>
             <button onClick={() => setInsights(null)} className="absolute top-4 right-4 opacity-50 hover:opacity-100">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l18 18"/></svg>
             </button>
          </div>
        )}

            {/* Expense List */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Recent Transactions</h3>
              <span className="text-xs text-slate-400 font-medium px-2 py-1 bg-slate-50 rounded-full">{expenses.length} Total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-widest font-bold">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-right">Amount ({currency.symbol})</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          <p className="font-medium">No expenses recorded yet.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    [...expenses].reverse().slice(0, 10).map((expense) => (
                      <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">{expense.date}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-800">{expense.description}</span>
                            {expense.isAiGenerated && !expense.userCorrected && (
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] text-indigo-500 font-bold flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
                                  AI Suggested
                                </span>
                                <div className="flex gap-1.5 ml-1">
                                  <button 
                                    onClick={() => handleAiFeedback(expense.id, 'positive')}
                                    className={`p-1 rounded-md transition-colors ${expense.feedbackStatus === 'positive' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-50'}`}
                                    title="Accurate prediction"
                                  >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                                  </button>
                                  <button 
                                    onClick={() => handleAiFeedback(expense.id, 'negative')}
                                    className={`p-1 rounded-md transition-colors ${expense.feedbackStatus === 'negative' ? 'text-rose-600 bg-rose-50' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`}
                                    title="Incorrect prediction"
                                  >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.641a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" /></svg>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={expense.category}
                            onChange={(e) => updateExpenseCategory(expense.id, e.target.value as Category)}
                            style={{ 
                              borderColor: categoryColors[expense.category] + '40',
                              backgroundColor: categoryColors[expense.category] + '10',
                              color: categoryColors[expense.category]
                            }}
                            className={`text-xs font-bold px-3 py-1.5 rounded-full border-2 outline-none cursor-pointer transition-all ${expense.feedbackStatus === 'negative' ? 'ring-2 ring-rose-300 ring-offset-1' : ''}`}
                          >
                            {Object.keys(categoryColors).map(cat => (
                              <option key={cat} value={cat} style={{ color: '#334155' }}>{cat}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-slate-800">
                            {currency.symbol}{expense.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => deleteExpense(expense.id)}
                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}

        {/* History View */}
        {activeTab === 'history' && (
          <History 
            expenses={expenses} 
            colors={categoryColors} 
            currency={currency}
            onDeleteExpense={deleteExpense}
            onUpdateCategory={updateExpenseCategory}
          />
        )}
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal 
          colors={categoryColors} 
          onUpdateColor={updateCategoryColor} 
          currency={currency}
          onUpdateCurrency={setCurrency}
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;
