import { useState, useCallback } from "react";
import { IoMdDownload } from "react-icons/io";

import { Button } from "@/components/shared/Button/Button";
import { Input } from "@/components/shared/Input/Input";
import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { DropDownSelect } from "@/components/top8/DropDownSelect/DropDownSelect";
import { isIOS } from "@/utils/isIOS";

// TODO: Create export config modal

const dataURLtoBlob = (dataURL: string): Blob => {
  const parts = dataURL.split(",");
  const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
};

type Props = {
  className?: string;
};

type ImgTypes = "png" | "jpeg" | "webp";
const fileExtensions: Record<ImgTypes, string> = {
  png: "png",
  jpeg: "jpeg",
  webp: "webp",
};

// TODO: Add image type selection + quality selection
export const CanvasDownloader = ({ className }: Props) => {
  const [filename, setFilename] = useState("");
  const [imgType, setImgType] = useState<ImgTypes>("png");
  const stageRef = useCanvasStore((state) => state.stageRef);
  const dispatch = usePlayerStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);

  const handleDownload = useCallback(async () => {
    if (!stageRef) return;

    dispatch({ type: "CLEAR_SELECTED_PLAYER" });
    tournamentDispatch({ type: "CLEAR_SELECTED_ELEMENT" });

    await new Promise((resolve) => setTimeout(resolve, 50));

    const mimeType = `image/${imgType}`;
    const dataURL = stageRef.toDataURL({
      pixelRatio: 2,
      mimeType,
      quality: 2,
    });

    const finalFilename = `${filename || "ranker"}.${fileExtensions[imgType]}`;

    if (navigator.share && isIOS()) {
      try {
        const blob = dataURLtoBlob(dataURL);
        const file = new File([blob], finalFilename, { type: mimeType });

        await navigator.share({
          files: [file],
          title: finalFilename,
        });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }

    if (isIOS()) {
      const blob = dataURLtoBlob(dataURL);
      const blobURL = URL.createObjectURL(blob);
      const newWindow = window.open(blobURL, "_blank");

      if (newWindow) {
        newWindow.onload = () => {
          setTimeout(() => URL.revokeObjectURL(blobURL), 100);
        };
      } else {
        window.location.href = blobURL;
      }
      return;
    }

    const link = document.createElement("a");
    link.download = finalFilename;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [stageRef, filename, dispatch, tournamentDispatch, imgType]);

  return (
    <div className={className}>
      <Input
        label="Filename"
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
        options={Object.entries(fileExtensions).map(([key]) => ({
          value: key,
          id: key,
          display: key.toUpperCase(),
        }))}
        selectedValue={imgType}
        onChange={(value) => {
          setImgType(value[0].value);
        }}
      />
      <Button disabled={!stageRef} onClick={handleDownload}>
        <IoMdDownload style={{ minWidth: "1em" }} /> Download
      </Button>
    </div>
  );
};
