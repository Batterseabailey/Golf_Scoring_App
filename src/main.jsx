import "./storageShim.js"; // MUST stay first: sets up window.storage, which loads and saves every event
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { registerSW } from "virtual:pwa-register";

// Getting a new deploy onto the screen at the FIRST refresh:
// 1. onNeedRefresh: a new version has downloaded and is waiting. Tell it
//    to take over immediately rather than wait for every tab to close.
// 2. controllerchange: the moment it has taken over, reload once so the
//    page on screen is the new version.
// 3. Check for a new version on load, every 10 minutes, and whenever the
//    app comes back to the front, which matters on phones where the app
//    stays open in the background for days.
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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
