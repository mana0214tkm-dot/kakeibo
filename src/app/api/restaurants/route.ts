import { NextRequest, NextResponse } from "next/server"
import {
  getGooglePlacesRestaurantSuggestions,
  getHotPepperRestaurantSuggestions,
} from "@/lib/restaurants"

function parseAmount(rawValue: string | null) {
  const value = Number(rawValue)
  if (!Number.isFinite(value)) return 3000
  return Math.min(30000, Math.max(500, Math.round(value)))
}

function parseCount(rawValue: string | null) {
  const value = Number(rawValue)
  if (!Number.isFinite(value)) return 4
  return Math.min(8, Math.max(1, Math.round(value)))
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const amount = parseAmount(searchParams.get("amount"))
  const area = searchParams.get("area")?.trim() ?? "新宿"
  const keyword = searchParams.get("keyword")?.trim() ?? "居酒屋"
  const count = parseCount(searchParams.get("count"))
  const googleApiKey =
    process.env.GOOGLE_PLACES_API_KEY ??
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const hotPepperApiKey =
    process.env.HOTPEPPER_API_KEY ??
    process.env.RECRUIT_API_KEY ??
    process.env.RESTAURANT_API_KEY

  if (!googleApiKey && !hotPepperApiKey) {
    return NextResponse.json(
      {
        error:
          "正確なお店検索にはGoogle Places APIまたはHot Pepper APIのキー設定が必要です。",
      },
      { status: 503 }
    )
  }

  try {
    if (googleApiKey) {
      const googleResult = await getGooglePlacesRestaurantSuggestions({
        apiKey: googleApiKey,
        amount,
        area,
        keyword,
        count,
      })

      if (googleResult) return NextResponse.json(googleResult)
    }

    if (!hotPepperApiKey) {
      return NextResponse.json(
        { error: "指定条件に合うGoogle Placesの店舗が見つかりませんでした。" },
        { status: 404 }
      )
    }

    const liveResult = await getHotPepperRestaurantSuggestions({
      apiKey: hotPepperApiKey,
      amount,
      area,
      keyword,
      count,
    })

    if (!liveResult) {
      return NextResponse.json(
        { error: "指定した予算・エリア・ジャンルに合うお店が見つかりませんでした。" },
        { status: 404 }
      )
    }

    return NextResponse.json(liveResult)
  } catch (error) {
    console.error("restaurant search failed", error)
    return NextResponse.json(
      { error: "お店検索APIに接続できませんでした。時間をおいて再度お試しください。" },
      { status: 502 }
    )
  }
}
