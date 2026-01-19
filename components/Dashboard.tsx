
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Expense, CategoryColors, Currency } from '../types';

interface DashboardProps {
  expenses: Expense[];
  colors: CategoryColors;
  currency: Currency;
}

const Dashboard: React.FC<DashboardProps> = ({ expenses, colors, currency }) => {
  const pieData = useMemo(() => {
    const data: Record<string, number> = {};
    expenses.forEach(e => {
      data[e.category] = (data[e.category] || 0) + e.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  if (expenses.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Total Spending</h3>
        <p className="text-4xl font-bold text-slate-800">{currency.symbol}{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <div className="h-48 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[entry.name as keyof CategoryColors]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${currency.symbol}${value.toFixed(2)}`, 'Spent']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-6">Spending Distribution</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pieData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }} 
                formatter={(value: number) => [`${currency.symbol}${value.toFixed(2)}`, 'Total']}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {pieData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={colors[entry.name as keyof CategoryColors]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
