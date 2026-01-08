/// <reference lib="webworker" />

const DB_NAME = "top8-db";
const DB_VERSION = 2;
const ASSETS_STORE = "assets";
const MISSING_ASSET_PATH = "/assets/missing_asset.svg";

const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(ASSETS_STORE)) {
        const assetsStore = db.createObjectStore(ASSETS_STORE, {
          keyPath: "id",
        });
        assetsStore.createIndex("date", "date");
      }
    };
  });
}

const getAsset = async (id) => {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ASSETS_STORE, "readonly");
    const store = transaction.objectStore(ASSETS_STORE);
    const request = store.get(id);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

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

