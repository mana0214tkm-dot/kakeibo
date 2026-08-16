"use client"

type CriteriaRow = {
  range: string
  label: string
}

function CriteriaTable(props: {
  title: string
  formula: string
  rows: CriteriaRow[]
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">{props.title}</h3>
      <p className="mt-1 text-sm text-slate-500">{props.formula}</p>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <div className="grid grid-cols-2 bg-slate-50 text-sm font-bold text-slate-700">
          <div className="border-b border-slate-200 px-3 py-2">基準</div>
          <div className="border-b border-slate-200 px-3 py-2">判定</div>
        </div>

        {props.rows.map((row) => (
          <div
            key={`${props.title}-${row.range}-${row.label}`}
            className="grid grid-cols-2 text-sm text-slate-700"
          >
            <div className="border-b border-slate-200 px-3 py-2">{row.range}</div>
            <div className="border-b border-slate-200 px-3 py-2">{row.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function JudgementCriteria() {
  return (
    <section className="rounded-3xl bg-slate-50 p-6">
      <h2 className="mb-4 text-xl font-bold text-slate-900">判定基準一覧</h2>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CriteriaTable
          title="赤字率"
          formula="(支出 - 収入) ÷ 収入"
          rows={[
            { range: "0%以下", label: "安全" },
            { range: "0%超 5%未満", label: "注意" },
            { range: "5%以上 10%未満", label: "警戒" },
            { range: "10%以上", label: "危険" },
          ]}
        />

        <CriteriaTable
          title="貯金率"
          formula="(収入 - 支出) ÷ 収入"
          rows={[
            { range: "0%未満", label: "赤字" },
            { range: "0%以上 10%未満", label: "控えめ" },
            { range: "10%以上 20%未満", label: "標準" },
            { range: "20%以上", label: "良好" },
          ]}
        />

        <CriteriaTable
          title="固定費率"
          formula="固定費 ÷ 収入"
          rows={[
            { range: "50%以上", label: "高い" },
            { range: "30%以上 50%未満", label: "標準" },
            { range: "30%未満", label: "軽め" },
          ]}
        />

        <CriteriaTable
          title="浪費率"
          formula="浪費支出 ÷ 支出"
          rows={[
            { range: "25%以上", label: "多い" },
            { range: "10%以上 25%未満", label: "注意" },
            { range: "10%未満", label: "良好" },
          ]}
        />

        <CriteriaTable
          title="予算効率"
          formula="(予算 - 支出) ÷ 予算"
          rows={[
            { range: "10%未満", label: "低め" },
            { range: "10%以上 20%未満", label: "標準" },
            { range: "20%以上", label: "良好" },
          ]}
        />

        <CriteriaTable
          title="予算目標達成度"
          formula="予算 ÷ 支出"
          rows={[
            { range: "100%", label: "達成" },
            { range: "80%以上 100%未満", label: "あと少し" },
            { range: "80%未満", label: "見直し中" },
          ]}
        />

        <CriteriaTable
          title="防衛資金進捗"
          formula="総貯金 ÷ (最低生活費 × 目標月数)"
          rows={[
            { range: "100%", label: "達成" },
            { range: "50%以上 100%未満", label: "積み上げ中" },
            { range: "50%未満", label: "優先したい" },
          ]}
        />

        <CriteriaTable
          title="先取貯金達成度"
          formula="先取貯金額 ÷ 目標額"
          rows={[
            { range: "100%", label: "達成" },
            { range: "80%以上 100%未満", label: "順調" },
            { range: "80%未満", label: "調整中" },
          ]}
        />

        <CriteriaTable
          title="投資準備ライン"
          formula="防衛資金進捗 50%以上 かつ 先取貯金達成度 80%以上"
          rows={[
            { range: "両方クリア", label: "準備OK" },
            { range: "どちらか不足", label: "まだ準備中" },
          ]}
        />
      </div>
    </section>
  )
}
