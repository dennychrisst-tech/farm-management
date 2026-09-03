import { ImageResponse } from "next/og"

export const contentType = "image/png"

export function generateImageMetadata() {
  return [
    { id: "192", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "512", size: { width: 512, height: 512 }, contentType: "image/png" },
  ]
}

// Next's compiled wrapper (next-metadata-route-loader.js) calls this with
// `id` as its own Promise<string> prop -- separate from `params` -- not
// nested inside params. Awaiting the wrong thing silently produced the
// same 192px image for both sizes.
export default async function Icon({ id }: { id: Promise<string> }) {
  const resolvedId = await id
  const size = resolvedId === "512" ? 512 : 192
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
