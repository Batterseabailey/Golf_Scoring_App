const { getStore, connectLambda } = require("@netlify/blobs");

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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
    const store = getStore("golf-app-data");
    const key = event.queryStringParameters?.key;

    if (event.httpMethod === "GET") {
      if (!key) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "key required" }) };
      }
      const value = await store.get(key);
      if (value === null) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: "not found" }) };
      }
      return { statusCode: 200, headers, body: JSON.stringify({ value }) };
    }

    if (event.httpMethod === "POST") {
      const parsed = JSON.parse(event.body || "{}");
      if (!parsed.key) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "key required" }) };
      }
      await store.set(parsed.key, parsed.value);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
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
