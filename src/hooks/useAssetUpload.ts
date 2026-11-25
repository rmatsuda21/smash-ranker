import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { useToast } from "@/components/Toast";
import { DBAsset } from "@/types/Repository";
import { logEvent, logWarning, setPerson } from "@/utils/observability/log";

const MAX_ASSET_BYTES = 2 * 1024 * 1024;

type UploadAsset = (asset: Omit<DBAsset, "id" | "src">) => Promise<string>;

// Validates and stores picked or dropped image files. Resolves to the srcs
// of the assets that were stored, in order.
export const useAssetUpload = (uploadAsset: UploadAsset) => {
  const { _ } = useLingui();
  const { showToast } = useToast();

  return async (files?: File[]): Promise<string[]> => {
    const srcs: string[] = [];

    for (const file of files ?? []) {
      if (!file.type.startsWith("image/")) continue;

      if (file.size > MAX_ASSET_BYTES) {
        showToast(_(msg`${file.name} is too large! (Max 2MB)`), {
          variant: "error",
        });
        continue;
      }

      let src: string;
      try {
        src = await uploadAsset({
          fileName: file.name,
          data: new Blob([file], { type: file.type }),
          date: new Date(),
        });
      } catch (error) {
        logWarning("image upload failed", {
          area: "storage",
          error: error instanceof Error ? error.message : String(error),
          size_kb: Math.round(file.size / 1024),
        });
        showToast(_(msg`Couldn't save ${file.name}. Try again.`), {
          variant: "error",
        });
        continue;
      }
      srcs.push(src);

      logEvent("custom_asset_upload", {
        mime_type: file.type || "unknown",
        size_kb: Math.round(file.size / 1024),
      });
      setPerson({ has_uploaded_custom_asset: true });
    }

    return srcs;
  };
};
