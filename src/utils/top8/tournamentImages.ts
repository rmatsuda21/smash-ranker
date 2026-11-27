import { assetRepository, templateRepository } from "@/db/repository";
import { useCanvasStore } from "@/store/canvasStore";
import { useHistoryStore } from "@/store/historyStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { assetSrc } from "@/utils/assetSrc";
import { logWarning } from "@/utils/observability/log";

// Every tournament loaded saves its images, and nobody goes back to delete
// them: without a limit they fill the image library and the site's storage.
// Images the user uploaded are never counted or removed.
const MAX_TOURNAMENT_IMAGES = 30;
const TOURNAMENT_ID_PREFIX = "tournament-";
// A saved image found again is marked as used, at most this often.
const TOUCH_AFTER_MS = 24 * 60 * 60 * 1000;

type TournamentImageSource = {
  platform: "startgg" | "tonamel" | "hivee";
  // What tells this image apart from every other on the platform: start.gg's
  // image id, or the image's URL where the platform gives no id.
  key: string;
  // The name shown in the image library.
  name: string;
  // Downloads the image. Not called when the image is already saved.
  load: () => Promise<Blob>;
};

const NAMES_BY_TYPE: Record<string, string> = {
  profile: "logo",
  banner: "banner",
};

// "Genesis X logo" for a start.gg image of type "profile".
export const tournamentImageName = (owner: string, type: string): string =>
  [owner.trim(), NAMES_BY_TYPE[type] ?? type].filter(Boolean).join(" ");

// The id goes into the image's address, so the key (often a URL) is hashed.
const hashKey = async (key: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(key),
  );
  return Array.from(new Uint8Array(digest).slice(0, 16), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
};

// Everything that can show a stored image, as text to look addresses up in:
// the graphic on screen and its undo history, the loaded tournament, and
// the designs of saved templates.
const referencedText = async (): Promise<string> => {
  const { past, future } = useHistoryStore.getState();
  const templates = await templateRepository.getAll();
  return JSON.stringify([
    useCanvasStore.getState().design,
    useTournamentStore.getState().info,
    past,
    future,
    templates.map((template) => template.design),
  ]);
};

// Removes the tournament images used longest ago beyond the limit, leaving
// any that something still shows.
const pruneTournamentImages = async (): Promise<void> => {
  // Listed oldest first.
  const stored = (await assetRepository.getAll()).filter((asset) =>
    asset.id.startsWith(TOURNAMENT_ID_PREFIX),
  );
  const excess = stored.length - MAX_TOURNAMENT_IMAGES;
  if (excess <= 0) return;

  const inUse = await referencedText();
  for (const asset of stored.slice(0, excess)) {
    if (inUse.includes(asset.src)) continue;
    await assetRepository.delete(asset.id);
  }
};

// One at a time: a start.gg tournament saves its images together.
let pruning: Promise<void> = Promise.resolve();

const schedulePrune = () => {
  pruning = pruning.then(pruneTournamentImages).catch((error) =>
    // Nothing is removed when it cannot be told what is in use.
    logWarning("tournament image cleanup failed", {
      area: "storage",
      error: error instanceof Error ? error.message : String(error),
    }),
  );
};

// Saves a tournament's image to the image library and returns its address.
// The asset's id comes from the image itself, so loading the same tournament
// again finds the saved copy: nothing is downloaded and no second copy is
// made. A tournament that changes its image gets a new one saved.
export const saveTournamentImage = async ({
  platform,
  key,
  name,
  load,
}: TournamentImageSource): Promise<string> => {
  const id = `tournament-${platform}-${await hashKey(key)}`;
  const src = assetSrc(id);

  const saved = await assetRepository.get(id);
  if (saved) {
    if (Date.now() - saved.date.getTime() > TOUCH_AFTER_MS) {
      // Keeps a tournament that is loaded again from being the next removed.
      await assetRepository.put({ ...saved, date: new Date() }).catch(() => {});
    }
    return src;
  }

  const data = await load();
  await assetRepository.put({
    id,
    src,
    fileName: name,
    data,
    date: new Date(),
  });
  schedulePrune();

  return src;
};
