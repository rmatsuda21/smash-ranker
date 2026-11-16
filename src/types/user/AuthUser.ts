// The logged-in start.gg account, as much of it as the UI shows.
export type AuthUser = {
  id: string;
  // `user/<discriminator>`
  slug: string;
  name: string | null;
  gamerTag: string;
  prefix: string | null;
  playerId: string | null;
  avatarUrl: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
};
