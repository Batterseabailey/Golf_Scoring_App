// Polyfills `window.storage` so the app (originally built as a Claude
// artifact) can run unmodified here — every get/set/delete call in App.jsx
// is unchanged, it's just talking to our own Netlify Function + Blobs
// store instead of Claude's storage.
const API = "/.netlify/functions/storage";

async function getItem(key) {
  const res = await fetch(`${API}?key=${encodeURIComponent(key)}`);
  if (res.status === 404) {
    throw new Error("Not found");
  }
  if (!res.ok) {
    throw new Error(`Storage get failed (${res.status})`);
  }
  const data = await res.json();
  return { key, value: data.value, shared: true };
}

async function setItem(key, value) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    throw new Error(`Storage set failed (${res.status})`);
  }
  return { key, value, shared: true };
}

async function deleteItem(key) {
  const res = await fetch(`${API}?key=${encodeURIComponent(key)}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(`Storage delete failed (${res.status})`);
  }
  return { key, deleted: true, shared: true };
}

window.storage = {
  get: (key) => getItem(key),
  set: (key, value) => setItem(key, value),
  delete: (key) => deleteItem(key),
  // Not used by this app, kept only so nothing throws if it's ever called.
  list: async (prefix) => ({ keys: [], prefix, shared: true }),
};
