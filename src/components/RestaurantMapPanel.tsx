"use client"

import { useEffect, useMemo, useRef, useState } from "react"

declare global {
  interface Window {
    __googleMapsPromise?: Promise<GoogleMapsGlobal | undefined>
    google?: {
      maps: {
        Geocoder: new () => {
          geocode: (
            request: { address: string },
            callback: (
              results: Array<{
                geometry: {
                  location: unknown
                }
              }> | null,
              status: string
            ) => void
          ) => void
        }
        Map: new (
          element: HTMLElement,
          options: {
            center: unknown
            zoom: number
            mapTypeControl: boolean
            fullscreenControl: boolean
            streetViewControl: boolean
          }
        ) => {
          setCenter: (location: unknown) => void
          setZoom: (zoom: number) => void
        }
        Marker: new (options: {
          map: unknown
          position: unknown
          title: string
        }) => {
          setMap: (map: unknown) => void
        }
      }
    }
  }
}

type GoogleMapsGlobal = NonNullable<Window["google"]>

type RestaurantMapPanelProps = {
  name: string
  address: string
}

function buildMapQuery(name: string, address: string) {
  return [name, address].filter(Boolean).join(" ")
}

function buildFallbackEmbedUrl(query: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`
}

function loadGoogleMapsApi(apiKey: string): Promise<GoogleMapsGlobal | undefined> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window is not available"))
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google)
  }

  if (window.__googleMapsPromise) {
    return window.__googleMapsPromise
  }

  window.__googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps-loader="true"]'
    )

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google))
      existingScript.addEventListener("error", () =>
        reject(new Error("Failed to load Google Maps script"))
      )
      return
    }

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`
    script.async = true
    script.defer = true
    script.dataset.googleMapsLoader = "true"
    script.onload = () => resolve(window.google)
    script.onerror = () =>
      reject(new Error("Failed to load Google Maps script"))
    document.head.appendChild(script)
  })

  return window.__googleMapsPromise
}

export function RestaurantMapPanel(props: RestaurantMapPanelProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? ""
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<{
    setCenter: (location: unknown) => void
    setZoom: (zoom: number) => void
  } | null>(null)
  const markerRef = useRef<{
    setMap: (map: unknown) => void
  } | null>(null)
  const [mode, setMode] = useState<"loading" | "api" | "fallback">(
    apiKey ? "loading" : "fallback"
  )

  const query = useMemo(
    () => buildMapQuery(props.name, props.address),
    [props.address, props.name]
  )
  const fallbackEmbedUrl = useMemo(
    () => buildFallbackEmbedUrl(query),
    [query]
  )

  useEffect(() => {
    if (!apiKey) return

    if (!mapRef.current) {
      return
    }

    let cancelled = false

    async function initMap() {
      try {
        const google = await loadGoogleMapsApi(apiKey)

        if (cancelled || !mapRef.current || !google?.maps) {
          return
        }

        const geocoder = new google.maps.Geocoder()
        geocoder.geocode({ address: query }, (results, status) => {
          if (cancelled || !mapRef.current || !google?.maps) {
            return
          }

          const firstResult = results?.[0]
          if (status !== "OK" || !firstResult) {
            setMode("fallback")
            return
          }

          const location = firstResult.geometry.location

          if (!mapInstanceRef.current) {
            mapInstanceRef.current = new google.maps.Map(mapRef.current, {
              center: location,
              zoom: 16,
              mapTypeControl: false,
              fullscreenControl: false,
              streetViewControl: false,
            })
          } else {
            mapInstanceRef.current.setCenter(location)
            mapInstanceRef.current.setZoom(16)
          }

          if (markerRef.current) {
            markerRef.current.setMap(null)
          }

          markerRef.current = new google.maps.Marker({
            map: mapInstanceRef.current,
            position: location,
            title: props.name,
          })

          setMode("api")
        })
      } catch (error) {
        console.error(error)
        setMode("fallback")
      }
    }

    void initMap()

    return () => {
      cancelled = true
    }
  }, [apiKey, props.name, query])

  if (mode === "fallback") {
    return (
      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-sm">
        <iframe
          title={`${props.name} map fallback`}
          src={fallbackEmbedUrl}
          className="h-[360px] w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-sm">
      <div ref={mapRef} className="h-[360px] w-full bg-slate-100" />
      {mode === "loading" ? (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Maps JavaScript API で地図を読み込み中です。
        </div>
      ) : null}
    </div>
  )
}
