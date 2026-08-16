"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type LeafletLatLng = {
  lat: number
  lng: number
}

type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker
  bindPopup: (content: string) => LeafletMarker
  setLatLng: (latlng: LeafletLatLng) => LeafletMarker
}

type LeafletMap = {
  setView: (latlng: LeafletLatLng, zoom: number) => LeafletMap
  remove: () => void
}

type LeafletGlobal = {
  map: (
    element: HTMLElement,
    options: {
      zoomControl: boolean
      scrollWheelZoom: boolean
    }
  ) => LeafletMap
  tileLayer: (
    urlTemplate: string,
    options: {
      attribution: string
      maxZoom: number
    }
  ) => {
    addTo: (map: LeafletMap) => void
  }
  marker: (latlng: LeafletLatLng) => LeafletMarker
}

declare global {
  interface Window {
    __leafletPromise?: Promise<LeafletGlobal>
    L?: LeafletGlobal
  }
}

type RestaurantMapPanelProps = {
  name: string
  address: string
}

type GeocodeResult = {
  lat: string
  lon: string
}

function buildMapQuery(name: string, address: string) {
  return [name, address].filter(Boolean).join(" ")
}

function buildMapOpenUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function ensureLeafletStyles() {
  const existing = document.querySelector<HTMLLinkElement>(
    'link[data-leaflet-style="true"]'
  )

  if (existing) {
    return
  }

  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
  link.crossOrigin = ""
  link.dataset.leafletStyle = "true"
  document.head.appendChild(link)
}

function loadLeaflet(): Promise<LeafletGlobal> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window is not available"))
  }

  if (window.L) {
    return Promise.resolve(window.L)
  }

  if (window.__leafletPromise) {
    return window.__leafletPromise
  }

  ensureLeafletStyles()

  window.__leafletPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-leaflet-script="true"]'
    )

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.L) {
          resolve(window.L)
          return
        }

        reject(new Error("Leaflet loaded without global L"))
      })
      existingScript.addEventListener("error", () => {
        reject(new Error("Failed to load Leaflet"))
      })
      return
    }

    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    script.crossOrigin = ""
    script.defer = true
    script.dataset.leafletScript = "true"
    script.onload = () => {
      if (window.L) {
        resolve(window.L)
        return
      }

      reject(new Error("Leaflet loaded without global L"))
    }
    script.onerror = () => {
      reject(new Error("Failed to load Leaflet"))
    }
    document.head.appendChild(script)
  })

  return window.__leafletPromise
}

async function geocodeAddress(query: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("q", query)
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("limit", "1")
  url.searchParams.set("countrycodes", "jp")
  url.searchParams.set("accept-language", "ja")

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.status}`)
  }

  const results = (await response.json()) as GeocodeResult[]
  const first = results[0]

  if (!first) {
    throw new Error("No geocoding result")
  }

  return {
    lat: Number(first.lat),
    lng: Number(first.lon),
  }
}

export function RestaurantMapPanel(props: RestaurantMapPanelProps) {
  const mapHostRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")

  const query = useMemo(
    () => buildMapQuery(props.name, props.address),
    [props.address, props.name]
  )
  const mapOpenUrl = useMemo(() => buildMapOpenUrl(query), [query])

  useEffect(() => {
    let cancelled = false

    async function renderMap() {
      try {
        const [leaflet, location] = await Promise.all([
          loadLeaflet(),
          geocodeAddress(query),
        ])

        if (cancelled || !mapHostRef.current) {
          return
        }

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = leaflet.map(mapHostRef.current, {
            zoomControl: true,
            scrollWheelZoom: true,
          })

          leaflet
            .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution: "&copy; OpenStreetMap contributors",
              maxZoom: 19,
            })
            .addTo(mapInstanceRef.current)
        }

        mapInstanceRef.current.setView(location, 16)

        if (!markerRef.current) {
          markerRef.current = leaflet.marker(location).addTo(mapInstanceRef.current)
        } else {
          markerRef.current.setLatLng(location)
        }

        markerRef.current.bindPopup(props.name)
        setStatus("ready")
      } catch (error) {
        console.error(error)
        if (!cancelled) {
          setStatus("error")
        }
      }
    }

    void renderMap()

    return () => {
      cancelled = true
    }
  }, [props.name, query])

  useEffect(() => {
    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, [])

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-sm">
      <div ref={mapHostRef} className="h-[360px] w-full bg-slate-100" />

      {status !== "ready" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span>
            {status === "loading"
              ? "地図を読み込み中です。"
              : "地図を表示できなかったため、外部マップを開いてください。"}
          </span>

          <a
            href={mapOpenUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700"
          >
            Googleマップで開く
          </a>
        </div>
      ) : null}
    </div>
  )
}
