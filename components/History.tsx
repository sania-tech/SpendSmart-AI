import React, { useState, useMemo } from 'react';
import { Expense, Currency, CategoryColors } from '../types';
import { CATEGORIES } from '../constants';

interface HistoryProps {
  expenses: Expense[];
  colors: CategoryColors;
  currency: Currency;
  onDeleteExpense: (id: string) => void;
  onUpdateCategory: (id: string, category: string) => void;
}

const History: React.FC<HistoryProps> = ({ 
  expenses, 
  colors, 
  currency, 
  onDeleteExpense,
  onUpdateCategory 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(e =>
        e.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (filterCategory !== 'All') {
      filtered = filtered.filter(e => e.category === filterCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });

    return filtered;
  }, [expenses, searchTerm, filterCategory, sortBy]);

  const totalExpenses = useMemo(() => 
    filteredExpenses.reduce((sum, e) => sum + e.amount, 0), 
    [filteredExpenses]
  );

  const avgExpense = useMemo(() => 
    filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0,
    [filteredExpenses, totalExpenses]
  );

  if (expenses.length === 0) {
    return (
      <div className="card text-center py-12">
        <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-slate-500 font-medium">No expense history yet</p>
        <p className="text-slate-400 text-sm">Start adding expenses to see them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Total Expenses</p>
          <p className="text-3xl font-bold text-slate-800">{currency.symbol}{totalExpenses.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-2">{filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Average Expense</p>
          <p className="text-3xl font-bold text-slate-800">{currency.symbol}{avgExpense.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-2">Per transaction</p>
        </div>

        <div className="card">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Period</p>
          <p className="text-lg font-bold text-slate-800">
            {filteredExpenses.length > 0 
              ? `${filteredExpenses[filteredExpenses.length - 1].date} to ${filteredExpenses[0].date}`
              : 'N/A'
            }
          </p>
          <p className="text-xs text-slate-400 mt-2">Date range</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search expenses..."
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="form-input"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="form-input"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-slate-400 text-[11px] uppercase tracking-widest font-bold">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Amount ({currency.symbol})</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="font-medium">No expenses found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">{expense.date}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-800">{expense.description}</span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={expense.category}
                        onChange={(e) => onUpdateCategory(expense.id, e.target.value)}
                        style={{
                          borderColor: colors[expense.category] + '40',
                          backgroundColor: colors[expense.category] + '10',
                          color: colors[expense.category]
                        }}
                        className="text-xs font-bold px-3 py-1.5 rounded-full border-2 outline-none cursor-pointer transition-all"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat} style={{ color: '#334155' }}>{cat}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-slate-800">
                        {currency.symbol}{expense.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {expense.isAiGenerated ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 rounded-full">
                          <svg className="w-3 h-3 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zM2.05 6.464A1 1 0 103.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707z" />
                          </svg>
                          <span className="text-[10px] font-bold text-indigo-600">AI</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">Manual</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onDeleteExpense(expense.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Delete expense"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;
