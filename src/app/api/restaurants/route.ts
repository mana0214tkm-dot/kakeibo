import { NextRequest, NextResponse } from "next/server"
import {
  getHotPepperRestaurantSuggestions,
  getMockRestaurantSuggestions,
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
  const apiKey =
    process.env.HOTPEPPER_API_KEY ??
    process.env.RECRUIT_API_KEY ??
    process.env.RESTAURANT_API_KEY

  if (apiKey) {
    try {
      const liveResult = await getHotPepperRestaurantSuggestions({
        apiKey,
        amount,
        area,
        keyword,
        count,
      })

      if (liveResult) {
        return NextResponse.json(liveResult)
      }
    } catch (error) {
      console.error("restaurant api fallback", error)
    }
  }

  return NextResponse.json(
    getMockRestaurantSuggestions({
      amount,
      area,
      keyword,
      count,
    })
  )
}
