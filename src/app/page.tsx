"use client"

import Image from "next/image"
import { startTransition, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { RestaurantSuggestions } from "@/components/RestaurantSuggestions"
import { exportReportPdf, exportReportWord } from "@/lib/export"
import {
  buildSavingsForecast,
  buildSummary,
  createId,
  DEFAULT_STATE,
  expenseCategoryLabels,
  getDeficitLabel,
  loadState,
  monthKeyFromDate,
  percentText,
  saveState,
  STORAGE_KEY,
  today,
  yen,
} from "@/lib/finance"
import type {
  ExpenseCategory,
  ExpenseItem,
  FinanceState,
  IncomeItem,
  NecessityLevel,
  PeriodUnit,
  SavingItem,
  SavingsForecastPoint,
  SavingKind,
  SocialBenefitType,
} from "@/types/finance"

type ExpenseRecord = ExpenseItem & {
  workRelated?: boolean
  isWorkRelated?: boolean
}

const expenseCategoryOptions: { value: ExpenseCategory; label: string }[] = [
  { value: "food", label: expenseCategoryLabels.food },
  { value: "housing", label: expenseCategoryLabels.housing },
  { value: "utilities", label: expenseCategoryLabels.utilities },
  { value: "transport", label: expenseCategoryLabels.transport },
  { value: "medical", label: expenseCategoryLabels.medical },
  { value: "communication", label: expenseCategoryLabels.communication },
  { value: "entertainment", label: expenseCategoryLabels.entertainment },
  { value: "social", label: expenseCategoryLabels.social },
  { value: "education", label: expenseCategoryLabels.education },
  { value: "insurance", label: expenseCategoryLabels.insurance },
  { value: "subscription", label: expenseCategoryLabels.subscription },
  { value: "other", label: expenseCategoryLabels.other },
]

const savingKindLabels: Record<SavingKind, string> = {
  ordinary: "普通預金",
  fixed: "定期預金",
  investmentProfit: "投資利益",
  reserved: "先取貯金",
}

const savingKindOptions: { value: SavingKind; label: string }[] = [
  { value: "ordinary", label: savingKindLabels.ordinary },
  { value: "fixed", label: savingKindLabels.fixed },
  { value: "investmentProfit", label: savingKindLabels.investmentProfit },
  { value: "reserved", label: savingKindLabels.reserved },
]

const socialBenefitLabels: Record<SocialBenefitType, string> = {
  networking: "人脈づくり",
  familyCare: "家族ケア",
  mentalCare: "気分転換",
  celebration: "お祝い・記念",
  none: "特に意味はない",
  unknown: "まだ決めていない",
}

const socialBenefitOptions: { value: SocialBenefitType; label: string }[] = [
  { value: "networking", label: socialBenefitLabels.networking },
  { value: "familyCare", label: socialBenefitLabels.familyCare },
  { value: "mentalCare", label: socialBenefitLabels.mentalCare },
  { value: "celebration", label: socialBenefitLabels.celebration },
  { value: "none", label: socialBenefitLabels.none },
  { value: "unknown", label: socialBenefitLabels.unknown },
]

const necessityLabels: Record<NecessityLevel, string> = {
  essential: "必要",
  better: "あると助かる",
  waste: "浪費かも",
}

const surfaceClass =
  "rounded-[1.75rem] border border-white/70 bg-white/88 p-6 shadow-[0_20px_55px_rgba(15,23,42,0.08)] backdrop-blur"
const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-slate-900 shadow-sm transition focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100"
const primaryButtonClass =
  "rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5"
const secondaryButtonClass =
  "rounded-full border border-slate-200 bg-white/90 px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5"
const pillButtonClass =
  "rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5"

const featureHighlights = [
  {
    eyebrow: "見える化",
    title: "収支の流れを一画面で確認",
    description:
      "収入、支払、貯金をまとめて記録し、今日と今月の両方でペースを見直せます。",
    accent: "from-amber-100 via-white to-amber-50",
  },
  {
    eyebrow: "続けやすさ",
    title: "入力から振り返りまで迷わない",
    description:
      "カテゴリ、必要度、固定費までその場で整理できるので、あとから見返しても分かりやすく残せます。",
    accent: "from-emerald-100 via-white to-cyan-50",
  },
  {
    eyebrow: "レポート",
    title: "共有や印刷までそのまま対応",
    description:
      "PDF・Word・印刷の出力をすぐ使えるので、家族との共有や月末レビューにも向いています。",
    accent: "from-sky-100 via-white to-indigo-50",
  },
]

const storyCards = [
  {
    title: "落ち着いて家計を整える朝の時間",
    description: "数字に追われず、暮らしのリズムに合わせて記録できる設計です。",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
    alt: "家計簿と電卓を使ってお金の流れを確認している机",
  },
  {
    title: "買い物のクセも振り返りやすい",
    description: "食費や日用品の偏りを、カテゴリ別の集計からすぐ確認できます。",
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
    alt: "食材が並んだキッチンのカウンター",
  },
  {
    title: "週末の見直しも気軽に",
    description: "一覧とグラフを見ながら、次の一週間の予算を整えられます。",
    image:
      "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=900&q=80",
    alt: "ノートと手帳を広げて予定を見直しているデスク",
  },
]

const guideSteps = [
  {
    step: "01",
    title: "今日の収入と支払を入力",
    description:
      "まずは金額とメモだけでも十分です。固定費や必要度は慣れてきたら一緒に整えられます。",
  },
  {
    step: "02",
    title: "予算と貯金のペースを確認",
    description:
      "カテゴリ別の予算、先取貯金、防衛資金の進み具合を同じ流れで確認できます。",
  },
  {
    step: "03",
    title: "月末にレポートとして残す",
    description:
      "気づいたことをそのまま共有できるように、印刷や書類出力までつながっています。",
  },
]

function Card(props: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/92 p-5 shadow-[0_16px_35px_rgba(15,23,42,0.08)] backdrop-blur transition-transform duration-300 hover:-translate-y-1">
      <p className="text-sm font-medium text-slate-500">{props.title}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">
        {props.value}
      </p>
      {props.sub ? <p className="mt-2 text-xs text-slate-500">{props.sub}</p> : null}
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 text-2xl font-black tracking-tight text-slate-900">
      {children}
    </h2>
  )
}

function SimpleBarChart(props: {
  data: { label: string; income: number; expense: number; saving: number }[]
}) {
  const maxValue = Math.max(
    1,
    ...props.data.flatMap((item) => [item.income, item.expense, item.saving])
  )

  return (
    <div className="space-y-4">
      {props.data.map((item) => (
        <div
          key={item.label}
          className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4"
        >
          <p className="mb-3 text-sm font-bold text-slate-800">{item.label}</p>

          <div className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs font-medium text-slate-500">
                <span>収入</span>
                <span>{yen(item.income)}</span>
              </div>
              <progress className="h-3 w-full overflow-hidden rounded-full" value={item.income} max={maxValue} />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs font-medium text-slate-500">
                <span>支出</span>
                <span>{yen(item.expense)}</span>
              </div>
              <progress className="h-3 w-full overflow-hidden rounded-full" value={item.expense} max={maxValue} />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs font-medium text-slate-500">
                <span>貯金</span>
                <span>{yen(item.saving)}</span>
              </div>
              <progress className="h-3 w-full overflow-hidden rounded-full" value={item.saving} max={maxValue} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ForecastLineChart(props: { data: SavingsForecastPoint[] }) {
  const width = 760
  const height = 320
  const padding = { top: 20, right: 24, bottom: 42, left: 60 }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const lastIndex = Math.max(props.data.length - 1, 1)
  const maxValue = Math.max(
    1,
    ...props.data.flatMap((item) => [item.cash, item.fixed, item.investment])
  )
  const series = [
    { key: "cash" as const, label: "普通預金・現金", color: "#0f766e" },
    { key: "fixed" as const, label: "定期預金", color: "#2563eb" },
    { key: "investment" as const, label: "株・投資", color: "#ea580c" },
  ]

  const x = (index: number) => padding.left + (plotWidth * index) / lastIndex
  const y = (value: number) =>
    padding.top + plotHeight - (Math.max(value, 0) / maxValue) * plotHeight
  const labelStep = Math.max(1, Math.ceil(props.data.length / 6))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {series.map((item) => (
          <div
            key={item.key}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[720px]">
          {Array.from({ length: 5 }, (_, index) => {
            const value = (maxValue / 4) * (4 - index)
            const yPos = padding.top + (plotHeight / 4) * index

            return (
              <g key={index}>
                <line
                  x1={padding.left}
                  y1={yPos}
                  x2={width - padding.right}
                  y2={yPos}
                  stroke="#e2e8f0"
                  strokeDasharray="4 6"
                />
                <text
                  x={padding.left - 12}
                  y={yPos + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px]"
                >
                  {Math.round(value / 10000)}万
                </text>
              </g>
            )
          })}

          {series.map((item) => {
            const path = props.data
              .map((point, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(point[item.key])}`)
              .join(" ")
            const lastPoint = props.data[props.data.length - 1]

            return (
              <g key={item.key}>
                <path
                  d={path}
                  fill="none"
                  stroke={item.color}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4"
                />
                <circle
                  cx={x(props.data.length - 1)}
                  cy={y(lastPoint[item.key])}
                  r="5"
                  fill={item.color}
                />
              </g>
            )
          })}

          {props.data.map((point, index) => {
            if (index !== 0 && index !== props.data.length - 1 && index % labelStep !== 0) {
              return null
            }

            return (
              <text
                key={point.month}
                x={x(index)}
                y={height - 12}
                textAnchor="middle"
                className="fill-slate-500 text-[11px]"
              >
                {point.month}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export default function Page() {
  const reportRef = useRef<HTMLDivElement | null>(null)
  const [state, setState] = useState<FinanceState>(DEFAULT_STATE)
  const [hasLoadedState, setHasLoadedState] = useState(false)

  useEffect(() => {
    let cancelled = false

    queueMicrotask(() => {
      if (cancelled) return

      startTransition(() => {
        setState(loadState())
        setHasLoadedState(true)
      })
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hasLoadedState) return
    saveState(state)
  }, [hasLoadedState, state])

  const [unit, setUnit] = useState<PeriodUnit>("daily")
  const [selectedDate, setSelectedDate] = useState(today())
  const [selectedMonth, setSelectedMonth] = useState(monthKeyFromDate(today()))

  const [incomeDate, setIncomeDate] = useState(today())
  const [incomeAmount, setIncomeAmount] = useState("")
  const [incomeMemo, setIncomeMemo] = useState("")
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null)

  const [expenseDate, setExpenseDate] = useState(today())
  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseMemo, setExpenseMemo] = useState("")
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>("food")
  const [expenseFixed, setExpenseFixed] = useState(false)
  const [expenseNecessity, setExpenseNecessity] =
    useState<NecessityLevel>("essential")
  const [expenseWorkRelated, setExpenseWorkRelated] = useState(false)
  const [socialBenefitType, setSocialBenefitType] =
    useState<SocialBenefitType>("unknown")
  const [socialSatisfaction, setSocialSatisfaction] = useState("3")
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)

  const [savingDate, setSavingDate] = useState(today())
  const [savingAmount, setSavingAmount] = useState("")
  const [savingMemo, setSavingMemo] = useState("")
  const [savingKind, setSavingKind] = useState<SavingKind>("reserved")
  const [editingSavingId, setEditingSavingId] = useState<string | null>(null)

  const periodKey = unit === "daily" ? selectedDate : selectedMonth
  const periodLabel = unit === "daily" ? `${selectedDate} の記録` : `${selectedMonth} の記録`

  const summary = useMemo(() => buildSummary(state, unit, periodKey), [state, unit, periodKey])
  const savingsForecast = useMemo(() => buildSavingsForecast(state), [state])

  const visibleIncomes = useMemo(() => {
    return state.incomes.filter((item) =>
      unit === "daily"
        ? item.date === selectedDate
        : monthKeyFromDate(item.date) === selectedMonth
    )
  }, [selectedDate, selectedMonth, state.incomes, unit])

  const visibleExpenses = useMemo(() => {
    return state.expenses.filter((item) =>
      unit === "daily"
        ? item.date === selectedDate
        : monthKeyFromDate(item.date) === selectedMonth
    )
  }, [selectedDate, selectedMonth, state.expenses, unit])

  const visibleSavings = useMemo(() => {
    return state.savings.filter((item) =>
      unit === "daily"
        ? item.date === selectedDate
        : monthKeyFromDate(item.date) === selectedMonth
    )
  }, [selectedDate, selectedMonth, state.savings, unit])

  const totalRecords = state.incomes.length + state.expenses.length + state.savings.length
  const totalBudgetLimit = state.budgets.reduce(
    (acc, item) => acc + item.monthlyLimit,
    0
  )
  const topExpenseCategory = [...summary.categorySummary].sort(
    (a, b) => b.amount - a.amount
  )[0]
  const recentTrend = summary.monthlyTrend.slice(-3).reverse()
  const currentForecastPoint = savingsForecast.points[0]
  const futureForecastPoint =
    savingsForecast.points[savingsForecast.points.length - 1] ?? currentForecastPoint
  const forecastGrowth = futureForecastPoint.total - currentForecastPoint.total
  const budgetUsageRate =
    totalBudgetLimit > 0
      ? Math.max(0, Math.round((summary.totalExpense / totalBudgetLimit) * 100))
      : 0
  const socialBudgetStatus = summary.categorySummary.find(
    (item) => item.category === "social"
  )
  const restaurantSuggestionAmount = Math.min(
    12000,
    Math.max(
      1000,
      Math.round(
        ((socialBudgetStatus && socialBudgetStatus.budgetDiff > 0
          ? socialBudgetStatus.budgetDiff
          : Math.max(summary.balance, 2500)) /
          500)
      ) * 500
    )
  )

  const heroStats = [
    {
      label: unit === "daily" ? "今日の収支" : "今月の収支",
      value: yen(summary.balance),
      note: summary.balance >= 0 ? "黒字ペースです" : "見直しのタイミングです",
      tone:
        summary.balance >= 0
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-700",
    },
    {
      label: "記録件数",
      value: `${totalRecords}件`,
      note:
        totalRecords > 0
          ? "履歴が増えるほど傾向が見やすくなります"
          : "まずは今日の分から始められます",
      tone: "border-sky-200 bg-sky-50 text-sky-700",
    },
    {
      label: "設定予算",
      value: yen(totalBudgetLimit),
      note:
        summary.totalExpense > 0
          ? `現在の使用感は ${budgetUsageRate}% です`
          : "予算に対してまだ支出記録はありません",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
    },
  ]

  const summaryCards = [
    { title: "収入合計", value: yen(summary.totalIncome) },
    { title: "支出合計", value: yen(summary.totalExpense) },
    { title: "貯金合計", value: yen(summary.totalSaving) },
    {
      title: "収支",
      value: yen(summary.balance),
      sub: summary.balance >= 0 ? "黒字ペース" : "見直しが必要かも",
    },
    {
      title: "赤字率",
      value: percentText(summary.deficitRate),
      sub: getDeficitLabel(summary.deficitLevel),
    },
    { title: "貯金率", value: percentText(summary.savingsRate) },
    { title: "固定費率", value: percentText(summary.fixedCostRate) },
    { title: "浪費率", value: percentText(summary.wasteRate) },
    { title: "先取貯金達成度", value: percentText(summary.plannedSavingProgress) },
    { title: "防衛資金進捗", value: percentText(summary.emergencyFundProgress) },
    {
      title: "浪費の労働時間換算",
      value: `${summary.wasteWorkHours}時間`,
      sub: summary.wasteExpenseTotal > 0 ? yen(summary.wasteExpenseTotal) : "まだ記録なし",
    },
    {
      title: "投資の準備ライン",
      value: summary.investmentUnlocked ? "準備OK" : "あと少し",
      sub: "防衛資金50%以上 かつ 先取貯金80%以上",
    },
  ]

  function resetIncomeForm() {
    setIncomeDate(today())
    setIncomeAmount("")
    setIncomeMemo("")
    setEditingIncomeId(null)
  }

  function resetExpenseForm() {
    setExpenseDate(today())
    setExpenseAmount("")
    setExpenseMemo("")
    setExpenseCategory("food")
    setExpenseFixed(false)
    setExpenseNecessity("essential")
    setExpenseWorkRelated(false)
    setSocialBenefitType("unknown")
    setSocialSatisfaction("3")
    setEditingExpenseId(null)
  }

  function resetSavingForm() {
    setSavingDate(today())
    setSavingAmount("")
    setSavingMemo("")
    setSavingKind("reserved")
    setEditingSavingId(null)
  }

  function submitIncome() {
    const amount = Number(incomeAmount)
    if (!incomeDate || amount <= 0) return

    const newItem: IncomeItem = {
      id: editingIncomeId ?? createId(),
      date: incomeDate,
      amount,
      memo: incomeMemo.trim(),
    }

    setState((prev) => ({
      ...prev,
      incomes: editingIncomeId
        ? prev.incomes.map((item) => (item.id === editingIncomeId ? newItem : item))
        : [newItem, ...prev.incomes],
    }))

    resetIncomeForm()
  }

  function submitExpense() {
    const amount = Number(expenseAmount)
    if (!expenseDate || amount <= 0) return

    const newItem: ExpenseRecord = {
      id: editingExpenseId ?? createId(),
      date: expenseDate,
      amount,
      memo: expenseMemo.trim(),
      category: expenseCategory,
      isFixed: expenseFixed,
      necessity: expenseNecessity,
      workRelated: expenseCategory === "social" ? expenseWorkRelated : false,
      socialBenefitType:
        expenseCategory === "social" ? socialBenefitType : undefined,
      socialSatisfaction:
        expenseCategory === "social" ? Number(socialSatisfaction) : undefined,
    }

    setState((prev) => ({
      ...prev,
      expenses: editingExpenseId
        ? prev.expenses.map((item) => (item.id === editingExpenseId ? newItem : item))
        : [newItem, ...prev.expenses],
    }))

    resetExpenseForm()
  }

  function submitSaving() {
    const amount = Number(savingAmount)
    if (!savingDate || amount <= 0) return

    const newItem: SavingItem = {
      id: editingSavingId ?? createId(),
      date: savingDate,
      amount,
      memo: savingMemo.trim(),
      kind: savingKind,
    }

    setState((prev) => ({
      ...prev,
      savings: editingSavingId
        ? prev.savings.map((item) => (item.id === editingSavingId ? newItem : item))
        : [newItem, ...prev.savings],
    }))

    resetSavingForm()
  }

  function editIncome(item: IncomeItem) {
    setIncomeDate(item.date)
    setIncomeAmount(String(item.amount))
    setIncomeMemo(item.memo)
    setEditingIncomeId(item.id)
  }

  function editExpense(item: ExpenseItem) {
    const record = item as ExpenseRecord
    setExpenseDate(item.date)
    setExpenseAmount(String(item.amount))
    setExpenseMemo(item.memo)
    setExpenseCategory(item.category)
    setExpenseFixed(Boolean(item.isFixed))
    setExpenseNecessity(item.necessity ?? "essential")
    setExpenseWorkRelated(Boolean(record.workRelated ?? record.isWorkRelated))
    setSocialBenefitType(item.socialBenefitType ?? "unknown")
    setSocialSatisfaction(String(item.socialSatisfaction ?? 3))
    setEditingExpenseId(item.id)
  }

  function editSaving(item: SavingItem) {
    setSavingDate(item.date)
    setSavingAmount(String(item.amount))
    setSavingMemo(item.memo)
    setSavingKind(item.kind)
    setEditingSavingId(item.id)
  }

  function removeIncome(id: string) {
    setState((prev) => ({
      ...prev,
      incomes: prev.incomes.filter((item) => item.id !== id),
    }))
  }

  function removeExpense(id: string) {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((item) => item.id !== id),
    }))
  }

  function removeSaving(id: string) {
    setState((prev) => ({
      ...prev,
      savings: prev.savings.filter((item) => item.id !== id),
    }))
  }

  function deleteVisiblePeriodOnly() {
    const label = unit === "daily" ? `${selectedDate} の表示分` : `${selectedMonth} の表示分`
    const ok = window.confirm(`${label} の収入・支出・貯金データを削除します。よければ続けてください。`)
    if (!ok) return

    setState((prev) => ({
      ...prev,
      incomes: prev.incomes.filter((item) =>
        unit === "daily"
          ? item.date !== selectedDate
          : monthKeyFromDate(item.date) !== selectedMonth
      ),
      expenses: prev.expenses.filter((item) =>
        unit === "daily"
          ? item.date !== selectedDate
          : monthKeyFromDate(item.date) !== selectedMonth
      ),
      savings: prev.savings.filter((item) =>
        unit === "daily"
          ? item.date !== selectedDate
          : monthKeyFromDate(item.date) !== selectedMonth
      ),
    }))
  }

  function deleteAllData() {
    const ok = window.confirm("保存されているデータをすべて削除します。本当に続けますか？")
    if (!ok) return

    setState(DEFAULT_STATE)
    resetIncomeForm()
    resetExpenseForm()
    resetSavingForm()
    localStorage.removeItem(STORAGE_KEY)
  }

  function updateBudget(category: ExpenseCategory, value: string) {
    const monthlyLimit = Number(value) || 0
    setState((prev) => ({
      ...prev,
      budgets: prev.budgets.map((item) =>
        item.category === category ? { ...item, monthlyLimit } : item
      ),
    }))
  }

  async function handlePdfExport() {
    if (!reportRef.current) return
    await exportReportPdf(
      reportRef.current,
      `finance-report-${periodKey.replace(/[^0-9-]/g, "")}.pdf`
    )
  }

  async function handleWordExport() {
    await exportReportWord({
      state,
      summary,
      periodLabel,
      filename: `finance-report-${periodKey.replace(/[^0-9-]/g, "")}.doc`,
    })
  }

  function handlePrint() {
    window.print()
  }

  return (
    <main className="min-h-screen px-4 py-4 md:px-8 md:py-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.15),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(245,158,11,0.14),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.72))]" />

          <div className="relative border-b border-white/60 px-6 py-4 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-700">
                  Kakeibo Atelier
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  入力から振り返りまで、暮らしに寄り添う家計ダッシュボード
                </p>
              </div>

              <nav className="flex flex-wrap gap-2 text-sm font-semibold text-slate-700">
                <a href="#overview" className={pillButtonClass}>
                  見える化
                </a>
                <a href="#entry" className={pillButtonClass}>
                  入力
                </a>
                <a href="#report" className={pillButtonClass}>
                  レポート
                </a>
                <a href="#history" className={pillButtonClass}>
                  履歴
                </a>
              </nav>
            </div>
          </div>

          <div className="relative grid gap-8 px-6 py-8 lg:grid-cols-[1.12fr_0.88fr] lg:px-8 lg:py-10">
            <div>
              <span className="inline-flex rounded-full border border-teal-200 bg-teal-50/90 px-4 py-2 text-sm font-semibold text-teal-700">
                毎日の支出を、あとから効く形で整える
              </span>

              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                家計フル管理ダッシュボード
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                収入・支払・貯金をひとつの流れで記録して、1日と1か月の両方で自動チェック。
                予算、固定費、先取貯金までつながるので、数字だけで終わらない家計管理ができます。
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a href="#entry" className={primaryButtonClass}>
                  入力を始める
                </a>
                <a href="#report" className={secondaryButtonClass}>
                  レポートを見る
                </a>
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                <button className={pillButtonClass} onClick={handlePrint}>
                  印刷
                </button>
                <button
                  className="rounded-full border border-rose-200 bg-rose-50/90 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:-translate-y-0.5"
                  onClick={handlePdfExport}
                >
                  PDF出力
                </button>
                <button
                  className="rounded-full border border-sky-200 bg-sky-50/90 px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:-translate-y-0.5"
                  onClick={handleWordExport}
                >
                  Word出力
                </button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {heroStats.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-[1.5rem] border p-4 ${item.tone}`}
                  >
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-2 text-2xl font-black tracking-tight">
                      {item.value}
                    </p>
                    <p className="mt-2 text-xs leading-6 opacity-90">{item.note}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {featureHighlights.map((item) => (
                  <div
                    key={item.title}
                    className={`rounded-[1.5rem] border border-white/80 bg-gradient-to-br ${item.accent} p-5 shadow-sm`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {item.eyebrow}
                    </p>
                    <p className="mt-3 text-lg font-black tracking-tight text-slate-900">
                      {item.title}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="relative overflow-hidden rounded-[1.75rem] bg-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
                <Image
                  src={storyCards[0].image}
                  alt={storyCards[0].alt}
                  width={1200}
                  height={900}
                  className="h-[320px] w-full object-cover opacity-85"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

                <div className="absolute right-4 top-4 w-52 rounded-[1.25rem] border border-white/20 bg-white/92 p-4 text-slate-900 shadow-xl backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Highlight
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    目立つ支出カテゴリ
                  </p>
                  <p className="mt-1 text-xl font-black tracking-tight text-slate-900">
                    {topExpenseCategory && topExpenseCategory.amount > 0
                      ? expenseCategoryLabels[topExpenseCategory.category]
                      : "まだ支出なし"}
                  </p>
                  <p className="mt-1 text-xs leading-6 text-slate-500">
                    {topExpenseCategory && topExpenseCategory.amount > 0
                      ? `${yen(topExpenseCategory.amount)} / ${percentText(topExpenseCategory.percentage)}`
                      : "入力を始めると支出傾向がここに表示されます。"}
                  </p>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-sm font-semibold text-white/80">
                    {storyCards[0].title}
                  </p>
                  <p className="mt-2 max-w-md text-2xl font-black tracking-tight">
                    数字と暮らしを、同じ画面で穏やかに整理する
                  </p>
                  <p className="mt-3 max-w-lg text-sm leading-7 text-white/80">
                    {summary.budgetWarnings.length === 0
                      ? "予算超過は今のところありません。気持ちよく続けられるペースです。"
                      : `${summary.budgetWarnings.length}カテゴリで予算超過があるので、次の支出前に見直しておくと安心です。`}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {storyCards.slice(1).map((card) => (
                  <div
                    key={card.title}
                    className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/90 shadow-[0_16px_40px_rgba(15,23,42,0.1)] backdrop-blur"
                  >
                    <Image
                      src={card.image}
                      alt={card.alt}
                      width={900}
                      height={700}
                      className="h-36 w-full object-cover"
                      loading="eager"
                    />
                    <div className="p-4">
                      <p className="text-sm font-bold text-slate-900">{card.title}</p>
                      <p className="mt-2 text-xs leading-6 text-slate-600">
                        {card.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className={surfaceClass}>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">
              How It Works
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              家計が続きやすい、3つの流れ
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              入力のハードルを下げつつ、予算確認と振り返りまで自然につながるように構成しています。
            </p>

            <div className="mt-6 space-y-4">
              {guideSteps.map((item) => (
                <div
                  key={item.step}
                  className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4"
                >
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white">
                      {item.step}
                    </span>
                    <div>
                      <p className="text-lg font-black tracking-tight text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/88 shadow-[0_20px_55px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="grid h-full gap-0 md:grid-cols-[0.78fr_1.22fr]">
              <div className="relative min-h-[280px]">
                <Image
                  src="https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?auto=format&fit=crop&w=1200&q=80"
                  alt="ノートパソコンとカフェラテがある落ち着いた作業スペース"
                  width={1200}
                  height={900}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
              </div>

              <div className="p-6 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
                  Daily Insight
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                  数字だけで終わらせず、次の行動までつなげる
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  食費、交際費、固定費、先取貯金まで同じ画面で見えるので、
                  なんとなくの不安を「次にどこを整えるか」に変えやすくなります。
                </p>

                <div className="mt-6 grid gap-3">
                  <div className="rounded-[1.25rem] bg-slate-50/90 p-4">
                    <p className="text-sm font-bold text-slate-900">現在の貯金ペース</p>
                    <p className="mt-1 text-sm leading-7 text-slate-600">
                      先取貯金の達成度は {percentText(summary.plannedSavingProgress)}。
                      {summary.plannedSavingProgress >= 0.8
                        ? "この調子で継続しやすい状態です。"
                        : "目標との差を見ながら無理のない調整ができます。"}
                    </p>
                  </div>

                  <div className="rounded-[1.25rem] bg-slate-50/90 p-4">
                    <p className="text-sm font-bold text-slate-900">予算の見直しポイント</p>
                    <p className="mt-1 text-sm leading-7 text-slate-600">
                      {topExpenseCategory && topExpenseCategory.amount > 0
                        ? `今いちばん比重が大きいのは「${expenseCategoryLabels[topExpenseCategory.category]}」です。`
                        : "支出が増えてきたカテゴリから順番に予算を整えるとスムーズです。"}
                    </p>
                  </div>

                  <div className="rounded-[1.25rem] bg-slate-50/90 p-4">
                    <p className="text-sm font-bold text-slate-900">直近の流れ</p>
                    <p className="mt-1 text-sm leading-7 text-slate-600">
                      {recentTrend.length > 0
                        ? `直近 ${recentTrend.length}か月の推移も保存されているので、月末の振り返りまでつなげやすい状態です。`
                        : "まだ月次の推移はありません。数日分の入力からでもグラフが育っていきます。"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-600">普通預金 年利 (%)</span>
              <input
                type="number"
                step="0.1"
                value={state.ordinaryAnnualRate}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    ordinaryAnnualRate: Number(event.target.value) || 0,
                  }))
                }
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-600">定期預金 年利 (%)</span>
              <input
                type="number"
                step="0.1"
                value={state.fixedAnnualRate}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    fixedAnnualRate: Number(event.target.value) || 0,
                  }))
                }
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-600">株・投資 想定年利 (%)</span>
              <input
                type="number"
                step="0.1"
                value={state.stockAnnualRate}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    stockAnnualRate: Number(event.target.value) || 0,
                  }))
                }
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-600">予測月数</span>
              <input
                type="number"
                min="1"
                max="36"
                value={state.forecastMonths}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    forecastMonths: Math.max(
                      1,
                      Math.min(36, Number(event.target.value) || 12)
                    ),
                  }))
                }
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <section id="overview" className={`${surfaceClass} scroll-mt-24`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <SectionTitle>表示切替</SectionTitle>
              <p className="text-sm leading-7 text-slate-600">
                日単位と月単位を切り替えながら、今見たい期間の収支を確認できます。
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">現在の表示:</span> {periodLabel}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              className={
                unit === "daily"
                  ? "rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                  : pillButtonClass
              }
              onClick={() => setUnit("daily")}
            >
              1日単位
            </button>
            <button
              className={
                unit === "monthly"
                  ? "rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                  : pillButtonClass
              }
              onClick={() => setUnit("monthly")}
            >
              1か月単位
            </button>

            {unit === "daily" ? (
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm"
              />
            ) : (
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm"
              />
            )}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4">
              <p className="text-sm font-bold text-slate-900">赤字率</p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {percentText(summary.deficitRate)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {getDeficitLabel(summary.deficitLevel)}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4">
              <p className="text-sm font-bold text-slate-900">貯金率</p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {percentText(summary.savingsRate)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                継続しやすいペースかを確認できます
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4">
              <p className="text-sm font-bold text-slate-900">先取貯金の進み具合</p>
              <p className="mt-2 text-2xl font-black text-slate-900">
                {percentText(summary.plannedSavingProgress)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                防衛資金は {percentText(summary.emergencyFundProgress)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-200/80 pt-6">
            <span className="text-sm font-semibold text-slate-900">データ整理</span>
            <button
              className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 shadow-sm transition hover:-translate-y-0.5"
              onClick={deleteVisiblePeriodOnly}
            >
              表示中のデータだけ削除
            </button>
            <button
              className="rounded-full border border-black bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
              onClick={deleteAllData}
            >
              全データを削除
            </button>
          </div>
        </section>

        <section id="settings" className={`${surfaceClass} scroll-mt-24`}>
          <SectionTitle>基本設定</SectionTitle>
          <p className="mb-6 text-sm leading-7 text-slate-600">
            生活防衛や先取貯金の基準を決めておくと、毎月の判断がぶれにくくなります。
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-600">最低生活費（月）</span>
              <input
                type="number"
                value={state.monthlyMinimumLivingCost}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    monthlyMinimumLivingCost: Number(event.target.value) || 0,
                  }))
                }
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-600">防衛資金の目標月数</span>
              <input
                type="number"
                value={state.emergencyFundTargetMonths}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    emergencyFundTargetMonths: Number(event.target.value) || 0,
                  }))
                }
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-600">先取貯金目標（月）</span>
              <input
                type="number"
                value={state.monthlyPlannedSaving}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    monthlyPlannedSaving: Number(event.target.value) || 0,
                  }))
                }
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-600">時給</span>
              <input
                type="number"
                value={state.hourlyWage}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    hourlyWage: Number(event.target.value) || 0,
                  }))
                }
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <section
          id="entry"
          className="grid scroll-mt-24 grid-cols-1 gap-6 xl:grid-cols-3"
        >
          <div className={surfaceClass}>
            <SectionTitle>収入入力</SectionTitle>
            <div className="grid gap-3">
              <input
                type="date"
                value={incomeDate}
                onChange={(event) => setIncomeDate(event.target.value)}
                className={inputClass}
              />
              <input
                type="number"
                placeholder="金額"
                value={incomeAmount}
                onChange={(event) => setIncomeAmount(event.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="メモ"
                value={incomeMemo}
                onChange={(event) => setIncomeMemo(event.target.value)}
                className={inputClass}
              />

              <div className="flex flex-wrap gap-3">
                <button className={primaryButtonClass} onClick={submitIncome}>
                  {editingIncomeId ? "収入を更新" : "収入を追加"}
                </button>
                {editingIncomeId ? (
                  <button className={secondaryButtonClass} onClick={resetIncomeForm}>
                    キャンセル
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className={surfaceClass}>
            <SectionTitle>支払入力</SectionTitle>
            <div className="grid gap-3">
              <input
                type="date"
                value={expenseDate}
                onChange={(event) => setExpenseDate(event.target.value)}
                className={inputClass}
              />
              <input
                type="number"
                placeholder="金額"
                value={expenseAmount}
                onChange={(event) => setExpenseAmount(event.target.value)}
                className={inputClass}
              />
              <select
                value={expenseCategory}
                onChange={(event) => setExpenseCategory(event.target.value as ExpenseCategory)}
                className={inputClass}
              >
                {expenseCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={expenseNecessity}
                onChange={(event) =>
                  setExpenseNecessity(event.target.value as NecessityLevel)
                }
                className={inputClass}
              >
                {Object.entries(necessityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={expenseFixed}
                  onChange={(event) => setExpenseFixed(event.target.checked)}
                />
                固定費として扱う
              </label>

              {expenseCategory === "social" ? (
                <>
                  <label className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={expenseWorkRelated}
                      onChange={(event) => setExpenseWorkRelated(event.target.checked)}
                    />
                    仕事につながる出費
                  </label>

                  <select
                    value={socialBenefitType}
                    onChange={(event) =>
                      setSocialBenefitType(event.target.value as SocialBenefitType)
                    }
                    className={inputClass}
                  >
                    {socialBenefitOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={socialSatisfaction}
                    onChange={(event) => setSocialSatisfaction(event.target.value)}
                    className={inputClass}
                  >
                    <option value="1">満足度 1</option>
                    <option value="2">満足度 2</option>
                    <option value="3">満足度 3</option>
                    <option value="4">満足度 4</option>
                    <option value="5">満足度 5</option>
                  </select>
                </>
              ) : null}

              <input
                type="text"
                placeholder="支出メモ"
                value={expenseMemo}
                onChange={(event) => setExpenseMemo(event.target.value)}
                className={inputClass}
              />

              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/15 transition hover:-translate-y-0.5"
                  onClick={submitExpense}
                >
                  {editingExpenseId ? "支払を更新" : "支払を追加"}
                </button>
                {editingExpenseId ? (
                  <button className={secondaryButtonClass} onClick={resetExpenseForm}>
                    キャンセル
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className={surfaceClass}>
            <SectionTitle>貯金入力</SectionTitle>
            <div className="grid gap-3">
              <input
                type="date"
                value={savingDate}
                onChange={(event) => setSavingDate(event.target.value)}
                className={inputClass}
              />
              <input
                type="number"
                placeholder="金額"
                value={savingAmount}
                onChange={(event) => setSavingAmount(event.target.value)}
                className={inputClass}
              />
              <select
                value={savingKind}
                onChange={(event) => setSavingKind(event.target.value as SavingKind)}
                className={inputClass}
              >
                {savingKindOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="メモ"
                value={savingMemo}
                onChange={(event) => setSavingMemo(event.target.value)}
                className={inputClass}
              />

              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-sky-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/15 transition hover:-translate-y-0.5"
                  onClick={submitSaving}
                >
                  {editingSavingId ? "貯金を更新" : "貯金を追加"}
                </button>
                {editingSavingId ? (
                  <button className={secondaryButtonClass} onClick={resetSavingForm}>
                    キャンセル
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section id="budget" className={`${surfaceClass} scroll-mt-24`}>
          <SectionTitle>カテゴリ別 予算設定</SectionTitle>
          <p className="mb-6 text-sm leading-7 text-slate-600">
            予算はあとから何度でも変えられます。まずはざっくりでも、月の目安を入れておくのがおすすめです。
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {state.budgets.map((budget) => (
              <label key={budget.id} className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-600">
                  {expenseCategoryLabels[budget.category]}
                </span>
                <input
                  type="number"
                  value={budget.monthlyLimit}
                  onChange={(event) => updateBudget(budget.category, event.target.value)}
                  className={inputClass}
                />
              </label>
            ))}
          </div>
        </section>

        <div id="report" ref={reportRef} className="scroll-mt-24 space-y-6">
          <section>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((item) => (
                <Card
                  key={item.title}
                  title={item.title}
                  value={item.value}
                  sub={item.sub}
                />
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className={surfaceClass}>
              <SectionTitle>予算超過警告</SectionTitle>
              {summary.budgetWarnings.length === 0 ? (
                <p className="text-sm leading-7 text-slate-600">
                  予算超過はありません。今のペースなら落ち着いて続けられそうです。
                </p>
              ) : (
                <div className="space-y-3">
                  {summary.budgetWarnings.map((warning) => (
                    <div
                      key={warning.category}
                      className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4"
                    >
                      <p className="font-bold text-rose-700">
                        {expenseCategoryLabels[warning.category]}
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        使用額 {yen(warning.used)} / 予算 {yen(warning.limit)}
                      </p>
                      <p className="mt-1 text-sm font-bold text-rose-700">
                        超過 {yen(warning.overAmount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={surfaceClass}>
              <SectionTitle>カテゴリ別集計</SectionTitle>
              <div className="space-y-3">
                {summary.categorySummary.map((item) => (
                  <div
                    key={item.category}
                    className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-slate-800">
                        {expenseCategoryLabels[item.category]}
                      </p>
                      <p className="text-sm text-slate-500">
                        {item.count}件 / 構成比 {percentText(item.percentage)}
                      </p>
                    </div>

                    <p className="mt-3 text-lg font-black tracking-tight text-slate-900">
                      {yen(item.amount)}
                    </p>

                    <div className="mt-3 h-3 rounded-full bg-slate-100">
                      <div
                        className={`h-3 rounded-full ${
                          item.isOverBudget ? "bg-rose-500" : "bg-slate-900"
                        }`}
                        style={{
                          width: `${Math.min(item.percentage * 100, 100)}%`,
                        }}
                      />
                    </div>

                    <p className="mt-2 text-sm text-slate-600">
                      予算 {item.budgetLimit > 0 ? yen(item.budgetLimit) : "未設定"} /{" "}
                      {item.isOverBudget
                        ? `超過 ${yen(Math.abs(item.budgetDiff))}`
                        : `残り ${yen(item.budgetDiff)}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={surfaceClass}>
            <SectionTitle>月次グラフ</SectionTitle>
            {summary.monthlyTrend.length === 0 ? (
              <p className="text-sm leading-7 text-slate-600">
                まだ月次の履歴はありません。入力が増えるとここに推移が表示されます。
              </p>
            ) : (
              <SimpleBarChart
                data={summary.monthlyTrend.map((item) => ({
                  label: item.month,
                  income: item.income,
                  expense: item.expense,
                  saving: item.saving,
                }))}
              />
            )}
          </section>

          <section className={surfaceClass}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <SectionTitle>将来予測グラフ</SectionTitle>
                <p className="max-w-3xl text-sm leading-7 text-slate-600">
                  直近3か月の積立ペースと設定した年利から、普通預金・定期預金・株・投資の残高を
                  {` ${state.forecastMonths} `}
                  か月先まで予測しています。
                </p>
              </div>

              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                利率ありシミュレーション
              </div>
            </div>

            <div className="mt-6">
              <ForecastLineChart data={savingsForecast.points} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card
                title="現在の貯蓄総額"
                value={yen(currentForecastPoint.total)}
                sub={`普通 ${yen(currentForecastPoint.cash)} / 定期 ${yen(currentForecastPoint.fixed)} / 株 ${yen(currentForecastPoint.investment)}`}
              />
              <Card
                title={`${state.forecastMonths}か月後の予測`}
                value={yen(futureForecastPoint.total)}
                sub={`${futureForecastPoint.month} 時点 / ${forecastGrowth >= 0 ? "+" : ""}${yen(forecastGrowth)}`}
              />
              <Card
                title="毎月の積立ペース"
                value={yen(savingsForecast.monthlyContribution.total)}
                sub={`普通 ${yen(savingsForecast.monthlyContribution.cash)} / 定期 ${yen(savingsForecast.monthlyContribution.fixed)} / 株 ${yen(savingsForecast.monthlyContribution.investment)}`}
              />
              <Card
                title="想定年利"
                value={`株 ${state.stockAnnualRate}%`}
                sub={`普通 ${state.ordinaryAnnualRate}% / 定期 ${state.fixedAnnualRate}%`}
              />
            </div>
          </section>
        </div>

        <div className={surfaceClass}>
          <RestaurantSuggestions defaultAmount={restaurantSuggestionAmount} />
        </div>

        <section
          id="history"
          className="grid scroll-mt-24 grid-cols-1 gap-6 xl:grid-cols-3"
        >
          <div className={surfaceClass}>
            <SectionTitle>収入一覧</SectionTitle>
            <div className="space-y-3">
              {visibleIncomes.length === 0 ? (
                <p className="text-sm text-slate-500">まだ記録はありません。</p>
              ) : (
                visibleIncomes.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4"
                  >
                    <p className="font-black tracking-tight text-slate-900">
                      {yen(item.amount)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{item.date}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.memo || "-"}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button className={secondaryButtonClass} onClick={() => editIncome(item)}>
                        編集
                      </button>
                      <button
                        className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
                        onClick={() => removeIncome(item.id)}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={surfaceClass}>
            <SectionTitle>支払一覧</SectionTitle>
            <div className="space-y-3">
              {visibleExpenses.length === 0 ? (
                <p className="text-sm text-slate-500">まだ記録はありません。</p>
              ) : (
                visibleExpenses.map((item) => {
                  const record = item as ExpenseRecord
                  return (
                    <div
                      key={item.id}
                      className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4"
                    >
                      <p className="font-black tracking-tight text-slate-900">
                        {yen(item.amount)}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{item.date}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        カテゴリ: {expenseCategoryLabels[item.category]}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        必要度: {necessityLabels[item.necessity ?? "essential"]}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        固定費: {item.isFixed ? "はい" : "いいえ"}
                      </p>
                      {item.category === "social" ? (
                        <p className="mt-1 text-sm text-slate-600">
                          仕事関連: {record.workRelated || record.isWorkRelated ? "はい" : "いいえ"}
                        </p>
                      ) : null}
                      <p className="mt-1 text-sm text-slate-600">{item.memo || "-"}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button className={secondaryButtonClass} onClick={() => editExpense(item)}>
                          編集
                        </button>
                        <button
                          className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
                          onClick={() => removeExpense(item.id)}
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className={surfaceClass}>
            <SectionTitle>貯金一覧</SectionTitle>
            <div className="space-y-3">
              {visibleSavings.length === 0 ? (
                <p className="text-sm text-slate-500">まだ記録はありません。</p>
              ) : (
                visibleSavings.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4"
                  >
                    <p className="font-black tracking-tight text-slate-900">
                      {yen(item.amount)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{item.date}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      種別: {savingKindLabels[item.kind]}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{item.memo || "-"}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button className={secondaryButtonClass} onClick={() => editSaving(item)}>
                        編集
                      </button>
                      <button
                        className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
                        onClick={() => removeSaving(item.id)}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <footer className={surfaceClass}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">
                Closing Note
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                入力が少ない日も、続けるための余白として残して大丈夫です。
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                毎日完璧に埋めるより、あとで見返したくなる気持ちよさを優先しています。
                週末や月末の振り返りに、このページがちょうどよい拠点になるよう整えました。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="#overview" className={secondaryButtonClass}>
                上に戻る
              </a>
              <a href="#entry" className={primaryButtonClass}>
                もう一度入力する
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
