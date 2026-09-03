"use client"

import { useRef, useState } from "react"
import { Camera, X, MapPin, MapPinOff } from "lucide-react"

import { Button } from "@/components/ui/button"

export type PhotoItem = {
  file: File
  latitude: number | null
  longitude: number | null
  capturedAt: string
}

function getLocation(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    )
  })
}

export function PhotoUploader({
  photos,
  onChange,
}: {
  photos: PhotoItem[]
  onChange: (photos: PhotoItem[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [locating, setLocating] = useState(false)

  async function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    e.target.value = ""
    if (selected.length === 0) return

    setLocating(true)
    const position = await getLocation()
    setLocating(false)

    const capturedAt = new Date().toISOString()
    const newItems: PhotoItem[] = selected.map((file) => ({
      file,
      latitude: position?.coords.latitude ?? null,
      longitude: position?.coords.longitude ?? null,
      capturedAt,
    }))
    onChange([...photos, ...newItems])
  }

  function removeAt(index: number) {
    onChange(photos.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={handleSelect}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => inputRef.current?.click()}
        disabled={locating}
      >
        <Camera className="size-4" />
        {locating ? "Mengambil lokasi..." : `Tambah Foto (${photos.length})`}
      </Button>
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((item, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-md border">
              <img
                src={URL.createObjectURL(item.file)}
                alt={`Foto ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-black/60 px-1 py-0.5 text-[10px] text-white">
                {item.latitude !== null ? (
                  <MapPin className="size-2.5 shrink-0" />
                ) : (
                  <MapPinOff className="size-2.5 shrink-0" />
                )}
                <span className="truncate">
                  {new Date(item.capturedAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {item.latitude !== null &&
                    ` · ${item.latitude.toFixed(4)},${item.longitude!.toFixed(4)}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                aria-label="Hapus foto"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
