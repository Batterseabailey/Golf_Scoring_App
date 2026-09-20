import "./storageShim.js"; // MUST stay first: sets up window.storage, which loads and saves every event
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { registerSW } from "virtual:pwa-register";

// ---- Normal updating ----
// A new deploy downloads in the background, takes over, and the page
// reloads once to show it.
let reloaded = false;
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  },
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    const check = () => registration.update().catch(() => {});
    check();
    setInterval(check, 10 * 60 * 1000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") check();
    });
  },
});
navigator.serviceWorker?.addEventListener("controllerchange", () => {
  if (reloaded) return;
  reloaded = true;
  window.location.reload();
});

// ---- Safety net: never stay stuck on an old version ----
// Asks Netlify directly (deliberately bypassing this device's saved copy)
// which app file the LATEST deploy uses, and compares it with the one
// running now. If they differ and the normal updater above hasn't sorted
// it out within 20 seconds, the saved copy is thrown away and the page
// reloaded from scratch. A timestamp stops it ever looping.
const runningBundle = () =>
  [...document.scripts].map((s) => s.src).find((src) => /\/assets\/[^"/]+\.js$/.test(src)) || "";

async function latestBundle() {
  const res = await fetch(`/index.html?fresh=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) return "";
  const match = (await res.text()).match(/src="(\/assets\/[^"]+\.js)"/);
  return match ? match[1] : "";
}

let staleCheckRunning = false;
async function healIfStale() {
  if (staleCheckRunning || !runningBundle()) return; // nothing to compare in local development
  staleCheckRunning = true;
  try {
    const isStale = async () => {
      const latest = await latestBundle();
      return Boolean(latest) && !runningBundle().endsWith(latest);
    };
    if (!(await isStale())) return;
    await new Promise((r) => setTimeout(r, 20000)); // give the normal updater its chance
    if (!(await isStale())) return;
    const last = Number(sessionStorage.getItem("forced-refresh-at") || 0);
    if (Date.now() - last < 2 * 60 * 1000) return; // already tried a moment ago
    sessionStorage.setItem("forced-refresh-at", String(Date.now()));
    const registrations = (await navigator.serviceWorker?.getRegistrations?.()) || [];
    await Promise.all(registrations.map((r) => r.unregister()));
    if (window.caches) await Promise.all((await caches.keys()).map((k) => caches.delete(k)));
    window.location.reload();
  } catch {
    // offline or blocked: try again next time
  } finally {
    staleCheckRunning = false;
  }
}
setTimeout(healIfStale, 5000);
setInterval(healIfStale, 10 * 60 * 1000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") healIfStale();
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
