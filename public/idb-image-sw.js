/// <reference lib="webworker" />

const DB_NAME = "top8-db";
const ASSET_STORES = ["assets", "thumbnailAssets"];
const MISSING_ASSET_PATH = "/assets/missing_asset.svg";

// Uploaded files are served from the site's own origin, and an SVG opened as
// a page of its own can run scripts. `sandbox` takes that away without
// changing how the file draws inside an <img> or on the canvas.
const ASSET_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy":
    "sandbox; default-src 'none'; style-src 'unsafe-inline'",
};

// One connection for the worker's lifetime, opened again after it is closed.
let connection = null;

// Resolves to the database, or to null when the app has not created it yet.
//
// Opened without a version, which defers schema control to the main app: the
// worker keeps working when the app bumps DB_VERSION and adds stores.
const openDatabase = () => {
  if (connection) return connection;

  const opening = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    let missing = false;

    // With no version, a database that does not exist is created empty at
    // version 1. Refuse: only the app creates it, with its stores.
    request.onupgradeneeded = () => {
      missing = true;
      request.transaction.abort();
    };

    request.onerror = (event) => {
      if (missing) {
        event.preventDefault();
        resolve(null);
        return;
      }
      reject(request.error);
    };

    request.onsuccess = () => {
      const db = request.result;
      const forget = () => {
        if (connection === opening) connection = null;
      };
      // The app is upgrading or deleting the database: let go, or it waits
      // for as long as this worker lives.
      db.onversionchange = () => {
        db.close();
        forget();
      };
      // Closed by the browser itself.
      db.onclose = forget;
      resolve(db);
    };
  });

  connection = opening;
  const forgetFailed = () => {
    if (connection === opening) connection = null;
  };
  // Neither a failed open nor "not created yet" is kept.
  opening.then((db) => {
    if (!db) forgetFailed();
  }, forgetFailed);

  return opening;
};

const readAsset = (db, id) => {
  const stores = ASSET_STORES.filter((name) =>
    db.objectStoreNames.contains(name),
  );
  if (stores.length === 0) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    // Throws when the connection is closing.
    const transaction = db.transaction(stores, "readonly");
    let found = null;

    for (const name of stores) {
      const request = transaction.objectStore(name).get(id);
      request.onsuccess = () => {
        if (request.result && !found) found = request.result;
      };
    }

    transaction.oncomplete = () => resolve(found);
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Transaction aborted"));
  });
};

const getAsset = async (id) => {
  const db = await openDatabase();
  if (!db) return null;

  try {
    return await readAsset(db, id);
  } catch (error) {
    // The connection was closing under this read (the app upgrading in
    // another tab): once more, on a new one.
    if (connection) throw error;
    const reopened = await openDatabase();
    return reopened ? readAsset(reopened, id) : null;
  }
};

const createBlobResponse = (blob) => {
  return new Response(blob, {
    status: 200,
    headers: {
      "Content-Type": blob.type || "application/octet-stream",
      "Content-Length": blob.size.toString(),
      ...ASSET_HEADERS,
    },
  });
};

const missingAssetResponse = async () => {
  try {
    const response = await fetch(MISSING_ASSET_PATH);
    return response;
  } catch (error) {
    return new Response("Image not found", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  }
};

const handleImageRequest = async (imageId) => {
  try {
    const asset = await getAsset(imageId);

    if (asset && asset.data) {
      return createBlobResponse(asset.data);
    }

    return missingAssetResponse();
  } catch (error) {
    console.error("[IDB Image SW] Error fetching asset:", error);
    return missingAssetResponse();
  }
};

self.addEventListener("install", () => {
  console.log("[IDB Image SW] Installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[IDB Image SW] Activated");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CLAIM_CLIENTS") {
    self.clients.claim();
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith("/idb-images/")) {
    const match = url.pathname.match(/^\/idb-images\/(.+)/);
    const imageId = match ? match[1] : "";

    if (imageId) {
      event.respondWith(handleImageRequest(imageId));
    }
  }
});
