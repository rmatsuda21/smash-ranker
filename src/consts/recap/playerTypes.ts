import { msg } from "@lingui/core/macro";
import type { MessageDescriptor } from "@lingui/core";

import type { RecapTypeId } from "@/types/recap/Recap";

export type PlayerTypeDefinition = {
  id: RecapTypeId;
  name: MessageDescriptor;
  // Card ground, ink and accent, as CSS colours.
  bg: string;
  fg: string;
  accent: string;
};

// Every player type, in the order the card numbers them.
export const PLAYER_TYPES: PlayerTypeDefinition[] = [
  {
    id: "closer",
    name: msg`The Closer`,
    bg: "var(--rc-yellow)",
    fg: "var(--rc-ink)",
    accent: "var(--rc-pink)",
  },
  {
    id: "slayer",
    name: msg`Giant Slayer`,
    bg: "var(--rc-green)",
    fg: "var(--rc-ink)",
    accent: "#fff",
  },
  {
    id: "road",
    name: msg`Road Warrior`,
    bg: "var(--rc-ink)",
    fg: "var(--rc-paper)",
    accent: "var(--rc-yellow)",
  },
  {
    id: "local",
    name: msg`Local Legend`,
    bg: "var(--rc-blue)",
    fg: "#fff",
    accent: "var(--rc-yellow)",
  },
  {
    id: "iron",
    name: msg`Iron Regular`,
    bg: "var(--rc-pink)",
    fg: "#fff",
    accent: "var(--rc-ink)",
  },
  {
    id: "loyal",
    name: msg`Loyalist`,
    bg: "var(--rc-paper)",
    fg: "var(--rc-ink)",
    accent: "var(--rc-pink)",
  },
  {
    id: "lab",
    name: msg`Lab Rat`,
    bg: "var(--rc-ink)",
    fg: "var(--rc-green)",
    accent: "var(--rc-yellow)",
  },
  {
    id: "gate",
    name: msg`Gatekeeper`,
    bg: "var(--rc-paper)",
    fg: "var(--rc-ink)",
    accent: "var(--rc-blue)",
  },
  {
    id: "rookie",
    name: msg`Rookie`,
    bg: "var(--rc-green)",
    fg: "var(--rc-ink)",
    accent: "var(--rc-yellow)",
  },
];
