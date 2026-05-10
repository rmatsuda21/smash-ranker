import { useState, useCallback, useEffect } from "react";
import { IoMdDownload } from "react-icons/io";
import { CgOptions } from "react-icons/cg";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { Input } from "@/components/shared/Input/Input";
import { useCanvasStore } from "@/store/canvasStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { DropDownSelect } from "@/components/shared/DropDownSelect/DropDownSelect";
import { downloadBlob } from "@/utils/top8/downloadBlob";
import { exportCanvasToPngBlob } from "@/utils/top8/exportCanvas";
import { DownloadOptionModal } from "@/components/top8/CanvasDownloader/DownloadOptionModal/DownloadOptionModal";
import { logEvent } from "@/utils/observability/log";

import styles from "./CanvasDownloader.module.scss";

type Props = {
  className?: string;
};

type ImgTypes = "png" | "jpeg" | "webp";
const fileExtensions: Record<ImgTypes, string> = {
  png: "png",
  jpeg: "jpeg",
  webp: "webp",
};

export const CanvasDownloader = ({ className }: Props) => {
  const { _ } = useLingui();
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [quality, setQuality] = useState(2);
  const [pixelRatio, setPixelRatio] = useState(2);
  const [filename, setFilename] = useState("");
  const [imgType, setImgType] = useState<ImgTypes>("png");
  const stageRef = useCanvasStore((state) => state.stageRef);
  const tournamentName = useTournamentStore(
    (state) => state.info.tournamentName,
  );

  useEffect(() => {
    const normalizedFilename = tournamentName
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "");
    setFilename(normalizedFilename);
  }, [tournamentName]);

  const handleDownload = useCallback(async () => {
    if (!stageRef) return;

    const mimeType = `image/${imgType}`;
    const blob = await exportCanvasToPngBlob({
      stageRef,
      pixelRatio,
      mimeType,
      quality,
    });

    if (!blob) return;

    const finalFilename = `${filename || "ranker"}.${fileExtensions[imgType]}`;
    await downloadBlob({ blob, filename: finalFilename, mimeType });
    logEvent("export_png", { surface: "ranker", format: imgType, pixelRatio });
  }, [stageRef, filename, imgType, quality, pixelRatio]);

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
          onClick={handleDownload}
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
        quality={quality}
        pixelRatio={pixelRatio}
        setQuality={setQuality}
        setPixelRatio={setPixelRatio}
        isOpen={isOptionModalOpen}
        setIsOpen={setIsOptionModalOpen}
      />
    </div>
  );
};
