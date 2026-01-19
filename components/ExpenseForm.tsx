
import React, { useState } from 'react';
import { Category, TrainingExample, Currency } from '../types';
import { CATEGORIES } from '../constants';
import { predictCategory } from '../services/geminiService';

interface ExpenseFormProps {
  onAdd: (expense: { amount: number, description: string, category: Category, isAiGenerated: boolean }) => void;
  trainingData: TrainingExample[];
  currency: Currency;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAdd, trainingData, currency }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Others');
  const [isPredicting, setIsPredicting] = useState(false);

  const handlePredict = async () => {
    if (!description) return;
    setIsPredicting(true);
    try {
      const prediction = await predictCategory(description, trainingData);
      setCategory(prediction);
      console.log("✅ Auto-prediction successful:", prediction);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("❌ Prediction failed:", errorMsg);
      // Don't show alert for user, just log it
    } finally {
      setIsPredicting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    onAdd({
      description,
      amount: parseFloat(amount),
      category,
      isAiGenerated: true // Mark as AI suggested initially
    });
    setDescription('');
    setAmount('');
    setCategory('Others');
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</label>
          <div className="relative">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => !isPredicting && handlePredict()}
              placeholder="E.g. Netflix Subscription"
              className="form-input"
              required
            />
            {isPredicting && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Amount ({currency.symbol})</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="form-input"
            required
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="form-input"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isPredicting}
          className="btn-primary w-full"
        >
          Add Expense
        </button>
      </div>
      {isPredicting && <p className="text-xs text-indigo-500 mt-3 animate-pulse">AI is analyzing your entry to suggest a category...</p>}
    </form>
  );
};

export default ExpenseForm;
