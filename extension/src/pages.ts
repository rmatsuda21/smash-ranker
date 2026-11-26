import {
  challongeUrlToSlug,
  hiveeUrlToSlug,
  type Platform,
  slugToUrl,
  startggUrlToSlug,
  tonamelUrlToSlug,
} from "@/consts/platforms";

// What the extension knows about the page it is on: enough to build every
// link, plus names to show. Sent from the content script to the popup as is,
// so it holds only plain data.
export type TournamentPage = {
  platform: Platform;
  // The site's own tournament page, `/tournament/<id>?event=<event>`: start.gg's
  // tournament slug and event slug (the site swaps them for ids), or a Hivee
  // event's id and program. Null where the site has no page (Challonge,
  // Tonamel, a Hivee short URL).
  tournament: { id: string; event: string | null } | null;
  // What the tools load (a tool link's `s`): start.gg's and Hivee's slugs,
  // or Challonge's and Tonamel's whole URL. Null on a start.gg tournament
  // page with no event open, since every tool works on one event.
  eventSlug: string | null;
  name: string | null;
  eventName: string | null;
};

// Hivee's event ids. (`utils/hivee/api.ts` has the same pattern, but
// importing it would bring Hivee's fetchers and their translations along.)
const HIVEE_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Each site's own suffix on its page titles: "Genesis 9 | Overview",
// "DOJO 351 | Hivee", "Weekly #12 - Challonge" (whose reader also takes off
// a tournament page's own name).
const TITLE_SUFFIX: Record<Platform, RegExp> = {
  startgg: /\s+\|\s+.*$/,
  hivee: /\s+\|\s+Hivee\s*$/,
  challonge: /\s+-\s+Challonge\s*$/,
  tonamel: /\s+[|-]\s+Tonamel.*$/i,
};

const nameFromTitle = (platform: Platform, title: string): string | null => {
  const name = title.replace(TITLE_SUFFIX[platform], "").trim();
  return name && !/^(start\.gg|Hivee|Challonge|Tonamel)$/i.test(name)
    ? name
    : null;
};

// What a site's reader finds. The name is taken from the page's title unless
// the reader knows better.
type Found = Omit<TournamentPage, "name"> & { name?: string | null };

// "ultimate-singles" → "Ultimate Singles". start.gg's event name is not in
// the address and its markup has no stable hooks, so the slug stands in.
const humanizeSlug = (slug: string): string =>
  decodeURIComponent(slug)
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

const readStartgg = (url: URL): Found | null => {
  const match = url.pathname.match(
    /^\/tournament\/([^/]+)(?:\/event\/([^/]+))?/,
  );
  if (!match) return null;
  const [, tournamentSlug, eventSlug] = match;
  return {
    platform: "startgg",
    tournament: { id: tournamentSlug, event: eventSlug ?? null },
    eventSlug: startggUrlToSlug(url.href),
    eventName: eventSlug ? humanizeSlug(eventSlug) : null,
  };
};

const readHivee = (url: URL): Found | null => {
  const slug = hiveeUrlToSlug(url.href);
  if (!slug) return null;
  const [eventKey, programId] = slug.split("/");
  return {
    platform: "hivee",
    // A short URL's name would have to be looked up first; the tools do
    // that themselves, the tournament page does not.
    tournament: HIVEE_UUID.test(eventKey)
      ? { id: eventKey, event: programId ?? null }
      : null,
    eventSlug: slug,
    eventName: null,
  };
};

// Challonge's tournaments sit at the top level of the site, among its own
// pages ("/pricing", "/communities"), and its pages share no other marker, so
// the page has to show it is one: every page of a tournament links to the
// tournament's announcements and log ("/<slug>/log", also from "/ja/<slug>").
const hasTournamentNav = (doc: Document, slug: string): boolean => {
  const targets = [`/${slug}/announcements`, `/${slug}/log`];
  return [...doc.querySelectorAll<HTMLAnchorElement>("a[href]")].some((link) =>
    targets.some(
      (target) =>
        link.pathname === target ||
        (link.pathname.endsWith(target) &&
          /^\/[a-z]{2}(?:[-_][A-Za-z]{2})?$/.test(
            link.pathname.slice(0, -target.length),
          )),
    ),
  );
};

const readChallonge = (url: URL, doc: Document | null): Found | null => {
  const slug = challongeUrlToSlug(url.href);
  if (!slug) return null;
  if (doc && !hasTournamentNav(doc, slug)) return null;
  // A tournament's other pages put their own name before the site's:
  // "Weekly #12 - Standings - Challonge".
  const isSubpage = !url.pathname.replace(/\/+$/, "").endsWith(`/${slug}`);
  const title = doc ? nameFromTitle("challonge", doc.title) : null;
  const name = title && isSubpage ? title.replace(/\s+-\s+[^-]+$/, "") : title;
  return {
    platform: "challonge",
    tournament: null,
    eventSlug: slugToUrl("challonge", slug),
    eventName: null,
    name,
  };
};

const readTonamel = (url: URL): Found | null => {
  const slug = tonamelUrlToSlug(url.href);
  if (!slug) return null;
  return {
    platform: "tonamel",
    tournament: null,
    eventSlug: slugToUrl("tonamel", slug),
    eventName: null,
  };
};

const SITES: {
  host: RegExp;
  read: (url: URL, doc: Document | null) => Found | null;
}[] = [
  { host: /^(www\.)?start\.gg$/, read: readStartgg },
  { host: /^hivee\.jp$/, read: readHivee },
  { host: /^(www\.)?challonge\.com$/, read: readChallonge },
  { host: /^tonamel\.com$/, read: readTonamel },
];

// The tournament on a page, or null when the page is not one. `doc` is the
// page's document; without it, Challonge pages are taken at their address.
export const readTournamentPage = (
  href: string,
  doc: Document | null,
): TournamentPage | null => {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const site = SITES.find((s) => s.host.test(url.hostname));
  const page = site?.read(url, doc);
  if (!page) return null;
  return {
    ...page,
    name:
      page.name !== undefined
        ? page.name
        : doc
          ? nameFromTitle(page.platform, doc.title)
          : null,
  };
};
