import { assetRepository } from "@/db/repository";

const IDB_IMAGES_BASE_URL = "/idb-images/";

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
  const src = `${IDB_IMAGES_BASE_URL}${id}`;

  // The asset store looks images up by their address.
  if (await assetRepository.get(src)) return src;

  const data = await load();
  await assetRepository.put({
    id,
    src,
    fileName: name,
    data,
    date: new Date(),
  });

  return src;
};
