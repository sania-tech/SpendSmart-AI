
export type Category = 
  | 'Food & Dining' 
  | 'Shopping' 
  | 'Transport' 
  | 'Bills & Utilities' 
  | 'Entertainment' 
  | 'Health' 
  | 'Travel' 
  | 'Education' 
  | 'Others';

export type CategoryColors = Record<Category, string>;

export interface Currency {
  code: string;
  symbol: string;
  label: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: Category;
  date: string;
  isAiGenerated: boolean;
  userCorrected?: boolean;
  feedbackStatus?: 'positive' | 'negative';
}

export interface TrainingExample {
  description: string;
  correctCategory: Category;
}

export interface AiInsight {
  summary: string;
  suggestions: string[];
  prediction: string;
}
