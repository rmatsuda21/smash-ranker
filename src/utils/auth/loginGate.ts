import { isLoginAvailable } from "@/utils/auth/oauth";

// Whether the tools and tournament pages are open only to someone logged in
// with start.gg (see `LoginGate`). Set to false to open them to everyone
// again.
const LOGIN_REQUIRED = true;

// start.gg accepts no localhost redirect address, so nobody can log in on a
// plain `bun dev`: everything stays open there. `bun run dev:https` has a
// login, and the gate with it.
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];
const onLocalDevServer = (): boolean =>
  import.meta.env.DEV && LOCAL_HOSTS.includes(window.location.hostname);

export const isLoginRequired = (): boolean =>
  LOGIN_REQUIRED && isLoginAvailable() && !onLocalDevServer();
