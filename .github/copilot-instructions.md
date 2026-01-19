# AI Agent Instructions: SpendSmart AI

## Project Overview
SpendSmart AI is a financial expense tracking application that uses Google's Gemini API to intelligently categorize expenses and generate spending insights. Built with React 19, TypeScript, Vite, and Tailwind CSS.

## Architecture & Data Flow

### Core Components
- **App.tsx**: Central state management hub. Manages expenses, training data, UI modals, and localStorage persistence. Single source of truth for all app state.
- **ExpenseForm.tsx**: User input for new expenses with inline AI category prediction via `predictCategory()` on blur
- **Dashboard.tsx**: Renders spending visualizations (pie chart, bar chart) using Recharts
- **SettingsModal.tsx**: Currency selection and category color customization
- **CategorySettings.tsx**: Category color picker UI

### Service Layer
- **geminiService.ts**: Two main exports:
  - `predictCategory(description, trainingData)` - Classifies expenses using Gemini API with few-shot learning. Prioritizes user feedback from training data
  - `generateInsights(expenses)` - Generates JSON-structured financial insights (summary, suggestions, prediction)

### Type System
All types in `types.ts`:
- **Category**: 9 predefined types (Food & Dining, Shopping, Transport, Bills & Utilities, Entertainment, Health, Travel, Education, Others)
- **TrainingExample**: User corrections that teach the AI model (stored in state, capped at 20 most recent)
- **Expense**: Includes feedback flags (`isAiGenerated`, `userCorrected`, `feedbackStatus`)
- **AiInsight**: Structured response from Gemini with summary, suggestions, prediction

### Data Persistence
All state persisted to localStorage with `smarttrack_` prefix:
- `smarttrack_expenses`, `smarttrack_training`, `smarttrack_colors`, `smarttrack_currency`

## Critical Workflows

### Build & Development
```bash
npm install          # Install dependencies (React 19, Gemini SDK, Recharts, Tailwind)
npm run dev         # Start Vite dev server on http://localhost:3000
npm run build       # Production bundle
npm run preview     # Preview built app
```

### API Configuration
- Requires `.env.local` with `VITE_GEMINI_API_KEY`
- Vite config exposes it as `process.env.GEMINI_API_KEY` and `process.env.VITE_GEMINI_API_KEY`
- Model: `gemini-3-flash-preview` (fast inference, streaming support)

## Project-Specific Patterns

### AI Feedback Loop
1. User enters expense description → `ExpenseForm` calls `predictCategory(description, trainingData)` on blur
2. If AI predicts, mark `isAiGenerated: true` in Expense
3. User can give feedback: thumbs up (positive, reinforce pattern) or thumbs down (negative, flag for manual review)
4. Manual category changes via dropdown automatically update `TrainingExample` with user's correction
5. Training data is limited to last 20 corrections to prevent model drift

### Few-Shot Learning Pattern
- `predictCategory()` includes detailed category definitions and standard examples in the prompt
- **Critical**: If training data exists, it's explicitly included in prompt as `CRITICAL` section to prioritize user corrections
- Low temperature (0.1) for consistent classification despite few-shot variations

### Component State Management
- All state in App.tsx, passed as props to children
- Callbacks (`onAdd`, `onUpdateColor`, `onDeleteExpense`) passed to components
- No Context API or Redux; direct parent-child communication
- LocalStorage effects trigger on state changes using dependency arrays

### Styling Approach
- **Tailwind CSS v4**: Configured in `tailwind.config.js`
- **Color System**: Categories mapped to hex colors in `DEFAULT_CATEGORY_COLORS`
- **Design Language**: 
  - Indigo (primary), slate (neutral), with category-specific accent colors
  - Rounded corners (lg/xl/2xl/3xl), subtle shadows, glass-morphism headers
  - Responsive grid layouts (`lg:col-span-2`, `md:grid-cols-2`)
  - Opacity variants for hover/disabled states (`hover:opacity-100`, `disabled:opacity-50`)

### Type Safety with TypeScript
- Strict types for Categories (union type, not strings)
- Currency interface enforces code/symbol/label structure
- Expense interface tracks AI metadata (isAiGenerated, userCorrected, feedbackStatus)
- All component props explicitly typed with `React.FC<Props>`

## Integration Points & Dependencies

### Google Gemini API
- Imported as `GoogleGenAI` and `Type` from `@google/genai`
- Used for two tasks:
  1. **Category prediction**: Text classification with low temperature for consistency
  2. **Insights generation**: Structured JSON output with schema validation
- No streaming or authentication headers needed; API key passed at initialization

### Recharts Visualization
- **PieChart**: Donut chart showing spending by category
- **BarChart**: Category breakdown with interactive tooltips
- Currency symbol dynamically formatted in tooltip

## Common Development Tasks

### Adding a New Category
1. Add to `CATEGORIES` array in `constants.ts` (maintains ordering)
2. Add hex color to `DEFAULT_CATEGORY_COLORS`
3. Update `Category` type union in `types.ts`
4. Update category definitions in `geminiService.ts` `predictCategory()` prompt
5. Test AI prediction with training data examples

### Modifying AI Prompts
- All prompts in `geminiService.ts`
- Category definitions must match `types.ts` and `constants.ts`
- Few-shot examples should mirror real app data
- Training data context is dynamically injected; test with empty/populated training sets

### Debugging Expense Classification
- Check `trainingData` state length (capped at 20)
- Verify training example descriptions are exact matches (case-sensitive in comparison)
- Test `predictCategory()` in isolation with/without training data
- Model: `gemini-3-flash-preview` is stable for this use case

## Conventions & Best Practices
- **Error Handling**: Try-catch in async AI calls; fallback responses in `generateInsights()`
- **Performance**: Use `useMemo` in Dashboard for pie/bar chart data computation
- **Accessibility**: Semantic HTML, descriptive titles on icon buttons, color + text in feedback indicators
- **Testing**: Verify localStorage persistence after state updates; test AI categorization against training data
