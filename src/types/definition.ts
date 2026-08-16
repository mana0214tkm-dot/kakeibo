export type PeriodUnit = "daily" | "monthly"

export type ExpenseCategory =
  | "food"
  | "housing"
  | "utilities"
  | "transport"
  | "medical"
  | "communication"
  | "entertainment"
  | "social"
  | "education"
  | "insurance"
  | "subscription"
  | "other"

export type SavingKind =
  | "ordinary"
  | "fixed"
  | "investmentProfit"
  | "reserved"

export type NecessityLevel = "essential" | "better" | "waste"

export type SocialBenefitType =
  | "networking"
  | "familyCare"
  | "mentalCare"
  | "celebration"
  | "none"
  | "unknown"

export type DeficitLevel = "safe" | "caution" | "warning" | "danger"
export type SocialJudge = "practical" | "neutral" | "waste"

export type IncomeItem = {
  id: string
  date: string
  amount: number
  memo: string
}

export type ExpenseItem = {
  id: string
  date: string
  amount: number
  category: ExpenseCategory
  memo: string
  isFixed: boolean
  necessity: NecessityLevel
  workRelated?: boolean
  socialBenefitType?: SocialBenefitType
  socialSatisfaction?: number
  isWorkRelated?: boolean
}

export type SavingItem = {
  id: string
  date: string
  amount: number
  kind: SavingKind
  memo: string
}

export type BudgetItem = {
  id: string
  category: ExpenseCategory
  monthlyLimit: number
}

export type FinanceState = {
  incomes: IncomeItem[]
  expenses: ExpenseItem[]
  savings: SavingItem[]
  budgets: BudgetItem[]
  monthlyMinimumLivingCost: number
  emergencyFundTargetMonths: number
  monthlyPlannedSaving: number
  hourlyWage: number
  ordinaryAnnualRate: number
  fixedAnnualRate: number
  stockAnnualRate: number
  forecastMonths: number
}

export type CategorySummaryItem = {
  category: ExpenseCategory
  amount: number
  percentage: number
  count: number
  budgetLimit: number
  budgetDiff: number
  isOverBudget: boolean
}

export type BudgetWarningItem = {
  category: ExpenseCategory
  used: number
  limit: number
  overAmount: number
}

export type MonthlyTrendItem = {
  month: string
  income: number
  expense: number
  saving: number
  balance: number
}

export type SavingsForecastPoint = {
  month: string
  cash: number
  fixed: number
  investment: number
  total: number
}

export type SavingsForecast = {
  points: SavingsForecastPoint[]
  monthlyContribution: {
    cash: number
    fixed: number
    investment: number
    total: number
  }
}

export type Summary = {
  unit: PeriodUnit
  periodKey: string
  totalIncome: number
  totalExpense: number
  totalSaving: number
  balance: number
  deficitRate: number
  deficitLevel: DeficitLevel
  savingsRate: number
  fixedCostRate: number
  wasteRate: number
  savingEfficiencyRate: number
  savingGoalAchievement: number
  emergencyFundProgress: number
  plannedSavingProgress: number
  wasteExpenseTotal: number
  wasteWorkHours: number
  socialExpenseTotal: number
  practicalSocialExpense: number
  wasteSocialExpense: number
  investmentUnlocked: boolean
  categorySummary: CategorySummaryItem[]
  budgetWarnings: BudgetWarningItem[]
  monthlyTrend: MonthlyTrendItem[]
}
