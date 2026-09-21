// Polyfills `window.storage` so the app (originally built as a Claude
// artifact) can run unmodified here — every get/set/delete call in App.jsx
// is unchanged, it's just talking to our own Netlify Function + Blobs
// store instead of Claude's storage.
const API = "/.netlify/functions/storage";

async function getItem(key) {
  const res = await fetch(`${API}?key=${encodeURIComponent(key)}`, { cache: "no-store" });
  if (res.status === 404) {
    throw new Error("Not found");
  }
  if (!res.ok) {
    throw new Error(`Storage get failed (${res.status})`);
  }
  const data = await res.json();
  // etag = a version marker for what's stored. Handing it back with the
  // next save (see setIfMatch) is how the server can tell whether another
  // device has saved in the meantime.
  return { key, value: data.value, etag: data.etag || null, shared: true };
}

// A cheap refresh: "give me the event only if it's changed since version
// <etag>". Returns { unchanged: true } (a few bytes) when it hasn't,
// otherwise the same as getItem. Used for the every-few-seconds refresh, so
// a phone sitting on the leaderboard isn't downloading the whole event
// over and over.
async function getItemIfChanged(key, etag) {
  if (!etag) return getItem(key);
  const res = await fetch(`${API}?key=${encodeURIComponent(key)}&ifNoneMatch=${encodeURIComponent(etag)}`, { cache: "no-store" });
  if (res.status === 404) {
    throw new Error("Not found");
  }
  if (!res.ok) {
    throw new Error(`Storage get failed (${res.status})`);
  }
  const data = await res.json();
  if (data.unchanged) return { key, unchanged: true, etag: data.etag || etag, shared: true };
  return { key, value: data.value, etag: data.etag || null, shared: true };
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

// A "safe" save: only goes through if the stored version is still the one
// this device last saw. Pass the etag from the last get/save, or "new" if
// nothing has ever been stored under this key.
//   -> { ok: true, etag }       saved; etag is the new version marker
//   -> { ok: false, conflict }  someone else saved first; nothing written
async function setItemIfMatch(key, value, etag) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value, ifMatch: etag }),
  });
  if (res.status === 409) {
    return { ok: false, conflict: true };
  }
  if (!res.ok) {
    throw new Error(`Storage set failed (${res.status})`);
  }
  const data = await res.json();
  return { ok: true, etag: data.etag || null };
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
  getIfChanged: (key, etag) => getItemIfChanged(key, etag),
  set: (key, value) => setItem(key, value),
  setIfMatch: (key, value, etag) => setItemIfMatch(key, value, etag),
  delete: (key) => deleteItem(key),
  // Not used by this app, kept only so nothing throws if it's ever called.
  list: async (prefix) => ({ keys: [], prefix, shared: true }),
};
