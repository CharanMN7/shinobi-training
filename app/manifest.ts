import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shinobi — Training",
    short_name: "Shinobi",
    description: "Private fitness tracker. Strength, body, running, mobility.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#0D0D0F",
    background_color: "#0D0D0F",
    scope: "/",
    categories: ["fitness", "health", "sports"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-256.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/dashboard.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
      },
    ],
  };
}
