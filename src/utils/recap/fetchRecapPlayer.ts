import { graphql } from "@/gql";
import type { RecapPlayer } from "@/types/recap/Recap";
import { startggClient } from "@/utils/startgg/client";
import { startggLoadError } from "@/utils/startgg/describeError";

const RecapPlayerQueryDoc = graphql(`
  query RecapPlayer($slug: String!) {
    user(slug: $slug) {
      id
      slug
      images(type: "profile") {
        url
      }
      player {
        id
        gamerTag
      }
    }
  }
`);

// A player looked up by their start.gg profile slug (`user/<discriminator>`).
export const fetchRecapPlayer = async (slug: string): Promise<RecapPlayer> => {
  const result = await startggClient
    .query(RecapPlayerQueryDoc, { slug })
    .toPromise();
  const user = result.data?.user;
  if (result.error || !user?.id || !user.player?.id) {
    throw startggLoadError(result.error, "Could not find that player");
  }
  return {
    userId: String(user.id),
    playerId: String(user.player.id),
    slug: user.slug || slug,
    tag: user.player.gamerTag || "",
    avatarUrl: user.images?.[0]?.url?.replace("http://", "https://") || null,
  };
};
