import type { FinanceState, Summary } from "@/types/finance"

function formatYen(value: number) {
  return `${new Intl.NumberFormat("ja-JP").format(Math.round(value))}円`
}

export async function exportReportPdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const printWindow = window.open("", "_blank", "noopener,noreferrer")
  if (!printWindow) return

  const styles = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n")
      } catch {
        return ""
      }
    })
    .join("\n")

  printWindow.document.write(`<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <title>${filename}</title>
    <style>
      body {
        margin: 24px;
        color: #0f172a;
        font-family: "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif;
      }
      ${styles}
    </style>
  </head>
  <body>${element.outerHTML}</body>
</html>`)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  printWindow.close()
}

export async function exportReportWord(params: {
  state: FinanceState
  summary: Summary
  periodLabel: string
  filename: string
}): Promise<void> {
  const { state, summary, periodLabel, filename } = params

  const totalRecords =
    state.incomes.length + state.expenses.length + state.savings.length

  const html = `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <title>家計レポート</title>
    <style>
      body {
        font-family: "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif;
        color: #0f172a;
        line-height: 1.7;
        margin: 32px;
      }
      h1, h2 { margin: 0 0 12px; }
      h1 { font-size: 24px; }
      h2 { font-size: 18px; margin-top: 28px; }
      table {
        border-collapse: collapse;
        width: 100%;
        margin-top: 12px;
      }
      th, td {
        border: 1px solid #cbd5e1;
        padding: 8px 10px;
        text-align: left;
      }
      th {
        background: #f8fafc;
      }
      .muted { color: #475569; }
    </style>
  </head>
  <body>
    <h1>家計レポート</h1>
    <p class="muted">${periodLabel}</p>

    <h2>サマリー</h2>
    <table>
      <tr><th>項目</th><th>内容</th></tr>
      <tr><td>収入合計</td><td>${formatYen(summary.totalIncome)}</td></tr>
      <tr><td>支出合計</td><td>${formatYen(summary.totalExpense)}</td></tr>
      <tr><td>貯金合計</td><td>${formatYen(summary.totalSaving)}</td></tr>
      <tr><td>収支</td><td>${formatYen(summary.balance)}</td></tr>
      <tr><td>赤字率</td><td>${Math.round(summary.deficitRate * 100)}%</td></tr>
      <tr><td>貯金率</td><td>${Math.round(summary.savingsRate * 100)}%</td></tr>
      <tr><td>固定費率</td><td>${Math.round(summary.fixedCostRate * 100)}%</td></tr>
      <tr><td>浪費率</td><td>${Math.round(summary.wasteRate * 100)}%</td></tr>
      <tr><td>防衛資金進捗</td><td>${Math.round(summary.emergencyFundProgress * 100)}%</td></tr>
      <tr><td>先取貯金達成度</td><td>${Math.round(summary.plannedSavingProgress * 100)}%</td></tr>
    </table>

    <h2>記録状況</h2>
    <table>
      <tr><th>項目</th><th>件数</th></tr>
      <tr><td>収入</td><td>${state.incomes.length}件</td></tr>
      <tr><td>支出</td><td>${state.expenses.length}件</td></tr>
      <tr><td>貯金</td><td>${state.savings.length}件</td></tr>
      <tr><td>合計</td><td>${totalRecords}件</td></tr>
    </table>
  </body>
</html>`

  const safeFilename = filename.replace(/\.docx$/i, ".doc")
  const blob = new Blob([html], { type: "application/msword" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = safeFilename
  link.click()
  URL.revokeObjectURL(url)
}
