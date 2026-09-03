"use client"

import { useRef } from "react"
import { Camera, X } from "lucide-react"

import { Button } from "@/components/ui/button"

export function PhotoUploader({
  files,
  onChange,
}: {
  files: File[]
  onChange: (files: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    onChange([...files, ...selected])
    e.target.value = ""
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index))
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
      >
        <Camera className="size-4" />
        Tambah Foto ({files.length})
      </Button>
      {files.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {files.map((file, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-md border">
              <img
                src={URL.createObjectURL(file)}
                alt={`Foto ${i + 1}`}
                className="h-full w-full object-cover"
              />
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
