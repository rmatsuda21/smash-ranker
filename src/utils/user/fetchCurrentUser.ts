import type { AuthUser } from "@/types/user/AuthUser";

const STARTGG_GQL = "https://api.start.gg/gql/alpha";

const QUERY = `query CurrentUserProfile {
  currentUser {
    id
    slug
    name
    location { city state country }
    images(type: "profile") { url }
    player { id gamerTag prefix }
  }
}`;

type Response = {
  data?: {
    currentUser?: {
      id: number | string;
      slug: string | null;
      name: string | null;
      location: {
        city: string | null;
        state: string | null;
        country: string | null;
      } | null;
      images: ({ url: string | null } | null)[] | null;
      player: {
        id: number | string;
        gamerTag: string | null;
        prefix: string | null;
      } | null;
    } | null;
  };
};

// Who does this access token belong to? Deliberately a bare fetch with the
// given token instead of the shared client: that one falls back to the app's
// own token, and `currentUser` would then describe the wrong account.
export const fetchCurrentUser = async (
  accessToken: string,
): Promise<AuthUser> => {
  const response = await fetch(STARTGG_GQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query: QUERY }),
  });
  const json = (await response.json()) as Response;
  const user = json.data?.currentUser;
  if (!response.ok || !user || !user.slug) {
    throw new Error("Could not load start.gg profile");
  }

  return {
    id: String(user.id),
    slug: user.slug,
    name: user.name || null,
    gamerTag: user.player?.gamerTag || user.name || "Player",
    prefix: user.player?.prefix || null,
    playerId: user.player ? String(user.player.id) : null,
    avatarUrl: user.images?.[0]?.url?.replace("http://", "https://") || null,
    city: user.location?.city || null,
    state: user.location?.state || null,
    country: user.location?.country || null,
  };
};
