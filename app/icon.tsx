import { ImageResponse } from "next/og"

export const contentType = "image/png"

export function generateImageMetadata() {
  return [
    { id: "192", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "512", size: { width: 512, height: 512 }, contentType: "image/png" },
  ]
}

export default function Icon({ id }: { id: string }) {
  const size = id === "512" ? 512 : 192
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: size * 0.55,
          background: "#16a34a",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        L
      </div>
    ),
    { width: size, height: size }
  )
}
