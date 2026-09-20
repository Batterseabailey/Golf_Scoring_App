import "./storageShim.js";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { registerSW } from "virtual:pwa-register";

// The default auto-injected registration script only calls
// navigator.serviceWorker.register(...) and nothing else — it has no
// logic to actually reload the page once a newly-deployed service
// worker takes over. So a new deploy would install correctly in the
// background, but the tab that's already open (and the next one or two
// reloads of it) would keep being served by the OLD service worker,
// which was still the one controlling that page — only a reload that
// happens to land after the handover would show the update. That's the
// "have to deploy/refresh two or three times" symptom.
//
// Registering through the virtual:pwa-register module instead gives us
// a controllerchange listener: the moment the new service worker
// actually takes control, we force exactly one reload right then, so
// the very next paint shows the new deploy — not the third or fourth.
let reloaded = false;
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    // Ask immediately, then keep checking — covers both "a new version
    // was already waiting when this tab loaded" and "one appears later
    // while the tab stays open".
    registration.update();
    setInterval(() => registration.update(), 60 * 60 * 1000);
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
