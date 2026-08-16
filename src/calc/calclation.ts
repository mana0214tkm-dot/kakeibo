import type {
  BudgetItem,
  BudgetWarningItem,
  CategorySummaryItem,
  DeficitLevel,
  ExpenseCategory,
  ExpenseItem,
  FinanceState,
  MonthlyTrendItem,
  NecessityLevel,
  PeriodUnit,
  SavingsForecast,
  SavingsForecastPoint,
  SavingKind,
  SocialBenefitType,
  SocialJudge,
  Summary,
} from "@/types/finance"

export const STORAGE_KEY = "finance-dashboard-complete-state"

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  food: "食費",
  housing: "住居",
  utilities: "水道・光熱費",
  transport: "交通",
  medical: "医療",
  communication: "通信",
  entertainment: "娯楽",
  social: "交際費",
  education: "教育",
  insurance: "保険",
  subscription: "サブスク",
  other: "その他",
}

const yenFormatter = new Intl.NumberFormat("ja-JP")

export const DEFAULT_BUDGETS: BudgetItem[] = [
  { id: "b-food", category: "food", monthlyLimit: 30000 },
  { id: "b-housing", category: "housing", monthlyLimit: 70000 },
  { id: "b-utilities", category: "utilities", monthlyLimit: 15000 },
  { id: "b-transport", category: "transport", monthlyLimit: 12000 },
  { id: "b-medical", category: "medical", monthlyLimit: 8000 },
  { id: "b-communication", category: "communication", monthlyLimit: 10000 },
  { id: "b-entertainment", category: "entertainment", monthlyLimit: 15000 },
  { id: "b-social", category: "social", monthlyLimit: 20000 },
  { id: "b-education", category: "education", monthlyLimit: 10000 },
  { id: "b-insurance", category: "insurance", monthlyLimit: 15000 },
  { id: "b-subscription", category: "subscription", monthlyLimit: 8000 },
  { id: "b-other", category: "other", monthlyLimit: 10000 },
]

export const DEFAULT_STATE: FinanceState = {
  incomes: [],
  expenses: [],
  savings: [],
  budgets: DEFAULT_BUDGETS,
  monthlyMinimumLivingCost: 120000,
  emergencyFundTargetMonths: 6,
  monthlyPlannedSaving: 30000,
  hourlyWage: 1500,
  ordinaryAnnualRate: 0.2,
  fixedAnnualRate: 0.45,
  stockAnnualRate: 5,
  forecastMonths: 12,
}

function cloneDefaultBudgets(): BudgetItem[] {
  return DEFAULT_BUDGETS.map((item) => ({ ...item }))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function toStringOrFallback(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function toFiniteNumber(value: unknown, fallback = 0) {
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : fallback
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string") return today()

  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    return today()
  }

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, "0")
  const day = String(parsed.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const expenseCategories = new Set<ExpenseCategory>(
  Object.keys(expenseCategoryLabels) as ExpenseCategory[]
)

const savingKinds = new Set([
  "ordinary",
  "fixed",
  "investmentProfit",
  "reserved",
] satisfies SavingKind[])

const necessityLevels = new Set([
  "essential",
  "better",
  "waste",
] satisfies NecessityLevel[])

const socialBenefitTypes = new Set([
  "networking",
  "familyCare",
  "mentalCare",
  "celebration",
  "none",
  "unknown",
] satisfies SocialBenefitType[])

function normalizeIncomeItems(items: unknown): FinanceState["incomes"] {
  if (!Array.isArray(items)) return []

  return items
    .filter(isRecord)
    .map((item) => ({
      id: toStringOrFallback(item.id, createId()),
      date: normalizeDate(item.date),
      amount: Math.max(0, toFiniteNumber(item.amount)),
      memo: toStringOrFallback(item.memo),
    }))
}

function normalizeExpenseItems(items: unknown): FinanceState["expenses"] {
  if (!Array.isArray(items)) return []

  return items
    .filter(isRecord)
    .map((item) => {
      const category = expenseCategories.has(item.category as ExpenseCategory)
        ? (item.category as ExpenseCategory)
        : "other"
      const necessity = necessityLevels.has(item.necessity as NecessityLevel)
        ? (item.necessity as NecessityLevel)
        : "essential"
      const socialBenefitType = socialBenefitTypes.has(
        item.socialBenefitType as SocialBenefitType
      )
        ? (item.socialBenefitType as SocialBenefitType)
        : undefined
      const socialSatisfaction = clampNumber(
        Math.round(toFiniteNumber(item.socialSatisfaction, 3)),
        1,
        5
      )

      return {
        id: toStringOrFallback(item.id, createId()),
        date: normalizeDate(item.date),
        amount: Math.max(0, toFiniteNumber(item.amount)),
        category,
        memo: toStringOrFallback(item.memo),
        isFixed: Boolean(item.isFixed),
        necessity,
        workRelated: Boolean(item.workRelated ?? item.isWorkRelated),
        isWorkRelated: Boolean(item.isWorkRelated ?? item.workRelated),
        socialBenefitType,
        socialSatisfaction:
          socialBenefitType !== undefined ? socialSatisfaction : undefined,
      }
    })
}

function normalizeSavingItems(items: unknown): FinanceState["savings"] {
  if (!Array.isArray(items)) return []

  return items
    .filter(isRecord)
    .map((item) => ({
      id: toStringOrFallback(item.id, createId()),
      date: normalizeDate(item.date),
      amount: Math.max(0, toFiniteNumber(item.amount)),
      kind: savingKinds.has(item.kind as SavingKind)
        ? (item.kind as SavingKind)
        : "ordinary",
      memo: toStringOrFallback(item.memo),
    }))
}

function normalizeBudgetItems(budgets: BudgetItem[] | undefined): BudgetItem[] {
  if (!Array.isArray(budgets) || budgets.length === 0) {
    return cloneDefaultBudgets()
  }

  return DEFAULT_BUDGETS.map((defaultItem) => {
    const found = budgets.find((item) => item.category === defaultItem.category)
    return {
      ...defaultItem,
      monthlyLimit: Number(found?.monthlyLimit ?? defaultItem.monthlyLimit) || 0,
    }
  })
}

export function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadState(): FinanceState {
  if (typeof window === "undefined") {
    return {
      ...DEFAULT_STATE,
      budgets: cloneDefaultBudgets(),
    }
  }

  const parsed = safeParse<Partial<FinanceState>>(
    localStorage.getItem(STORAGE_KEY),
    DEFAULT_STATE
  )

  return {
    ...DEFAULT_STATE,
    ...parsed,
    incomes: normalizeIncomeItems(parsed.incomes),
    expenses: normalizeExpenseItems(parsed.expenses),
    savings: normalizeSavingItems(parsed.savings),
    budgets: normalizeBudgetItems(parsed.budgets),
    monthlyMinimumLivingCost:
      Number(parsed.monthlyMinimumLivingCost ?? DEFAULT_STATE.monthlyMinimumLivingCost) || 0,
    emergencyFundTargetMonths:
      Number(parsed.emergencyFundTargetMonths ?? DEFAULT_STATE.emergencyFundTargetMonths) || 0,
    monthlyPlannedSaving:
      Number(parsed.monthlyPlannedSaving ?? DEFAULT_STATE.monthlyPlannedSaving) || 0,
    hourlyWage: Number(parsed.hourlyWage ?? DEFAULT_STATE.hourlyWage) || 0,
    ordinaryAnnualRate:
      Number(parsed.ordinaryAnnualRate ?? DEFAULT_STATE.ordinaryAnnualRate) || 0,
    fixedAnnualRate:
      Number(parsed.fixedAnnualRate ?? DEFAULT_STATE.fixedAnnualRate) || 0,
    stockAnnualRate:
      Number(parsed.stockAnnualRate ?? DEFAULT_STATE.stockAnnualRate) || 0,
    forecastMonths: clampNumber(
      Math.round(
        Number(parsed.forecastMonths ?? DEFAULT_STATE.forecastMonths) ||
          DEFAULT_STATE.forecastMonths
      ),
      1,
      36
    ),
  }
}

export function saveState(state: FinanceState) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function createId() {
  return Math.random().toString(36).slice(2, 11)
}

export function round2(value: number) {
  return Math.round(value * 100) / 100
}

export function sum(values: number[]) {
  return values.reduce((acc, cur) => acc + cur, 0)
}

export function clamp01(value: number) {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

export function percentText(value: number) {
  return `${Math.round(value * 100)}%`
}

export function yen(value: number) {
  return `${yenFormatter.format(Math.round(value))}円`
}

export function today() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function monthKeyFromDate(date: string) {
  return normalizeDate(date).slice(0, 7)
}

export function getDaysInMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number)
  if (!year || !month) return 30
  return new Date(year, month, 0).getDate()
}

export function filterByPeriod<T extends { date: string }>(
  items: T[],
  unit: PeriodUnit,
  periodKey: string
) {
  if (unit === "daily") {
    return items.filter((item) => item.date === periodKey)
  }

  return items.filter((item) => item.date.slice(0, 7) === periodKey)
}

export function calculateDeficitRate(totalIncome: number, totalExpense: number) {
  if (totalIncome <= 0) return totalExpense > 0 ? 1 : 0
  return round2((totalExpense - totalIncome) / totalIncome)
}

export function getDeficitLevel(deficitRate: number): DeficitLevel {
  if (deficitRate >= 0.2) return "danger"
  if (deficitRate >= 0.1) return "warning"
  if (deficitRate >= 0.05) return "caution"
  return "safe"
}

export function getDeficitLabel(level: DeficitLevel) {
  switch (level) {
    case "safe":
      return "安全"
    case "caution":
      return "注意"
    case "warning":
      return "警戒"
    case "danger":
      return "危険"
  }
}

export function calculateSavingsRate(totalIncome: number, totalExpense: number) {
  if (totalIncome <= 0) return 0
  return round2((totalIncome - totalExpense) / totalIncome)
}

export function calculateFixedCostRate(
  fixedCostTotal: number,
  totalIncome: number
) {
  if (totalIncome <= 0) return 0
  return round2(fixedCostTotal / totalIncome)
}

export function calculateWasteRate(
  wasteExpenseTotal: number,
  totalExpense: number
) {
  if (totalExpense <= 0) return 0
  return round2(wasteExpenseTotal / totalExpense)
}

export function calculateSavingEfficiencyRate(
  totalExpense: number,
  totalBudget: number
) {
  if (totalBudget <= 0) return 0
  return round2(clamp01((totalBudget - totalExpense) / totalBudget))
}

export function calculateSavingGoalAchievement(
  totalExpense: number,
  totalBudget: number
) {
  if (totalBudget <= 0) return 0
  if (totalExpense <= 0) return 1
  return round2(clamp01(totalBudget / totalExpense))
}

export function calculateEmergencyFundProgress(params: {
  totalAllSavings: number
  monthlyMinimumLivingCost: number
  emergencyFundTargetMonths: number
}) {
  const target =
    params.monthlyMinimumLivingCost * params.emergencyFundTargetMonths
  if (target <= 0) return 0
  return round2(clamp01(params.totalAllSavings / target))
}

export function calculatePlannedSavingProgress(params: {
  unit: PeriodUnit
  totalReservedSaving: number
  monthlyPlannedSaving: number
  daysInMonth?: number
}) {
  if (params.monthlyPlannedSaving <= 0) return 0

  if (params.unit === "monthly") {
    return round2(
      clamp01(params.totalReservedSaving / params.monthlyPlannedSaving)
    )
  }

  const days = params.daysInMonth ?? 30
  const dailyTarget = params.monthlyPlannedSaving / days
  if (dailyTarget <= 0) return 0

  return round2(clamp01(params.totalReservedSaving / dailyTarget))
}

export function calculateWasteWorkHours(
  wasteExpenseTotal: number,
  hourlyWage: number
) {
  if (hourlyWage <= 0) return 0
  return round2(wasteExpenseTotal / hourlyWage)
}

export function judgeSocialExpense(expense: ExpenseItem): SocialJudge {
  if (expense.category !== "social") return "neutral"
  if (expense.workRelated ?? expense.isWorkRelated) return "practical"

  if (
    expense.socialBenefitType === "networking" ||
    expense.socialBenefitType === "familyCare" ||
    expense.socialBenefitType === "celebration"
  ) {
    return "practical"
  }

  if (
    expense.socialBenefitType === "none" &&
    (expense.socialSatisfaction ?? 0) <= 2
  ) {
    return "waste"
  }

  if (
    expense.socialBenefitType === "mentalCare" &&
    (expense.socialSatisfaction ?? 0) >= 3
  ) {
    return "practical"
  }

  return "neutral"
}

export function getBudgetLimit(
  budgets: BudgetItem[],
  category: ExpenseCategory
): number {
  return budgets.find((item) => item.category === category)?.monthlyLimit ?? 0
}

export function buildCategorySummary(
  expenses: ExpenseItem[],
  budgets: BudgetItem[]
): CategorySummaryItem[] {
  const totalExpense = sum(expenses.map((item) => item.amount))

  return Object.keys(expenseCategoryLabels).map((categoryKey) => {
    const category = categoryKey as ExpenseCategory
    const categoryItems = expenses.filter((item) => item.category === category)
    const amount = sum(categoryItems.map((item) => item.amount))
    const budgetLimit = getBudgetLimit(budgets, category)
    const budgetDiff = budgetLimit - amount
    const percentage = totalExpense > 0 ? round2(amount / totalExpense) : 0

    return {
      category,
      amount,
      percentage,
      count: categoryItems.length,
      budgetLimit,
      budgetDiff,
      isOverBudget: budgetLimit > 0 ? amount > budgetLimit : false,
    }
  })
}

export function buildBudgetWarnings(
  expenses: ExpenseItem[],
  budgets: BudgetItem[]
): BudgetWarningItem[] {
  return budgets
    .map((budget) => {
      const used = sum(
        expenses
          .filter((item) => item.category === budget.category)
          .map((item) => item.amount)
      )

      return {
        category: budget.category,
        used,
        limit: budget.monthlyLimit,
        overAmount: Math.max(used - budget.monthlyLimit, 0),
      }
    })
    .filter((item) => item.limit > 0 && item.used > item.limit)
    .sort((a, b) => b.overAmount - a.overAmount)
}

export function buildMonthlyTrend(state: FinanceState): MonthlyTrendItem[] {
  const monthSet = new Set<string>()

  state.incomes.forEach((item) => monthSet.add(item.date.slice(0, 7)))
  state.expenses.forEach((item) => monthSet.add(item.date.slice(0, 7)))
  state.savings.forEach((item) => monthSet.add(item.date.slice(0, 7)))

  const months = Array.from(monthSet).sort()

  const trend = months.map((month) => {
    const income = sum(
      state.incomes
        .filter((item) => item.date.slice(0, 7) === month)
        .map((item) => item.amount)
    )
    const expense = sum(
      state.expenses
        .filter((item) => item.date.slice(0, 7) === month)
        .map((item) => item.amount)
    )
    const saving = sum(
      state.savings
        .filter((item) => item.date.slice(0, 7) === month)
        .map((item) => item.amount)
    )

    return {
      month,
      income,
      expense,
      saving,
      balance: income - expense,
    }
  })

  return trend.slice(-12)
}

function shiftMonthKey(monthKey: string, offset: number) {
  const [year, month] = monthKey.split("-").map(Number)

  if (!year || !month) {
    return monthKeyFromDate(today())
  }

  const shifted = new Date(year, month - 1 + offset, 1)
  const shiftedYear = shifted.getFullYear()
  const shiftedMonth = String(shifted.getMonth() + 1).padStart(2, "0")
  return `${shiftedYear}-${shiftedMonth}`
}

function getFallbackContributionMix(monthlyPlannedSaving: number) {
  if (monthlyPlannedSaving <= 0) {
    return {
      cash: 0,
      fixed: 0,
      investment: 0,
    }
  }

  return {
    cash: round2(monthlyPlannedSaving * 0.35),
    fixed: round2(monthlyPlannedSaving * 0.35),
    investment: round2(monthlyPlannedSaving * 0.3),
  }
}

export function buildSavingsForecast(state: FinanceState): SavingsForecast {
  const currentMonth = monthKeyFromDate(today())
  const recentMonths = [
    shiftMonthKey(currentMonth, -2),
    shiftMonthKey(currentMonth, -1),
    currentMonth,
  ]

  const currentBalance = state.savings.reduce(
    (acc, item) => {
      if (item.kind === "fixed") {
        acc.fixed += item.amount
      } else if (item.kind === "investmentProfit") {
        acc.investment += item.amount
      } else {
        acc.cash += item.amount
      }

      return acc
    },
    { cash: 0, fixed: 0, investment: 0 }
  )

  const recentContribution = state.savings.reduce(
    (acc, item) => {
      if (!recentMonths.includes(monthKeyFromDate(item.date))) {
        return acc
      }

      if (item.kind === "fixed") {
        acc.fixed += item.amount
      } else if (item.kind === "investmentProfit") {
        acc.investment += item.amount
      } else {
        acc.cash += item.amount
      }

      return acc
    },
    { cash: 0, fixed: 0, investment: 0 }
  )

  const historicalMonthlyContribution = {
    cash: round2(recentContribution.cash / recentMonths.length),
    fixed: round2(recentContribution.fixed / recentMonths.length),
    investment: round2(recentContribution.investment / recentMonths.length),
  }

  const historicalTotal =
    historicalMonthlyContribution.cash +
    historicalMonthlyContribution.fixed +
    historicalMonthlyContribution.investment

  const remainingPlannedSaving = Math.max(
    state.monthlyPlannedSaving - historicalTotal,
    0
  )
  const fallbackContribution = getFallbackContributionMix(remainingPlannedSaving)

  const monthlyContribution = {
    cash: round2(historicalMonthlyContribution.cash + fallbackContribution.cash),
    fixed: round2(
      historicalMonthlyContribution.fixed + fallbackContribution.fixed
    ),
    investment: round2(
      historicalMonthlyContribution.investment + fallbackContribution.investment
    ),
  }

  const monthlyRates = {
    cash: Math.max(state.ordinaryAnnualRate, -100) / 100 / 12,
    fixed: Math.max(state.fixedAnnualRate, -100) / 100 / 12,
    investment: Math.max(state.stockAnnualRate, -100) / 100 / 12,
  }

  const points: SavingsForecastPoint[] = []
  let runningBalance = {
    cash: currentBalance.cash,
    fixed: currentBalance.fixed,
    investment: currentBalance.investment,
  }

  const pushPoint = (month: string) => {
    points.push({
      month,
      cash: round2(runningBalance.cash),
      fixed: round2(runningBalance.fixed),
      investment: round2(runningBalance.investment),
      total: round2(
        runningBalance.cash + runningBalance.fixed + runningBalance.investment
      ),
    })
  }

  pushPoint(currentMonth)

  for (let index = 1; index <= state.forecastMonths; index += 1) {
    runningBalance = {
      cash:
        runningBalance.cash * (1 + monthlyRates.cash) + monthlyContribution.cash,
      fixed:
        runningBalance.fixed * (1 + monthlyRates.fixed) +
        monthlyContribution.fixed,
      investment:
        runningBalance.investment * (1 + monthlyRates.investment) +
        monthlyContribution.investment,
    }

    pushPoint(shiftMonthKey(currentMonth, index))
  }

  return {
    points,
    monthlyContribution: {
      ...monthlyContribution,
      total: round2(
        monthlyContribution.cash +
          monthlyContribution.fixed +
          monthlyContribution.investment
      ),
    },
  }
}

export function buildSummary(
  state: FinanceState,
  unit: PeriodUnit,
  periodKey: string
): Summary {
  const incomes = filterByPeriod(state.incomes, unit, periodKey)
  const expenses = filterByPeriod(state.expenses, unit, periodKey)
  const savings = filterByPeriod(state.savings, unit, periodKey)

  const totalIncome = sum(incomes.map((item) => item.amount))
  const totalExpense = sum(expenses.map((item) => item.amount))
  const totalSaving = sum(savings.map((item) => item.amount))
  const balance = totalIncome - totalExpense

  const fixedCostTotal = sum(
    expenses.filter((item) => item.isFixed).map((item) => item.amount)
  )

  const wasteExpenseTotal = sum(
    expenses.filter((item) => item.necessity === "waste").map((item) => item.amount)
  )

  const socialExpenses = expenses.filter((item) => item.category === "social")
  const socialExpenseTotal = sum(socialExpenses.map((item) => item.amount))
  const practicalSocialExpense = sum(
    socialExpenses
      .filter((item) => judgeSocialExpense(item) === "practical")
      .map((item) => item.amount)
  )
  const wasteSocialExpense = sum(
    socialExpenses
      .filter((item) => judgeSocialExpense(item) === "waste")
      .map((item) => item.amount)
  )

  const monthlyBudgetTotal = sum(state.budgets.map((item) => item.monthlyLimit))
  const totalBudget =
    unit === "monthly"
      ? monthlyBudgetTotal
      : monthlyBudgetTotal / getDaysInMonth(periodKey.slice(0, 7))

  const deficitRate = calculateDeficitRate(totalIncome, totalExpense)
  const deficitLevel = getDeficitLevel(deficitRate)
  const savingsRate = calculateSavingsRate(totalIncome, totalExpense)
  const fixedCostRate = calculateFixedCostRate(fixedCostTotal, totalIncome)
  const wasteRate = calculateWasteRate(wasteExpenseTotal, totalExpense)
  const savingEfficiencyRate = calculateSavingEfficiencyRate(
    totalExpense,
    totalBudget
  )
  const savingGoalAchievement = calculateSavingGoalAchievement(
    totalExpense,
    totalBudget
  )

  const totalAllSavings = sum(state.savings.map((item) => item.amount))

  const emergencyFundProgress = calculateEmergencyFundProgress({
    totalAllSavings,
    monthlyMinimumLivingCost: state.monthlyMinimumLivingCost,
    emergencyFundTargetMonths: state.emergencyFundTargetMonths,
  })

  const reservedSavingInPeriod = sum(
    savings.filter((item) => item.kind === "reserved").map((item) => item.amount)
  )

  const plannedSavingProgress = calculatePlannedSavingProgress({
    unit,
    totalReservedSaving: reservedSavingInPeriod,
    monthlyPlannedSaving: state.monthlyPlannedSaving,
    daysInMonth:
      unit === "daily" ? getDaysInMonth(periodKey.slice(0, 7)) : undefined,
  })

  const wasteWorkHours = calculateWasteWorkHours(
    wasteExpenseTotal,
    state.hourlyWage
  )

  const investmentUnlocked =
    emergencyFundProgress >= 0.5 && plannedSavingProgress >= 0.8

  return {
    unit,
    periodKey,
    totalIncome,
    totalExpense,
    totalSaving,
    balance,
    deficitRate,
    deficitLevel,
    savingsRate,
    fixedCostRate,
    wasteRate,
    savingEfficiencyRate,
    savingGoalAchievement,
    emergencyFundProgress,
    plannedSavingProgress,
    wasteExpenseTotal,
    wasteWorkHours,
    socialExpenseTotal,
    practicalSocialExpense,
    wasteSocialExpense,
    investmentUnlocked,
    categorySummary: buildCategorySummary(expenses, state.budgets),
    budgetWarnings: buildBudgetWarnings(expenses, state.budgets),
    monthlyTrend: buildMonthlyTrend(state),
  }
}
