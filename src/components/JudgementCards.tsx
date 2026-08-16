"use client"

type SummaryLike = {
  deficitRate: number
  savingsRate: number
  fixedCostRate: number
  wasteRate: number
  savingEfficiencyRate: number
  savingGoalAchievement: number
  emergencyFundProgress: number
  plannedSavingProgress: number
  investmentUnlocked: boolean
}

type JudgeResult = {
  label: string
  color: string
  message: string
}

function percentText(value: number) {
  return `${Math.round(value * 100)}%`
}

function getDeficitJudge(value: number): JudgeResult {
  if (value <= 0) {
    return {
      label: "安全",
      color: "bg-emerald-50 border-emerald-200 text-emerald-700",
      message: "収入の範囲に収まっています。",
    }
  }
  if (value < 0.05) {
    return {
      label: "注意",
      color: "bg-yellow-50 border-yellow-200 text-yellow-700",
      message: "小さな赤字です。早めの調整で戻しやすい状態です。",
    }
  }
  if (value < 0.1) {
    return {
      label: "警戒",
      color: "bg-orange-50 border-orange-200 text-orange-700",
      message: "支出が少し強めです。固定費や浪費の見直しが有効です。",
    }
  }
  return {
    label: "危険",
    color: "bg-rose-50 border-rose-200 text-rose-700",
    message: "赤字幅が大きめです。優先順位を決めて支出を整えましょう。",
  }
}

function getSavingsJudge(value: number): JudgeResult {
  if (value < 0) {
    return {
      label: "赤字",
      color: "bg-rose-50 border-rose-200 text-rose-700",
      message: "支出が収入を上回っています。",
    }
  }
  if (value < 0.1) {
    return {
      label: "控えめ",
      color: "bg-yellow-50 border-yellow-200 text-yellow-700",
      message: "少しずつ貯金しやすい形へ整えていく段階です。",
    }
  }
  if (value < 0.2) {
    return {
      label: "標準",
      color: "bg-sky-50 border-sky-200 text-sky-700",
      message: "無理なく続けやすいペースです。",
    }
  }
  return {
    label: "良好",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    message: "しっかり貯金に回せています。",
  }
}

function getFixedCostJudge(value: number): JudgeResult {
  if (value >= 0.5) {
    return {
      label: "高い",
      color: "bg-rose-50 border-rose-200 text-rose-700",
      message: "固定費の比率が高めです。家賃やサブスクの見直し候補があります。",
    }
  }
  if (value >= 0.3) {
    return {
      label: "標準",
      color: "bg-yellow-50 border-yellow-200 text-yellow-700",
      message: "収支次第で調整できる余地があります。",
    }
  }
  return {
    label: "軽め",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    message: "固定費は比較的抑えられています。",
  }
}

function getWasteJudge(value: number): JudgeResult {
  if (value >= 0.25) {
    return {
      label: "多い",
      color: "bg-rose-50 border-rose-200 text-rose-700",
      message: "浪費の比率が高めです。メモを見返すと改善点を見つけやすいです。",
    }
  }
  if (value >= 0.1) {
    return {
      label: "注意",
      color: "bg-yellow-50 border-yellow-200 text-yellow-700",
      message: "少しずつ減らせそうな支出があります。",
    }
  }
  return {
    label: "良好",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    message: "浪費は抑えられています。",
  }
}

function getSavingEfficiencyJudge(value: number): JudgeResult {
  if (value < 0.1) {
    return {
      label: "低め",
      color: "bg-yellow-50 border-yellow-200 text-yellow-700",
      message: "予算に対して余白が少なめです。",
    }
  }
  if (value < 0.2) {
    return {
      label: "標準",
      color: "bg-sky-50 border-sky-200 text-sky-700",
      message: "予算の使い方は安定しています。",
    }
  }
  return {
    label: "良好",
    color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    message: "予算の中でうまく回せています。",
  }
}

function getSavingGoalJudge(value: number): JudgeResult {
  if (value >= 1) {
    return {
      label: "達成",
      color: "bg-emerald-50 border-emerald-200 text-emerald-700",
      message: "目標ラインをクリアしています。",
    }
  }
  if (value >= 0.8) {
    return {
      label: "あと少し",
      color: "bg-sky-50 border-sky-200 text-sky-700",
      message: "かなり近い状態です。小さな調整で届きます。",
    }
  }
  return {
    label: "見直し中",
    color: "bg-yellow-50 border-yellow-200 text-yellow-700",
    message: "今月の予算の使い方を調整できそうです。",
  }
}

function getEmergencyFundJudge(value: number): JudgeResult {
  if (value >= 1) {
    return {
      label: "達成",
      color: "bg-emerald-50 border-emerald-200 text-emerald-700",
      message: "防衛資金の目標を満たしています。",
    }
  }
  if (value >= 0.5) {
    return {
      label: "積み上げ中",
      color: "bg-sky-50 border-sky-200 text-sky-700",
      message: "半分を超えていて、かなり安心感があります。",
    }
  }
  return {
    label: "優先したい",
    color: "bg-yellow-50 border-yellow-200 text-yellow-700",
    message: "まずは防衛資金を厚くする意識が大切です。",
  }
}

function getPlannedSavingJudge(value: number): JudgeResult {
  if (value >= 1) {
    return {
      label: "達成",
      color: "bg-emerald-50 border-emerald-200 text-emerald-700",
      message: "先取貯金は計画どおりです。",
    }
  }
  if (value >= 0.8) {
    return {
      label: "順調",
      color: "bg-sky-50 border-sky-200 text-sky-700",
      message: "目標にかなり近い状態です。",
    }
  }
  return {
    label: "調整中",
    color: "bg-yellow-50 border-yellow-200 text-yellow-700",
    message: "固定で貯金に回す額を少し増やせると理想に近づきます。",
  }
}

function getInvestmentJudge(unlocked: boolean): JudgeResult {
  if (unlocked) {
    return {
      label: "準備OK",
      color: "bg-emerald-50 border-emerald-200 text-emerald-700",
      message: "防衛資金と先取貯金の基準を満たしています。",
    }
  }
  return {
    label: "まだ準備中",
    color: "bg-slate-50 border-slate-200 text-slate-700",
    message: "まずは生活防衛と貯金の土台づくりを優先しましょう。",
  }
}

function JudgeCard(props: {
  title: string
  value: string
  label: string
  message: string
  color: string
}) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${props.color}`}>
      <p className="text-sm opacity-80">{props.title}</p>
      <p className="mt-2 text-2xl font-bold">{props.value}</p>
      <p className="mt-2 text-sm font-semibold">{props.label}</p>
      <p className="mt-1 text-xs opacity-80">{props.message}</p>
    </div>
  )
}

export function JudgementCards({ summary }: { summary: SummaryLike }) {
  const deficit = getDeficitJudge(summary.deficitRate)
  const savings = getSavingsJudge(summary.savingsRate)
  const fixedCost = getFixedCostJudge(summary.fixedCostRate)
  const waste = getWasteJudge(summary.wasteRate)
  const efficiency = getSavingEfficiencyJudge(summary.savingEfficiencyRate)
  const goal = getSavingGoalJudge(summary.savingGoalAchievement)
  const emergency = getEmergencyFundJudge(summary.emergencyFundProgress)
  const planned = getPlannedSavingJudge(summary.plannedSavingProgress)
  const investment = getInvestmentJudge(summary.investmentUnlocked)

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-slate-900">判定カード</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <JudgeCard
          title="赤字率"
          value={percentText(summary.deficitRate)}
          label={deficit.label}
          message={deficit.message}
          color={deficit.color}
        />
        <JudgeCard
          title="貯金率"
          value={percentText(summary.savingsRate)}
          label={savings.label}
          message={savings.message}
          color={savings.color}
        />
        <JudgeCard
          title="固定費率"
          value={percentText(summary.fixedCostRate)}
          label={fixedCost.label}
          message={fixedCost.message}
          color={fixedCost.color}
        />
        <JudgeCard
          title="浪費率"
          value={percentText(summary.wasteRate)}
          label={waste.label}
          message={waste.message}
          color={waste.color}
        />
        <JudgeCard
          title="予算効率"
          value={percentText(summary.savingEfficiencyRate)}
          label={efficiency.label}
          message={efficiency.message}
          color={efficiency.color}
        />
        <JudgeCard
          title="予算目標達成度"
          value={percentText(summary.savingGoalAchievement)}
          label={goal.label}
          message={goal.message}
          color={goal.color}
        />
        <JudgeCard
          title="防衛資金進捗"
          value={percentText(summary.emergencyFundProgress)}
          label={emergency.label}
          message={emergency.message}
          color={emergency.color}
        />
        <JudgeCard
          title="先取貯金達成度"
          value={percentText(summary.plannedSavingProgress)}
          label={planned.label}
          message={planned.message}
          color={planned.color}
        />
        <JudgeCard
          title="投資準備ライン"
          value={investment.label}
          label={investment.label}
          message={investment.message}
          color={investment.color}
        />
      </div>
    </section>
  )
}
