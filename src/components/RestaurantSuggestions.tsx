"use client"

import { useEffect, useMemo, useState } from "react"
import { RestaurantMapPanel } from "@/components/RestaurantMapPanel"
import { yen } from "@/lib/finance"
import type { RestaurantSuggestionsResponse } from "@/lib/restaurants"

const panelClass =
  "rounded-[1.5rem] border border-slate-200/80 bg-white/82 p-5 shadow-sm"
const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-teal-300 focus:outline-none focus:ring-4 focus:ring-teal-100"
const primaryButtonClass =
  "rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
const secondaryButtonClass =
  "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5"

function buildMapQuery(name: string, address: string) {
  return [name, address].filter(Boolean).join(" ")
}

function buildMapOpenUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

type RestaurantSuggestionsProps = {
  defaultAmount: number
}

export function RestaurantSuggestions(props: RestaurantSuggestionsProps) {
  const [amount, setAmount] = useState(String(props.defaultAmount))
  const [area, setArea] = useState("新宿")
  const [keyword, setKeyword] = useState("居酒屋")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<RestaurantSuggestionsResponse | null>(null)
  const [selectedShopId, setSelectedShopId] = useState("")

  async function loadRestaurants() {
    setLoading(true)
    setError("")

    try {
      const searchParams = new URLSearchParams({
        amount,
        area,
        keyword,
        count: "4",
      })

      const response = await fetch(`/api/restaurants?${searchParams.toString()}`, {
        cache: "no-store",
      })

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string }
        throw new Error(errorData.error || `request failed: ${response.status}`)
      }

      const data = (await response.json()) as RestaurantSuggestionsResponse
      setResult(data)
      setSelectedShopId(data.shops[0]?.id ?? "")
    } catch (fetchError) {
      console.error(fetchError)
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "お店候補の取得に失敗しました。"
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRestaurants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setAmount(String(props.defaultAmount))
  }, [props.defaultAmount])

  useEffect(() => {
    if (!result || result.shops.length === 0) return
    if (result.shops.some((shop) => shop.id === selectedShopId)) return
    setSelectedShopId(result.shops[0].id)
  }, [result, selectedShopId])

  const selectedShop = useMemo(() => {
    if (!result || result.shops.length === 0) return null
    return result.shops.find((shop) => shop.id === selectedShopId) ?? result.shops[0]
  }, [result, selectedShopId])

  const selectedShopMapQuery = selectedShop
    ? buildMapQuery(selectedShop.name, selectedShop.address)
    : ""
  const selectedShopMapOpenUrl = selectedShop
    ? buildMapOpenUrl(selectedShopMapQuery)
    : ""

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            金額から行けるお店
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            1人あたりの予算でお店候補を探して、そのまま地図で場所も確認できます。
            Google PlacesまたはHot Pepper グルメの検索結果を表示します。
          </p>
        </div>

        <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
          予算の目安: {yen(Number(amount) || 0)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-600">1人予算</span>
          <input
            type="number"
            min="500"
            step="100"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-600">エリア・駅</span>
          <input
            type="text"
            value={area}
            onChange={(event) => setArea(event.target.value)}
            className={inputClass}
            placeholder="新宿"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-600">ジャンル</span>
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className={inputClass}
            placeholder="居酒屋"
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            className={`${primaryButtonClass} w-full`}
            onClick={() => void loadRestaurants()}
            disabled={loading}
          >
            {loading ? "探しています..." : "お店を探す"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 rounded-[1.5rem] border border-slate-200/80 bg-white/78 px-5 py-4 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
            <p>
              {result.area || "全国"} / {result.budgetLabel}
              {result.keyword ? ` / ${result.keyword}` : ""}
            </p>
            <p className="font-medium text-slate-500">{result.sourceNote}</p>
          </div>

          {selectedShop ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <RestaurantMapPanel
                name={selectedShop.name}
                address={selectedShop.address}
              />

              <div className={`${panelClass} flex flex-col justify-between`}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      {selectedShop.budgetLabel}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      {selectedShop.genre}
                    </span>
                  </div>

                  <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
                    {selectedShop.name}
                  </h3>

                  {selectedShop.catchCopy ? (
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {selectedShop.catchCopy}
                    </p>
                  ) : null}

                  <div className="mt-5 space-y-2 text-sm text-slate-600">
                    <p>平均予算: {selectedShop.averageBudget || selectedShop.budgetLabel}</p>
                    {selectedShop.access ? <p>アクセス: {selectedShop.access}</p> : null}
                    {selectedShop.address ? <p>住所: {selectedShop.address}</p> : null}
                    {selectedShop.open ? <p>営業時間: {selectedShop.open}</p> : null}
                    {selectedShop.close ? <p>定休日: {selectedShop.close}</p> : null}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={selectedShopMapOpenUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={primaryButtonClass}
                  >
                    地図で開く
                  </a>
                  {selectedShop.url ? (
                    <a
                      href={selectedShop.url}
                      target="_blank"
                      rel="noreferrer"
                      className={secondaryButtonClass}
                    >
                      お店ページ
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {result.shops.map((shop) => {
              const mapQuery = buildMapQuery(shop.name, shop.address)
              const mapOpenUrl = buildMapOpenUrl(mapQuery)
              const isSelected = selectedShop?.id === shop.id

              return (
                <article
                  key={shop.id}
                  className={`${panelClass} ${isSelected ? "border-teal-300 ring-2 ring-teal-200" : ""}`}
                >
                  {shop.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={shop.imageUrl}
                      alt={shop.name}
                      className="h-44 w-full rounded-[1.25rem] object-cover"
                    />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center rounded-[1.25rem] bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.22),_transparent_52%),linear-gradient(135deg,_rgba(15,23,42,0.95),_rgba(30,41,59,0.85))] text-lg font-bold text-white">
                      {shop.genre}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      {shop.budgetLabel}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      {shop.genre}
                    </span>
                    {isSelected ? (
                      <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                        地図表示中
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-4 text-xl font-black tracking-tight text-slate-900">
                    {shop.name}
                  </h3>

                  {shop.catchCopy ? (
                    <p className="mt-2 text-sm leading-7 text-slate-600">{shop.catchCopy}</p>
                  ) : null}

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p>平均予算: {shop.averageBudget || shop.budgetLabel}</p>
                    {shop.access ? <p>アクセス: {shop.access}</p> : null}
                    {shop.address ? <p>住所: {shop.address}</p> : null}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className={primaryButtonClass}
                      onClick={() => setSelectedShopId(shop.id)}
                    >
                      マップ表示
                    </button>
                    <a
                      href={mapOpenUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={secondaryButtonClass}
                    >
                      外部マップで開く
                    </a>
                    {shop.url ? (
                      <a
                        href={shop.url}
                        target="_blank"
                        rel="noreferrer"
                        className={secondaryButtonClass}
                      >
                        お店を見る
                      </a>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      ) : null}
    </section>
  )
}
