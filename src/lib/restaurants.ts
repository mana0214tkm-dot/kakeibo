export type RestaurantSource = "hotpepper" | "openstreetmap" | "mock"

export type RestaurantSuggestion = {
  id: string
  name: string
  genre: string
  budgetLabel: string
  averageBudget: string
  catchCopy: string
  address: string
  access: string
  url: string
  imageUrl: string
  open: string
  close: string
  source: RestaurantSource
}

export type RestaurantSuggestionsResponse = {
  amount: number
  area: string
  keyword: string
  budgetLabel: string
  source: RestaurantSource
  sourceNote: string
  shops: RestaurantSuggestion[]
}

type BudgetMasterItem = {
  code: string
  name: string
}

type AreaResolution =
  | { kind: "small_area" | "middle_area" | "large_area"; code: string; name: string }
  | null

const HOTPEPPER_BASE_URL = "http://webservice.recruit.co.jp/hotpepper"

const mockRestaurants: Array<
  RestaurantSuggestion & {
    minBudget: number
    maxBudget: number
    areaTags: string[]
    keywordTags: string[]
  }
> = [
  {
    id: "mock-1",
    name: "さくっと天ぷらスタンド",
    genre: "和食",
    budgetLabel: "1,000円台",
    averageBudget: "1,200円前後",
    catchCopy: "軽く食べたい日にちょうどいい揚げたて天ぷら。",
    address: "新宿駅から徒歩4分",
    access: "西口地下通路からすぐ",
    url: "",
    imageUrl: "",
    open: "11:30-22:30",
    close: "不定休",
    source: "mock",
    minBudget: 800,
    maxBudget: 1800,
    areaTags: ["新宿", "東京"],
    keywordTags: ["和食", "天ぷら", "定食"],
  },
  {
    id: "mock-2",
    name: "炉端と小鉢の台所",
    genre: "居酒屋",
    budgetLabel: "2,000-3,000円",
    averageBudget: "2,800円前後",
    catchCopy: "予算を抑えつつ満足感のある居酒屋ごはん。",
    address: "渋谷駅から徒歩6分",
    access: "宮益坂エリア",
    url: "",
    imageUrl: "",
    open: "17:00-23:30",
    close: "日曜",
    source: "mock",
    minBudget: 1800,
    maxBudget: 3200,
    areaTags: ["渋谷", "東京"],
    keywordTags: ["居酒屋", "和食", "飲み"],
  },
  {
    id: "mock-3",
    name: "グリル&パスタ ブルック",
    genre: "イタリアン",
    budgetLabel: "3,000-4,000円",
    averageBudget: "3,500円前後",
    catchCopy: "デートにも使いやすいカジュアルイタリアン。",
    address: "池袋駅から徒歩5分",
    access: "東口エリア",
    url: "",
    imageUrl: "",
    open: "11:00-22:00",
    close: "なし",
    source: "mock",
    minBudget: 2800,
    maxBudget: 4200,
    areaTags: ["池袋", "東京"],
    keywordTags: ["イタリアン", "パスタ", "ワイン"],
  },
  {
    id: "mock-4",
    name: "焼肉 翠火",
    genre: "焼肉・ホルモン",
    budgetLabel: "4,000-6,000円",
    averageBudget: "4,800円前後",
    catchCopy: "少し余裕がある日に行きたいご褒美焼肉。",
    address: "横浜駅から徒歩7分",
    access: "西口エリア",
    url: "",
    imageUrl: "",
    open: "17:00-23:00",
    close: "月曜",
    source: "mock",
    minBudget: 3800,
    maxBudget: 6200,
    areaTags: ["横浜", "神奈川"],
    keywordTags: ["焼肉", "肉", "ホルモン"],
  },
  {
    id: "mock-5",
    name: "鮨と季節料理 みなと",
    genre: "寿司",
    budgetLabel: "6,000-8,000円",
    averageBudget: "6,800円前後",
    catchCopy: "しっかり予算を取った日に選びたい落ち着いた一軒。",
    address: "銀座駅から徒歩5分",
    access: "中央通り近く",
    url: "",
    imageUrl: "",
    open: "17:30-22:30",
    close: "日曜・祝日",
    source: "mock",
    minBudget: 5800,
    maxBudget: 8200,
    areaTags: ["銀座", "東京"],
    keywordTags: ["寿司", "和食", "接待"],
  },
  {
    id: "mock-6",
    name: "スパイス食堂 37",
    genre: "アジア・エスニック料理",
    budgetLabel: "1,500-2,500円",
    averageBudget: "2,100円前後",
    catchCopy: "ひとりでも入りやすい、満足度の高いスパイス料理。",
    address: "下北沢駅から徒歩3分",
    access: "南西口すぐ",
    url: "",
    imageUrl: "",
    open: "11:30-21:30",
    close: "火曜",
    source: "mock",
    minBudget: 1400,
    maxBudget: 2600,
    areaTags: ["下北沢", "東京"],
    keywordTags: ["カレー", "エスニック", "アジア"],
  },
]

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (Array.isArray(value)) return value
  return value ? [value] : []
}

function normalizeAmount(amount: number) {
  if (!Number.isFinite(amount)) return 3000
  return Math.min(30000, Math.max(500, Math.round(amount)))
}

function parseBudgetRange(label: string) {
  const numbers = Array.from(label.matchAll(/\d+/g)).map((match) => Number(match[0]))

  if (numbers.length === 0) {
    return { min: 0, max: Number.POSITIVE_INFINITY }
  }

  if (numbers.length === 1) {
    return { min: 0, max: numbers[0] }
  }

  return {
    min: Math.min(numbers[0], numbers[1]),
    max: Math.max(numbers[0], numbers[1]),
  }
}

function pickBudgetCode(budgets: BudgetMasterItem[], amount: number) {
  const normalized = normalizeAmount(amount)
  const expanded = budgets.map((item) => ({
    ...item,
    ...parseBudgetRange(item.name),
  }))

  const exact = expanded.find(
    (item) => normalized >= item.min && normalized <= item.max
  )

  if (exact) return exact

  const nextBest = [...expanded]
    .filter((item) => item.max >= normalized)
    .sort((a, b) => a.max - b.max)[0]

  return nextBest ?? expanded.sort((a, b) => b.max - a.max)[0]
}

function buildMockBudgetLabel(amount: number) {
  const normalized = normalizeAmount(amount)
  if (normalized <= 1500) return "~1,500円"
  if (normalized <= 3000) return "1,500-3,000円"
  if (normalized <= 5000) return "3,000-5,000円"
  if (normalized <= 8000) return "5,000-8,000円"
  return "8,000円以上"
}

function stripMockMeta(
  shop: RestaurantSuggestion & {
    minBudget: number
    maxBudget: number
    areaTags: string[]
    keywordTags: string[]
  }
): RestaurantSuggestion {
  return {
    id: shop.id,
    name: shop.name,
    genre: shop.genre,
    budgetLabel: shop.budgetLabel,
    averageBudget: shop.averageBudget,
    catchCopy: shop.catchCopy,
    address: shop.address,
    access: shop.access,
    url: shop.url,
    imageUrl: shop.imageUrl,
    open: shop.open,
    close: shop.close,
    source: shop.source,
  }
}

export function getMockRestaurantSuggestions(params: {
  amount: number
  area: string
  keyword: string
  count?: number
}): RestaurantSuggestionsResponse {
  const amount = normalizeAmount(params.amount)
  const area = params.area.trim()
  const keyword = params.keyword.trim()
  const count = Math.min(8, Math.max(1, params.count ?? 4))

  const filtered = mockRestaurants
    .filter((shop) => amount >= shop.minBudget && amount <= shop.maxBudget)
    .filter((shop) => {
      if (!area) return true
      return shop.areaTags.some((tag) => tag.includes(area) || area.includes(tag))
    })
    .filter((shop) => {
      if (!keyword) return true
      return shop.keywordTags.some(
        (tag) => tag.includes(keyword) || keyword.includes(tag)
      )
    })

  const fallback = filtered.length > 0 ? filtered : mockRestaurants

  return {
    amount,
    area,
    keyword,
    budgetLabel: buildMockBudgetLabel(amount),
    source: "mock",
    sourceNote:
      "Hot Pepper APIキーが未設定、または取得失敗だったためサンプル候補を表示しています。",
    shops: fallback.slice(0, count).map(stripMockMeta),
  }
}

async function fetchHotPepperJson<T>(path: string, searchParams: URLSearchParams) {
  const response = await fetch(`${HOTPEPPER_BASE_URL}${path}?${searchParams.toString()}`, {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`HotPepper request failed: ${response.status}`)
  }

  return (await response.json()) as T
}

export async function getOpenStreetMapRestaurantSuggestions(params: {
  amount: number
  area: string
  keyword: string
  count?: number
}): Promise<RestaurantSuggestionsResponse> {
  const amount = normalizeAmount(params.amount)
  const area = params.area.trim()
  const keyword = params.keyword.trim()
  const count = Math.min(8, Math.max(1, params.count ?? 4))
  const areaSearchParams = new URLSearchParams({
    q: area || "東京",
    format: "jsonv2",
    countrycodes: "jp",
    limit: "1",
    "accept-language": "ja",
  })
  const areaResponse = await fetch(
    `https://nominatim.openstreetmap.org/search?${areaSearchParams.toString()}`,
    {
      cache: "no-store",
      headers: { "User-Agent": "kakeibo-restaurant-search/1.0" },
    }
  )

  if (!areaResponse.ok) {
    throw new Error(`OpenStreetMap area request failed: ${areaResponse.status}`)
  }

  const areaResults = (await areaResponse.json()) as Array<{
    lat?: string
    lon?: string
  }>
  const areaResult = areaResults[0]
  if (!areaResult?.lat || !areaResult.lon) {
    throw new Error("No Japanese area search results")
  }

  const overpassQuery = `
[out:json][timeout:20];
(
  nwr(around:5000,${areaResult.lat},${areaResult.lon})[amenity~"restaurant|cafe|pub|bar|fast_food"];
);
out center tags;
`
  const restaurantResponse = await fetch(
    `https://overpass-api.de/api/interpreter?${new URLSearchParams({ data: overpassQuery }).toString()}`,
    {
      cache: "no-store",
      headers: { "User-Agent": "kakeibo-restaurant-search/1.0" },
    }
  )

  if (!restaurantResponse.ok) {
    throw new Error(`OpenStreetMap restaurant request failed: ${restaurantResponse.status}`)
  }

  const results = (await restaurantResponse.json()) as {
    elements?: Array<{
      type?: string
      id?: number
      lat?: number
      lon?: number
      center?: { lat?: number; lon?: number }
      tags?: Record<string, string>
    }>
  }
  const elements = (results.elements ?? []).filter(
    (place) => typeof place.id === "number" && place.tags?.name
  )
  const keywordMatches = keyword
    ? elements.filter((place) => {
        const searchable = [
          place.tags?.name,
          place.tags?.cuisine,
          place.tags?.amenity,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        return searchable.includes(keyword.toLowerCase())
      })
    : elements
  const selectedElements = (keywordMatches.length > 0 ? keywordMatches : elements).slice(
    0,
    count
  )
  const shops = selectedElements.map<RestaurantSuggestion>((place) => {
    const tags = place.tags ?? {}
    const latitude = place.lat ?? place.center?.lat
    const longitude = place.lon ?? place.center?.lon
    const address =
      tags["addr:full"] ||
      [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ") ||
      `${area || "指定エリア"}周辺`

    return {
      id: `osm-${place.type}-${place.id}`,
      name: tags.name ?? "店舗",
      genre: tags.cuisine || tags.amenity || "飲食店",
      budgetLabel: buildMockBudgetLabel(amount),
      averageBudget: "予算は店舗ページでご確認ください",
      catchCopy: "OpenStreetMapの検索結果です。",
      address,
      access: "",
      url:
        latitude !== undefined && longitude !== undefined
          ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`
          : "",
      imageUrl: "",
      open: tags.opening_hours ?? "",
      close: "",
      source: "openstreetmap",
    }
  })

  if (shops.length === 0) {
    throw new Error("No restaurant search results")
  }

  return {
    amount,
    area,
    keyword,
    budgetLabel: buildMockBudgetLabel(amount),
    source: "openstreetmap",
    sourceNote:
      keywordMatches.length > 0
        ? "指定エリア周辺のOpenStreetMap検索結果です。予算は目安のため、店舗ページで詳細をご確認ください。"
        : "指定エリア周辺の飲食店検索結果です。ジャンル情報がない店舗も含まれます。予算は目安のため、店舗ページで詳細をご確認ください。",
    shops,
  }
}

async function fetchBudgetMaster(apiKey: string) {
  const searchParams = new URLSearchParams({
    key: apiKey,
    format: "json",
  })

  const data = await fetchHotPepperJson<{
    results?: { budget?: BudgetMasterItem[] | BudgetMasterItem }
  }>("/budget/v1/", searchParams)

  return toArray(data.results?.budget).filter(
    (item): item is BudgetMasterItem =>
      typeof item?.code === "string" && typeof item?.name === "string"
  )
}

async function resolveArea(apiKey: string, area: string): Promise<AreaResolution> {
  const trimmed = area.trim()
  if (!trimmed) return null

  const configs = [
    { path: "/small_area/v1/", field: "small_area", kind: "small_area" as const },
    { path: "/middle_area/v1/", field: "middle_area", kind: "middle_area" as const },
    { path: "/large_area/v1/", field: "large_area", kind: "large_area" as const },
  ]

  for (const config of configs) {
    const searchParams = new URLSearchParams({
      key: apiKey,
      format: "json",
      keyword: trimmed,
      count: "1",
    })

    const data = await fetchHotPepperJson<
      Record<string, { [key: string]: unknown } | undefined> & {
        results?: Record<string, unknown>
      }
    >(config.path, searchParams)

    const rawItems = toArray(
      (data.results?.[config.field] as
        | { code?: string; name?: string }
        | Array<{ code?: string; name?: string }>
        | undefined)
    )

    const item = rawItems.find(
      (candidate): candidate is { code: string; name: string } =>
        typeof candidate?.code === "string" && typeof candidate?.name === "string"
    )

    if (item) {
      return {
        kind: config.kind,
        code: item.code,
        name: item.name,
      }
    }
  }

  return null
}

export async function getHotPepperRestaurantSuggestions(params: {
  apiKey: string
  amount: number
  area: string
  keyword: string
  count?: number
}): Promise<RestaurantSuggestionsResponse | null> {
  const amount = normalizeAmount(params.amount)
  const area = params.area.trim()
  const keyword = params.keyword.trim()
  const count = Math.min(8, Math.max(1, params.count ?? 4))

  const budgets = await fetchBudgetMaster(params.apiKey)
  const selectedBudget = pickBudgetCode(budgets, amount)

  if (!selectedBudget) {
    return null
  }

  const areaMatch = await resolveArea(params.apiKey, area)

  const searchParams = new URLSearchParams({
    key: params.apiKey,
    format: "json",
    order: "4",
    count: String(count),
    budget: selectedBudget.code,
  })

  if (keyword) {
    searchParams.set("keyword", keyword)
  }

  if (areaMatch) {
    searchParams.set(areaMatch.kind, areaMatch.code)
  } else if (area) {
    const keywordValue = keyword ? `${area} ${keyword}` : area
    searchParams.set("keyword", keywordValue)
  }

  const data = await fetchHotPepperJson<{
    results?: {
      shop?:
        | Array<{
            id?: string
            name?: string
            address?: string
            access?: string
            catch?: string
            open?: string
            close?: string
            genre?: { name?: string }
            budget?: { name?: string; average?: string }
            urls?: { pc?: string }
            photo?: { pc?: { l?: string; m?: string; s?: string } }
          }>
        | {
            id?: string
            name?: string
            address?: string
            access?: string
            catch?: string
            open?: string
            close?: string
            genre?: { name?: string }
            budget?: { name?: string; average?: string }
            urls?: { pc?: string }
            photo?: { pc?: { l?: string; m?: string; s?: string } }
          }
    }
  }>("/gourmet/v1/", searchParams)

  const shops = toArray(data.results?.shop)
    .filter((shop) => typeof shop?.id === "string" && typeof shop?.name === "string")
    .map<RestaurantSuggestion>((shop) => ({
      id: shop.id as string,
      name: shop.name as string,
      genre: shop.genre?.name ?? "レストラン",
      budgetLabel: shop.budget?.name ?? selectedBudget.name,
      averageBudget: shop.budget?.average ?? selectedBudget.name,
      catchCopy: shop.catch ?? "",
      address: shop.address ?? "",
      access: shop.access ?? "",
      url: shop.urls?.pc ?? "",
      imageUrl: shop.photo?.pc?.l ?? shop.photo?.pc?.m ?? shop.photo?.pc?.s ?? "",
      open: shop.open ?? "",
      close: shop.close ?? "",
      source: "hotpepper",
    }))

  if (shops.length === 0) {
    return null
  }

  return {
    amount,
    area: areaMatch?.name ?? area,
    keyword,
    budgetLabel: selectedBudget.name,
    source: "hotpepper",
    sourceNote: "Hot Pepper グルメサーチAPIから条件に近い候補を取得しました。",
    shops,
  }
}
