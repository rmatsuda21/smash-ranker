/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";

/**
 * Tracks whether the images under a part of the canvas have finished loading.
 *
 * Images announce themselves when they mount (`useAssetLoad`), so nothing has
 * to predict in advance how many images a set of elements will produce. A
 * boundary reports ready once every image currently under it has settled, and
 * again if images that mount later settle.
 */

type AssetHandle = {
  /** The asset finished loading, or finished again after a change. */
  ready: () => void;
  /** The asset failed to load. It still counts as settled: one broken image
   *  must not keep a loading state up forever. */
  fail: () => void;
  /** The asset unmounted. */
  cancel: () => void;
};

type AssetLoadScope = { begin: () => AssetHandle };

const AssetLoadContext = createContext<AssetLoadScope | null>(null);

type BoundaryProps = {
  /** Every asset under this boundary has settled. Also called when there are
   *  no assets at all. */
  onAllReady?: () => void;
  /** One asset became ready. Fires on every load, including re-loads. */
  onAssetReady?: () => void;
  children: ReactNode;
};

export const AssetLoadBoundary = ({
  onAllReady,
  onAssetReady,
  children,
}: BoundaryProps) => {
  const parent = useContext(AssetLoadContext);

  const onAllReadyRef = useRef(onAllReady);
  const onAssetReadyRef = useRef(onAssetReady);
  onAllReadyRef.current = onAllReady;
  onAssetReadyRef.current = onAssetReady;

  const pendingRef = useRef(new Set<symbol>());
  // Bumped whenever an asset starts loading, so "all ready" is reported once
  // per batch of loads rather than on every render.
  const generationRef = useRef(0);
  const reportedGenerationRef = useRef(-1);

  const reportIfAllReady = useCallback(() => {
    if (pendingRef.current.size > 0) return;
    if (reportedGenerationRef.current === generationRef.current) return;
    reportedGenerationRef.current = generationRef.current;
    onAllReadyRef.current?.();
  }, []);

  const scope = useMemo<AssetLoadScope>(
    () => ({
      begin: () => {
        const token = Symbol("asset");
        pendingRef.current.add(token);
        generationRef.current += 1;
        // An enclosing boundary is only ready when this one's assets are.
        const outer = parent?.begin();

        const settle = () => {
          if (pendingRef.current.delete(token)) reportIfAllReady();
        };

        return {
          ready: () => {
            onAssetReadyRef.current?.();
            outer?.ready();
            settle();
          },
          fail: () => {
            outer?.fail();
            settle();
          },
          cancel: () => {
            outer?.cancel();
            settle();
          },
        };
      },
    }),
    [parent, reportIfAllReady],
  );

  // Children register in their own effects, which run before this one, so by
  // now every asset mounted in this commit is pending. Covers the case no
  // asset will ever report: a boundary with nothing to load.
  useEffect(() => {
    reportIfAllReady();
  });

  return <AssetLoadContext value={scope}>{children}</AssetLoadContext>;
};

/**
 * Registers the calling component as a loading asset with the nearest
 * boundary. Call it before the hook that does the loading, so the asset is
 * registered by the time a cached load completes synchronously.
 */
export const useAssetLoad = () => {
  const scope = useContext(AssetLoadContext);
  const handleRef = useRef<AssetHandle | null>(null);

  useEffect(() => {
    if (!scope) return;
    const handle = scope.begin();
    handleRef.current = handle;
    return () => {
      handleRef.current = null;
      handle.cancel();
    };
  }, [scope]);

  return useMemo(
    () => ({
      ready: () => handleRef.current?.ready(),
      fail: () => handleRef.current?.fail(),
    }),
    [],
  );
};
