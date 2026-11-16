// One event the logged-in user entered (or is registered for).
export type UserEvent = {
  id: string;
  name: string;
  // `tournament/<name>/event/<event>`: what the graphic tools load.
  slug: string;
  // Milliseconds since epoch.
  startAt: number | null;
  numEntrants: number;
  isOnline: boolean;
  isCompleted: boolean;
  videogameName: string | null;
  entrantId: string | null;
  seed: number | null;
  placement: number | null;
  tournament: {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    countryCode: string | null;
    iconUrl: string | null;
  };
};
