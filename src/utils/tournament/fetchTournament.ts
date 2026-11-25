import { fetchHiveeTournament, isHiveeId } from "@/utils/tournament/fetchHivee";
import { graphql } from "@/gql";
import type {
  TournamentDetails,
  TournamentEvent,
  TournamentStatus,
  TournamentStream,
} from "@/types/tournament/Tournament";
import { getGameForStartggVideogame } from "@/utils/games";
import { startggClient } from "@/utils/startgg/client";

// About 70 objects for a major with 40 events and 7 streams.
const TournamentPageQueryDoc = graphql(`
  query TournamentPage($id: ID!) {
    tournament(id: $id) {
      id
      name
      slug
      startAt
      endAt
      timezone
      city
      addrState
      countryCode
      venueName
      venueAddress
      mapsPlaceId
      isOnline
      numAttendees
      state
      hashtag
      images {
        url
        type
      }
      owner {
        player {
          gamerTag
        }
      }
      links {
        discord
      }
      streams {
        streamName
        streamSource
        streamLogo
      }
      events {
        id
        name
        slug
        startAt
        state
        type
        numEntrants
        videogame {
          id
          name
        }
      }
    }
  }
`);

const https = (url: string | null | undefined): string | null =>
  url ? url.replace("http://", "https://") : null;

const STREAM_HOSTS: Record<string, string> = {
  TWITCH: "https://twitch.tv/",
  YOUTUBE: "https://youtube.com/",
};

// A tournament's `state` is a number (1 created, 2 active, 3 completed); an
// event's is the enum's name.
const toStatus = (
  state: number | string | null | undefined,
  startAt: number | null,
): TournamentStatus => {
  if (state === 3 || state === "COMPLETED") return "finished";
  if (state === 2 || state === "ACTIVE") return "live";
  return startAt !== null && startAt <= Date.now() ? "live" : "upcoming";
};

// Events of the games the site covers first, then the biggest.
const byRelevance = (a: TournamentEvent, b: TournamentEvent) =>
  Number(b.game !== null) - Number(a.game !== null) ||
  b.numEntrants - a.numEntrants;

export const fetchTournament = async (
  id: string,
): Promise<TournamentDetails | null> => {
  if (isHiveeId(id)) return fetchHiveeTournament(id);
  const result = await startggClient
    .query(TournamentPageQueryDoc, { id })
    .toPromise();
  if (result.error) throw new Error(result.error.message);

  const tournament = result.data?.tournament;
  if (!tournament?.id || !tournament.slug) return null;

  const startAt = tournament.startAt ? tournament.startAt * 1000 : null;
  const endAt = tournament.endAt ? tournament.endAt * 1000 : null;
  const image = (type: string) =>
    https(tournament.images?.find((img) => img?.type === type)?.url);

  const events = (tournament.events ?? [])
    .flatMap((event): TournamentEvent[] => {
      if (!event?.id || !event.slug) return [];
      const eventStart = event.startAt ? event.startAt * 1000 : null;
      return [
        {
          id: String(event.id),
          name: event.name || "",
          slug: event.slug,
          startAt: eventStart,
          status: toStatus(event.state, eventStart),
          numEntrants: event.numEntrants ?? 0,
          isTeams: event.type === 5,
          videogameName: event.videogame?.name || null,
          game: getGameForStartggVideogame(event.videogame?.id)?.id ?? null,
        },
      ];
    })
    .sort(byRelevance);

  const streams = (tournament.streams ?? []).flatMap(
    (stream): TournamentStream[] => {
      if (!stream?.streamName) return [];
      const host = STREAM_HOSTS[stream.streamSource ?? ""];
      return [
        {
          name: stream.streamName,
          url: host ? `${host}${stream.streamName}` : null,
          logoUrl: https(stream.streamLogo),
        },
      ];
    },
  );

  // A tournament whose end has passed is over even if nobody closed it.
  const status =
    endAt !== null && endAt < Date.now()
      ? "finished"
      : toStatus(tournament.state, startAt);

  return {
    id: String(tournament.id),
    name: tournament.name || "",
    slug: tournament.slug,
    platform: "startgg",
    url: `https://start.gg/${tournament.slug}`,
    startAt,
    endAt,
    timezone: tournament.timezone || null,
    status,
    isOnline: Boolean(tournament.isOnline),
    city: tournament.city || null,
    state: tournament.addrState || null,
    countryCode: tournament.countryCode || null,
    venueName: tournament.venueName || null,
    venueAddress: tournament.venueAddress || null,
    mapsPlaceId: tournament.mapsPlaceId || null,
    numAttendees: tournament.numAttendees ?? 0,
    hashtag: tournament.hashtag || null,
    organizer: tournament.owner?.player?.gamerTag || null,
    discordUrl: https(tournament.links?.discord),
    iconUrl: image("profile"),
    bannerUrl: image("banner"),
    streams,
    events,
  };
};
