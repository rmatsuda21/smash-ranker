import { Button } from "@radix-ui/themes";
import { useCallback, useState } from "react";

import { FontSelect } from "@/components/top8/CanvasConfig/FontSelect/FontSelect";
import { useCanvasStore } from "@/store/canvasStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { Input } from "@/components/shared/Input/Input";

type Props = {
  className?: string;
};

const isIOS = (): boolean => {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

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

export const CanvasConfig = ({ className }: Props) => {
  const [filename, setFilename] = useState("");
  const stageRef = useCanvasStore((state) => state.stageRef);
  const dispatch = usePlayerStore((state) => state.dispatch);
  const tournamentDispatch = useTournamentStore((state) => state.dispatch);

  const handleDownload = useCallback(async () => {
    if (!stageRef) return;

    dispatch({ type: "CLEAR_SELECTED_PLAYER" });
    tournamentDispatch({ type: "CLEAR_SELECTED_ELEMENT" });

    // Small delay to ensure selections are cleared before capturing
    await new Promise((resolve) => setTimeout(resolve, 50));

    const dataURL = stageRef.toDataURL({
      pixelRatio: 2,
    });

    const finalFilename = filename || "ranker.png";

    // Try Web Share API first (works well on iOS/iPad)
    if (navigator.share && isIOS()) {
      try {
        const blob = dataURLtoBlob(dataURL);
        const file = new File([blob], finalFilename, { type: "image/png" });

        await navigator.share({
          files: [file],
          title: finalFilename,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fall through to alternative
        if ((err as Error).name === "AbortError") return;
      }
    }

    // Fallback for iOS: open in new tab for long-press save
    if (isIOS()) {
      const blob = dataURLtoBlob(dataURL);
      const blobURL = URL.createObjectURL(blob);
      const newWindow = window.open(blobURL, "_blank");

      if (newWindow) {
        // Clean up blob URL after window loads
        newWindow.onload = () => {
          setTimeout(() => URL.revokeObjectURL(blobURL), 100);
        };
      } else {
        // If popup blocked, try direct navigation
        window.location.href = blobURL;
      }
      return;
    }

    // Standard download for desktop browsers
    const link = document.createElement("a");
    link.download = finalFilename;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [stageRef, filename, dispatch, tournamentDispatch]);

  return (
    <div className={className}>
      <Input
        label="Filename"
        id="filename"
        type="text"
        name="filename"
        value={filename}
        onChange={(event) => {
          setFilename(event.currentTarget.value);
        }}
        placeholder="ranker.png"
      />
      <FontSelect />

      <Button disabled={!stageRef} onClick={handleDownload}>
        Download
      </Button>
    </div>
  );
};
