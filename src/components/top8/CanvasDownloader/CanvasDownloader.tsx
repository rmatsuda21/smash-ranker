import { useState, useCallback, useEffect } from "react";
import { IoMdDownload } from "react-icons/io";
import { CgOptions } from "react-icons/cg";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Button } from "@/components/shared/Button/Button";
import { Input } from "@/components/shared/Input/Input";
import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { DropDownSelect } from "@/components/top8/DropDownSelect/DropDownSelect";
import { downloadDataURL } from "@/utils/top8/downloadDataURL";
import { DownloadOptionModal } from "@/components/top8/CanvasDownloader/DownloadOptionModal/DownloadOptionModal";

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
  const dispatch = usePlayerStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);
  const tournamentName = useTournamentStore(
    (state) => state.info.tournamentName
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

    dispatch({ type: "CLEAR_SELECTED_PLAYER" });
    tournamentDispatch({ type: "CLEAR_SELECTED_ELEMENT" });

    await new Promise((resolve) => setTimeout(resolve, 50));

    const mimeType = `image/${imgType}`;
    const dataURL = stageRef.toDataURL({
      pixelRatio,
      mimeType,
      quality,
    });

    const finalFilename = `${filename || "ranker"}.${fileExtensions[imgType]}`;
    downloadDataURL({ dataURL, filename: finalFilename, mimeType });
  }, [
    stageRef,
    filename,
    dispatch,
    tournamentDispatch,
    imgType,
    quality,
    pixelRatio,
  ]);

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
