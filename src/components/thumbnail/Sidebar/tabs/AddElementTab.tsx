import {
  FaCircle,
  FaFlag,
  FaFont,
  FaImage,
  FaPersonRays,
  FaSquare,
  FaTrophy,
} from "react-icons/fa6";

import { useThumbnailStore } from "@/store/thumbnailStore";
import { useThumbnailEditorStore } from "@/store/thumbnailEditorStore";
import { useFontStore } from "@/store/fontStore";
import { uuid } from "@/utils/thumbnail/uuid";
import { ThumbnailElement } from "@/types/thumbnail/ThumbnailDesign";
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_SHAPE_FILL,
  DEFAULT_TEXT_FILL,
} from "@/consts/thumbnail/defaults";

import styles from "./AddElementTab.module.scss";

const useAddElement = () => {
  const dispatch = useThumbnailStore((s) => s.dispatch);
  const pushHistory = useThumbnailStore((s) => s.pushHistory);
  const design = useThumbnailStore((s) => s.design);
  const setSelectedIds = useThumbnailEditorStore((s) => s.setSelectedIds);

  return (element: ThumbnailElement) => {
    dispatch({ type: "ADD_ELEMENT", payload: element });
    pushHistory({
      type: "THUMBNAIL_ELEMENT_ADD",
      undoData: { element, index: design.elements.length },
      redoData: { element, index: design.elements.length },
    });
    setSelectedIds([element.id]);
  };
};

const baseElement = (
  partial: Partial<ThumbnailElement>,
  cw: number,
  ch: number,
  width: number,
  height: number,
) => ({
  id: uuid(),
  x: cw / 2 - width / 2,
  y: ch / 2 - height / 2,
  width,
  height,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  ...partial,
});

export const AddElementTab = () => {
  const addElement = useAddElement();
  const canvasSize = useThumbnailStore((s) => s.design.canvasSize);
  const selectedFont = useFontStore((s) => s.selectedFont) || "Arial";

  const cw = canvasSize.width;
  const ch = canvasSize.height;

  const onAddText = () => {
    addElement(
      baseElement(
        {
          type: "text",
          text: "Heading",
          fontFamily: selectedFont,
          fontSize: DEFAULT_FONT_SIZE,
          fontStyle: "bold",
          fill: DEFAULT_TEXT_FILL,
          align: "center",
          name: "Text",
        },
        cw,
        ch,
        600,
        80,
      ) as ThumbnailElement,
    );
  };

  const onAddRect = () => {
    addElement(
      baseElement(
        {
          type: "shape",
          shape: "rect",
          fill: DEFAULT_SHAPE_FILL,
          name: "Rectangle",
        },
        cw,
        ch,
        300,
        200,
      ) as ThumbnailElement,
    );
  };

  const onAddCircle = () => {
    addElement(
      baseElement(
        {
          type: "shape",
          shape: "circle",
          fill: DEFAULT_SHAPE_FILL,
          name: "Circle",
        },
        cw,
        ch,
        220,
        220,
      ) as ThumbnailElement,
    );
  };

  const onAddCharacter = () => {
    addElement(
      baseElement(
        {
          type: "character",
          characterId: "1293",
          alt: 0,
          imageType: "main",
          flipX: false,
          name: "Character",
        },
        cw,
        ch,
        420,
        420,
      ) as ThumbnailElement,
    );
  };

  const onAddFlag = () => {
    addElement(
      baseElement(
        {
          type: "flag",
          country: "us",
          name: "Flag",
        },
        cw,
        ch,
        160,
        120,
      ) as ThumbnailElement,
    );
  };

  const onAddTournamentIcon = () => {
    addElement(
      baseElement(
        {
          type: "tournamentIcon",
          name: "Tournament icon",
          cornerRadius: 16,
        },
        cw,
        ch,
        220,
        220,
      ) as ThumbnailElement,
    );
  };

  const onAddImage = () => {
    addElement(
      baseElement(
        {
          type: "image",
          src: "",
          fillMode: "cover",
          name: "Image",
        },
        cw,
        ch,
        400,
        400,
      ) as ThumbnailElement,
    );
  };

  return (
    <div className={styles.grid}>
      <button className={styles.button} onClick={onAddText}>
        <FaFont />
        Text
      </button>
      <button className={styles.button} onClick={onAddRect}>
        <FaSquare />
        Rectangle
      </button>
      <button className={styles.button} onClick={onAddCircle}>
        <FaCircle />
        Circle
      </button>
      <button className={styles.button} onClick={onAddImage}>
        <FaImage />
        Image
      </button>
      <button className={styles.button} onClick={onAddCharacter}>
        <FaPersonRays />
        Character
      </button>
      <button className={styles.button} onClick={onAddFlag}>
        <FaFlag />
        Flag
      </button>
      <button className={styles.button} onClick={onAddTournamentIcon}>
        <FaTrophy />
        Tournament
      </button>
    </div>
  );
};
