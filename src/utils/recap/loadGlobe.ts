import type { GeoPermissibleObjects } from "d3-geo";
import type { GeometryCollection, Topology } from "topojson-specification";

// What the globe draws with: the projection library and the world's shapes.
export type RecapGlobeGeo = {
  d3: typeof import("d3-geo");
  land: GeoPermissibleObjects;
  borders: GeoPermissibleObjects;
};

let pending: Promise<RecapGlobeGeo> | null = null;

// The map libraries and the world's outline are three chunks of their own
// (about 150 KB), fetched the first time this is called and never before: the
// rest of the app must not pay for them. The recap calls it as it opens, so
// they are in by the time the story reaches the globe.
export const loadRecapGlobe = (): Promise<RecapGlobeGeo> => {
  pending ??= Promise.all([
    import("d3-geo"),
    import("topojson-client"),
    import("world-atlas/countries-110m.json"),
  ])
    .then(([d3, topojson, atlas]) => {
      const world = atlas.default as unknown as Topology;
      return {
        d3,
        land: topojson.feature(world, world.objects.land),
        borders: topojson.mesh(
          world,
          world.objects.countries as GeometryCollection,
          (a, b) => a !== b,
        ),
      };
    })
    .catch((err: unknown) => {
      // Let the next caller try again.
      pending = null;
      throw err;
    });
  return pending;
};
