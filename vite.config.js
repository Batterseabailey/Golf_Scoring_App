import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "Lucifer Golfing Society",
        short_name: "Lucifer Score",
        description: "Live golf scoring, draw, and leaderboard",
        theme_color: "#1F2A37",
        background_color: "#F1EFE3",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Only precache the built app shell — never cache API calls to our
        // own storage function, so scores/draws/rules always come in fresh
        // rather than serving stale cached data.
        navigateFallbackDenylist: [/^\/\.netlify\/functions\//],
        runtimeCaching: [
          {
            urlPattern: /^\/\.netlify\/functions\//,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
});
