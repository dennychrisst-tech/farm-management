import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LayerFarm",
    short_name: "LayerFarm",
    description: "Digital farm manager for layer-chicken operations",
    start_url: "/home",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#16a34a",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
    ],
  }
}
