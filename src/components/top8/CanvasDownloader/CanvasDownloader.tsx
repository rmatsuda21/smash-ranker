import { useState, useEffect } from "react";
import { IoMdDownload } from "react-icons/io";
import { CgOptions } from "react-icons/cg";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { Input } from "@/components/shared/Input/Input";
import { useCanvasStore } from "@/store/canvasStore";
import { useTournamentStore } from "@/store/tournamentStore";
import {
  useExportPixelRatio,
  useExportSettingsStore,
} from "@/store/exportSettingsStore";
import { DropDownSelect } from "@/components/shared/DropDownSelect/DropDownSelect";
import { DownloadOptionModal } from "@/components/top8/CanvasDownloader/DownloadOptionModal/DownloadOptionModal";
import { ExportPreviewModal } from "@/components/top8/CanvasDownloader/ExportPreviewModal/ExportPreviewModal";
import type { StageBlobCache } from "@/hooks/top8/useStageBlobCache";

import styles from "./CanvasDownloader.module.scss";

type Props = {
  className?: string;
  onShare: () => void;
  blobCache: StageBlobCache;
};

type ImgTypes = "png" | "jpeg" | "webp";
const fileExtensions: Record<ImgTypes, string> = {
  png: "png",
  jpeg: "jpeg",
  webp: "webp",
};

export const CanvasDownloader = ({ className, onShare, blobCache }: Props) => {
  const { _ } = useLingui();
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [filename, setFilename] = useState("");
  const [imgType, setImgType] = useState<ImgTypes>("png");
  const stageRef = useCanvasStore((state) => state.stageRef);
  const tournamentName = useTournamentStore(
    (state) => state.info.tournamentName,
  );
  const { pixelRatio, maxPixelRatio } = useExportPixelRatio();
  const quality = useExportSettingsStore((s) => s.quality);

  // Defensive cap: the persisted value is clamped on write and rehydrate,
  // but an out-of-range ratio here means a multi-million-pixel canvas.
  const effectivePixelRatio = Math.min(pixelRatio, maxPixelRatio);

  useEffect(() => {
    const normalizedFilename = tournamentName
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "");
    setFilename(normalizedFilename);
  }, [tournamentName]);

  return (
    <div className={className}>
      <Input
        label={_(msg`Filename`)}
        id="downloader-filename"
        name="downloader-filename"
        type="text"
        value={filename}
        onChange={(event) => {
          setFilename(event.currentTarget.value);
        }}
        placeholder="ranker"
      />
      <DropDownSelect
        className={styles.dropdownSelect}
        options={Object.entries(fileExtensions).map(([key]) => ({
          value: key as ImgTypes,
          id: key,
          display: key.toUpperCase(),
        }))}
        selectedValue={imgType}
        onChange={(value) => {
          setImgType(value);
        }}
      />
      <div className={styles.buttons}>
        <Button
          disabled={!stageRef}
          onClick={() => setIsPreviewOpen(true)}
          tooltip={_(msg`Download`)}
        >
          <IoMdDownload size={16} />
        </Button>
        <Button
          onClick={() => setIsOptionModalOpen(true)}
          tooltip={_(msg`Download Options`)}
        >
          <CgOptions size={16} />
        </Button>
      </div>
      <DownloadOptionModal
        isOpen={isOptionModalOpen}
        setIsOpen={setIsOptionModalOpen}
        imgType={imgType}
        setImgType={setImgType}
      />
      <ExportPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onShare={onShare}
        filename={filename}
        imgType={imgType}
        pixelRatio={effectivePixelRatio}
        quality={quality}
        blobCache={blobCache}
      />
    </div>
  );
};
