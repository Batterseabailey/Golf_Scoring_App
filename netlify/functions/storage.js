const { getStore, connectLambda } = require("@netlify/blobs");

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  // Scores must never be served from a cache.
  "Cache-Control": "no-store",
};

const STORE_NAME = "golf-app-data";

// Visit /.netlify/functions/storage?selftest=1 in a browser after deploying.
// It proves, on the live site, that a save carrying an out-of-date version
// really is refused — the safety net the whole multi-scorer fix relies on.
async function selfTest(store) {
  const key = "__selftest__";
  const report = {};
  try {
    await store.delete(key);
    const first = await store.set(key, "one", { onlyIfNew: true });
    const dupe = await store.set(key, "dupe", { onlyIfNew: true });
    const second = await store.set(key, "two", { onlyIfMatch: first.etag });
    const stale = await store.set(key, "stale", { onlyIfMatch: first.etag });
    // A read must hand back the same version marker the save produced.
    // Reads can lag a moment behind writes, so allow a few attempts.
    let readEtag = null;
    for (let i = 0; i < 4 && readEtag !== second.etag; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 1500));
      const entry = await store.getWithMetadata(key);
      readEtag = entry && entry.etag ? entry.etag : null;
    }
    report.readReturnsVersion = Boolean(second.etag) && readEtag === second.etag;
    await store.delete(key);
    report.freshSaveAccepted = first.modified === true && second.modified === true;
    report.duplicateCreateRefused = dupe.modified === false;
    report.staleSaveRefused = stale.modified === false;
    report.ok = report.freshSaveAccepted && report.duplicateCreateRefused && report.staleSaveRefused && report.readReturnsVersion;
  } catch (err) {
    report.ok = false;
    report.error = String(err && err.message ? err.message : err);
  }
  return report;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  // Required for Netlify Blobs to work in this ("Lambda compatibility")
  // function style — without this, getStore() throws
  // MissingBlobsEnvironmentError in production even though it can look
  // fine in local dev, and every read/write silently fails.
  connectLambda(event);

  try {
    const store = getStore(STORE_NAME);
    const key = event.queryStringParameters?.key;

    if (event.httpMethod === "GET") {
      if (event.queryStringParameters?.selftest) {
        return { statusCode: 200, headers, body: JSON.stringify(await selfTest(store), null, 2) };
      }
      if (!key) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "key required" }) };
      }
      // "Has anything changed since the copy I've got?" — the app sends the
      // version marker (etag) of what it's showing. If that's still the
      // current version, answer with a few bytes instead of sending the
      // whole event again. With a field of phones refreshing every few
      // seconds this is nearly all requests, so it cuts the data sent (by
      // Netlify, and used from each member's phone allowance) enormously.
      // Older copies of the app don't ask, and simply get the full event.
      const known = event.queryStringParameters?.ifNoneMatch;
      if (known) {
        const meta = await store.getMetadata(key);
        if (meta && meta.etag && meta.etag === known) {
          return { statusCode: 200, headers, body: JSON.stringify({ unchanged: true, etag: meta.etag }) };
        }
      }
      const entry = await store.getWithMetadata(key);
      if (entry === null) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: "not found" }) };
      }
      // etag = the version marker. The app sends it back with its next
      // save so we can tell whether anyone else has saved in between.
      return { statusCode: 200, headers, body: JSON.stringify({ value: entry.data, etag: entry.etag || null }) };
    }

    if (event.httpMethod === "POST") {
      const parsed = JSON.parse(event.body || "{}");
      if (!parsed.key) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "key required" }) };
      }
      // ifMatch is optional, so older copies of the app (and the simple
      // saves for documents / the course library) keep working unchanged:
      //   missing      -> plain overwrite, exactly as before
      //   "new"        -> only save if nothing exists under this key yet
      //   "<an etag>"  -> only save if the stored version is still that one
      let options;
      if (parsed.ifMatch === "new") options = { onlyIfNew: true };
      else if (typeof parsed.ifMatch === "string" && parsed.ifMatch) options = { onlyIfMatch: parsed.ifMatch };

      const result = options ? await store.set(parsed.key, parsed.value, options) : await store.set(parsed.key, parsed.value);
      if (options && result && result.modified === false) {
        return { statusCode: 409, headers, body: JSON.stringify({ ok: false, conflict: true }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, etag: (result && result.etag) || null }) };
    }

    if (event.httpMethod === "DELETE") {
      if (!key) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "key required" }) };
      }
      await store.delete(key);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: "method not allowed" }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err && err.message ? err.message : err) }) };
  }
};
