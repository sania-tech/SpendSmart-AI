
import { GoogleGenAI, Type } from "@google/genai";
import { Category, Expense, TrainingExample, AiInsight } from "../types";
import { CATEGORIES } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Predicts the category for an expense based on its description.
 * Uses enhanced few-shot learning and detailed category context.
 */
export const predictCategory = async (
  description: string, 
  trainingData: TrainingExample[]
): Promise<Category> => {
  const model = "gemini-3-flash-preview";
  
  const categoryDefinitions = `
    - Food & Dining: Restaurants, cafes, groceries, fast food, bars.
    - Shopping: Clothes, electronics, home goods, Amazon, malls.
    - Transport: Gas, public transit, Uber/Lyft, parking, car maintenance.
    - Bills & Utilities: Rent, electricity, water, internet, phone, insurance, subscriptions like Netflix.
    - Entertainment: Movies, concerts, gaming, hobbies, zoo, theater.
    - Health: Doctor visits, pharmacy, gym, therapy, supplements.
    - Travel: Flights, hotels, Airbnb, car rentals, vacation tours.
    - Education: Tuition, books, online courses, school supplies.
    - Others: Cash withdrawals, gifts, donations, or anything else that doesn't fit.
  `.trim();

  const standardExamples = `
    Examples:
    "Starbucks" -> Food & Dining
    "Shell Gas Station" -> Transport
    "H&M" -> Shopping
    "Rent Payment" -> Bills & Utilities
    "CVS Pharmacy" -> Health
  `.trim();

  const userFeedbackContext = trainingData.length > 0 
    ? `\nCRITICAL: The user has specifically corrected your previous mistakes. PRIORITIZE these patterns:\n${trainingData.map(ex => `- "${ex.description}" MUST be categorized as "${ex.correctCategory}"`).join('\n')}`
    : "";

  const prompt = `
    You are a professional financial auditor and data scientist specializing in expense classification.
    
    AVAILABLE CATEGORIES & RULES:
    ${categoryDefinitions}

    ${standardExamples}
    ${userFeedbackContext}

    TASK:
    Classify the following merchant/description: "${description}"

    OUTPUT INSTRUCTIONS:
    - Respond with EXACTLY one of the category names listed above.
    - Do not provide explanations or extra text.
    - If unsure, choose the closest match based on the rules.
  `.trim();

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature: 0.1, // Low temperature for consistent classification
    }
  });

  const predicted = response.text?.trim() as Category;
  
  // Validate that the returned string is actually one of our categories
  return CATEGORIES.find(c => c.toLowerCase() === predicted.toLowerCase()) || 'Others';
};

/**
 * Generates deep insights from the user's spending habits.
 */
export const generateInsights = async (expenses: Expense[]): Promise<AiInsight> => {
  const model = "gemini-3-flash-preview";
  
  const expenseSummary = expenses.map(e => `${e.date}: ${e.description} - $${e.amount} (${e.category})`).join('\n');

  const response = await ai.models.generateContent({
    model,
    contents: `Analyze these expenses and provide financial advice:
    ${expenseSummary}
    
    Provide output in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "A brief executive summary of spending." },
          suggestions: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "3-4 actionable financial suggestions."
          },
          prediction: { type: Type.STRING, description: "A forecast for next month's spending based on trends." }
        },
        required: ["summary", "suggestions", "prediction"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}") as AiInsight;
  } catch (e) {
    return {
      summary: "Could not generate automated summary at this time.",
      suggestions: ["Check your high-cost categories.", "Maintain a consistent budget."],
      prediction: "Ensure more historical data for accurate forecasting."
    };
  }
};
