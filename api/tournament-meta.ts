import "./_instrument";

import type { VercelRequest, VercelResponse } from "@vercel/node";

import { withLogging } from "./_lib/withLogging";
import { decodeInvite, fetchTournamentMeta } from "./_lib/tournamentMeta";

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const encoded = req.query.d;
  if (typeof encoded !== "string" || encoded.length === 0) {
    return res.status(400).json({ error: "Missing 'd' query parameter" });
  }

  const invite = decodeInvite(encoded);
  if (!invite) {
    return res.status(400).json({ error: "Invalid invite" });
  }

  const meta = await fetchTournamentMeta(invite.platform, invite.slug);
  if (!meta || !meta.name) {
    return res.status(404).json({ error: "Tournament not found" });
  }

  // Tournament names rarely change. Cache aggressively at the CDN.
  res.setHeader(
    "Cache-Control",
    "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
  );
  return res.status(200).json(meta);
};

export default withLogging("tournament-meta", handler);
