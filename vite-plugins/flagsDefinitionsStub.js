// Stub for `@vercel/flags-definitions` — a Vercel-build-time virtual module
// that doesn't exist locally or in regular node_modules. Only the server-side
// adapter in @vercel/flags-core uses it, but Vite's dep scanner walks the
// import graph and crashes on the missing module. Aliasing it to this stub
// keeps the dev server happy without affecting production behavior (the real
// module is injected by Vercel's build pipeline at deploy time).
export const get = () => undefined;
export default { get };
