
import { Category, CategoryColors, Currency } from './types';

export const CATEGORIES: Category[] = [
  'Food & Dining',
  'Shopping',
  'Transport',
  'Bills & Utilities',
  'Entertainment',
  'Health',
  'Travel',
  'Education',
  'Others'
];

export const DEFAULT_CATEGORY_COLORS: CategoryColors = {
  'Food & Dining': '#F87171',
  'Shopping': '#60A5FA',
  'Transport': '#34D399',
  'Bills & Utilities': '#FBBF24',
  'Entertainment': '#A78BFA',
  'Health': '#F472B6',
  'Travel': '#2DD4BF',
  'Education': '#FB923C',
  'Others': '#94A3B8'
};

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'PLN', symbol: 'zł', label: 'Polish Złoty' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' }
];
