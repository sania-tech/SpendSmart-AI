import axios from "axios";
import { Category, Expense, TrainingExample, AiInsight } from "../types";
import { CATEGORIES } from "../constants";

console.log("🔑 OpenRouter API Key loaded:", import.meta.env.VITE_OPENROUTER_API_KEY ? "✅ Found" : "❌ Not found");

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Predicts the category for an expense based on its description.
 * Uses few-shot learning with user training data.
 */
export const predictCategory = async (
  description: string, 
  trainingData: TrainingExample[]
): Promise<Category> => {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured");
  }

  const categoryDefinitions = `
    - Food & Dining: Restaurants, cafes, groceries, fast food, bars, coffee shops, delivery apps.
    - Shopping: Clothes, electronics, home goods, Amazon, malls, retail stores.
    - Transport: Gas, public transit, Uber/Lyft, parking, car maintenance, tolls.
    - Bills & Utilities: Rent, electricity, water, internet (ISP only), phone bills, insurance premiums, property tax.
    - Entertainment: Movies, concerts, gaming, hobbies, zoo, theater, streaming services (Netflix, Disney+, Spotify, gaming subscriptions).
    - Health: Doctor visits, pharmacy, gym membership, therapy, supplements, medical equipment.
    - Travel: Flights, hotels, Airbnb, car rentals, vacation tours, luggage.
    - Education: Tuition, books, online courses, school supplies, training programs.
    - Others: Cash withdrawals, gifts, donations, tips, or anything else that doesn't fit.
  `.trim();

  const standardExamples = `
    Examples:
    "Starbucks" -> Food & Dining
    "Shell Gas Station" -> Transport
    "H&M" -> Shopping
    "Netflix" -> Entertainment
    "Spotify" -> Entertainment
    "Disney+" -> Entertainment
  `.trim();

  const userFeedbackContext = trainingData.length > 0 
    ? `\n\nUser corrections (PRIORITIZE these):\n${trainingData.map(ex => `- "${ex.description}" = ${ex.correctCategory}`).join('\n')}`
    : "";

  const systemPrompt = `You are an expert financial categorization AI. Analyze merchant names and descriptions to categorize expenses accurately.

CATEGORIES:
${categoryDefinitions}

${standardExamples}
${userFeedbackContext}

IMPORTANT: 
- Return ONLY the category name, nothing else
- Match the exact category names provided above
- No explanations, no extra text`;

  const userPrompt = `Categorize this expense: "${description}"`;

  try {
    console.log("📤 Sending prediction request to OpenRouter...");
    
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: "openrouter/auto",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 50
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "SpendSmart AI"
        }
      }
    );

    const predicted = response.data.choices[0].message.content.trim() as Category;
    console.log("📥 Prediction response:", predicted);
    
    if (!predicted) {
      console.warn("⚠️ Empty response, defaulting to Others");
      return 'Others';
    }
    
    // Validate category
    const foundCategory = CATEGORIES.find(c => c.toLowerCase() === predicted.toLowerCase());
    
    if (!foundCategory) {
      console.warn(`⚠️ Invalid category "${predicted}", defaulting to Others`);
      return 'Others';
    }
    
    console.log("✅ Prediction successful:", foundCategory);
    return foundCategory;
  } catch (error: any) {
    console.error("❌ Prediction error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Generates AI insights from spending habits.
 */
export const generateInsights = async (expenses: Expense[], currencyObj?: any): Promise<AiInsight> => {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key not configured");
  }

  if (expenses.length === 0) {
    throw new Error("No expenses to analyze");
  }

  const symbol = currencyObj?.symbol || "$";
  
  // Calculate detailed spending statistics
  const categoryBreakdown: { [key: string]: { count: number; total: number } } = {};
  let totalSpent = 0;

  expenses.forEach(e => {
    totalSpent += e.amount;
    if (!categoryBreakdown[e.category]) {
      categoryBreakdown[e.category] = { count: 0, total: 0 };
    }
    categoryBreakdown[e.category].count += 1;
    categoryBreakdown[e.category].total += e.amount;
  });

  // Find top spending categories
  const topCategories = Object.entries(categoryBreakdown)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 3)
    .map(([cat, data]) => `${cat}: ${symbol}${data.total.toFixed(2)} (${data.count} transactions)`)
    .join(', ');

  const avgExpense = (totalSpent / expenses.length).toFixed(2);
  const highestExpense = Math.max(...expenses.map(e => e.amount)).toFixed(2);
  
  const expenseSummary = expenses
    .map(e => `${e.date}: ${e.description} - $${e.amount} (${e.category})`)
    .join('\n');

  const systemPrompt = `You are a friendly financial advisor explaining money habits in simple terms. Use easy-to-understand language. A 10-year-old should understand your advice. Use "you" when talking to the user.

Respond ONLY with valid JSON in this exact format:
{
  "summary": "Simple 1-2 sentence summary of where YOU spend most money",
  "suggestions": ["Simple suggestion 1", "Simple suggestion 2", "Simple suggestion 3", "Simple suggestion 4"],
  "prediction": "Detailed 3-4 sentence prediction of how much YOU can save and what YOU can do with it"
}`;

  const userPrompt = `Analyze this spending in SIMPLE terms. Use "you" when talking about the user.

Total Spent: ${symbol}${totalSpent.toFixed(2)}
Number of Purchases: ${expenses.length}
Average per Purchase: ${symbol}${avgExpense}
Highest Single Purchase: ${symbol}${highestExpense}
Top Spending Categories: ${topCategories}

Expense Breakdown:
${expenseSummary}

In SIMPLE, EASY language provide:
1. ONE sentence saying where YOU spend the most money
2. FOUR simple, specific suggestions like:
   - "Cut back on [category] by [amount], save [this much]"
   - "Stop [specific bad habit], save [this much]"
   - "Do [simple action] to save [this much]"
   - "Try [budget method] to save [this much]"
3. DETAILED 3-4 sentence prediction saying:
   - How much YOU can save per month and per year if YOU follow suggestions
   - What YOU can do with this money (emergency fund, vacation, investments, etc)
   - How this will improve YOUR financial situation

Make it SUPER simple and use "you/your" to speak directly to the user.`;

  try {
    console.log("📤 Sending detailed insights request to OpenRouter...");
    console.log("📊 Analysis scope - Total: $" + totalSpent.toFixed(2) + ", Transactions: " + expenses.length);
    
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.4,
        max_tokens: 800
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "SpendSmart AI"
        }
      }
    );

    let responseText = response.data.choices[0].message.content.trim();
    console.log("📥 Full response:", responseText);
    
    // Remove markdown code blocks if present
    responseText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^```/g, '')
      .replace(/```$/g, '')
      .trim();
    
    console.log("📄 Cleaned response:", responseText);
    
    // Try to parse JSON directly
    try {
      const insights = JSON.parse(responseText) as AiInsight;
      console.log("✅ Detailed insights generated successfully");
      return insights;
    } catch (parseError) {
      console.warn("⚠️ Failed to parse full response, extracting JSON...");
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.warn("⚠️ No JSON found, using detailed fallback");
        
        // Create detailed fallback based on actual data
        const topCat = Object.entries(categoryBreakdown)
          .sort((a, b) => b[1].total - a[1].total)[0];
        const topCatName = topCat ? topCat[0] : "Unknown";
        const topCatAmount = topCat ? topCat[1].total.toFixed(2) : "0";
        const savingsPotential = topCat ? (topCat[1].total * 0.2).toFixed(2) : "0";
        const monthlySavings = (totalSpent * 0.25).toFixed(2);
        const yearlySavings = (totalSpent * 3).toFixed(2);
        
        return {
          summary: `You spend most of your money on ${topCatName} (${symbol}${topCatAmount}). You could save money by cutting back here.`,
          suggestions: [
            `Cut ${topCatName} spending by 20% → Save ${symbol}${savingsPotential} per month`,
            `Stop buying unnecessary stuff → Save ${symbol}${(totalSpent * 0.1).toFixed(2)} per month`,
            `Track your spending daily → Control spending and save ${symbol}${(totalSpent * 0.15).toFixed(2)} per month`,
            `Use 50/30/20 rule (50% needs, 30% wants, 20% save) → Save ${symbol}${(totalSpent * 0.2).toFixed(2)} per month`
          ],
          prediction: `If you follow these tips, you could save ${symbol}${monthlySavings} per month. That's ${symbol}${yearlySavings} per year! With this money, you can build an emergency fund, take a vacation, or invest for your future. By being smart about spending, you'll have less financial stress and more money for the things that really matter to you.`
        };
      }
      
      const jsonStr = jsonMatch[0];
      console.log("📄 Extracted JSON:", jsonStr);
      const insights = JSON.parse(jsonStr) as AiInsight;
      return insights;
    }
  } catch (error: any) {
    console.error("❌ Insights error:", error.response?.data || error.message);
    
    // Create comprehensive detailed fallback
    const topCat = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1].total - a[1].total)[0];
    const topCatName = topCat ? topCat[0] : "Unknown";
    const topCatAmount = topCat ? topCat[1].total.toFixed(2) : "0";
    const savingsPotential = topCat ? (topCat[1].total * 0.2).toFixed(2) : "0";
    const monthlySavings = (totalSpent * 0.25).toFixed(2);
    const yearlySavings = (totalSpent * 3).toFixed(2);
    
    return {
      summary: `You spent ${symbol}${totalSpent.toFixed(2)} on ${expenses.length} purchases. Most of it (${symbol}${topCatAmount}) went to ${topCatName}.`,
      suggestions: [
        `Cut ${topCatName} spending by 20% → Save ${symbol}${savingsPotential} per month`,
        `Stop buying unnecessary stuff → Save ${symbol}${(totalSpent * 0.1).toFixed(2)} per month`,
        `Track your spending daily → Control spending and save ${symbol}${(totalSpent * 0.15).toFixed(2)} per month`,
        `Use 50/30/20 rule (50% needs, 30% wants, 20% save) → Save ${symbol}${(totalSpent * 0.2).toFixed(2)} per month`
      ],
      prediction: `If you follow these tips, you could save ${symbol}${monthlySavings} per month. That's ${symbol}${yearlySavings} per year! You can use this money to build an emergency fund for unexpected situations, take that vacation you've been dreaming about, or start investing for your future. When you control your spending smartly, you'll feel more confident about your money and have the freedom to spend on what truly matters to you.`
    };
  }
};
