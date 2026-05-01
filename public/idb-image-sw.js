/// <reference lib="webworker" />

const DB_NAME = "top8-db";
const ASSET_STORES = ["assets", "thumbnailAssets"];
const MISSING_ASSET_PATH = "/assets/missing_asset.svg";

// Open without a version — defers schema control to the main app, so the SW
// keeps working when the app bumps DB_VERSION and adds new stores.
const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

const getAsset = async (id) => {
  const db = await openDatabase();
  const availableStores = ASSET_STORES.filter((name) =>
    db.objectStoreNames.contains(name),
  );
  if (availableStores.length === 0) {
    db.close();
    return null;
  }

  return new Promise((resolve, reject) => {
    let pending = availableStores.length;
    let found = null;
    let errored = null;
    const transaction = db.transaction(availableStores, "readonly");

    for (const storeName of availableStores) {
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onerror = () => {
        errored = request.error;
        pending -= 1;
        if (pending === 0 && !found) reject(errored);
      };

      request.onsuccess = () => {
        if (request.result && !found) {
          found = request.result;
        }
        pending -= 1;
        if (pending === 0) {
          if (found) resolve(found);
          else if (errored) reject(errored);
          else resolve(null);
        }
      };
    }

    transaction.oncomplete = () => {
      db.close();
    };
  });
}


const createBlobResponse = (blob) => {
  return new Response(blob, {
    status: 200,
    headers: {
      "Content-Type": blob.type || "application/octet-stream",
      "Content-Length": blob.size.toString(),
    },
  });
}

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
}

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
}

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

