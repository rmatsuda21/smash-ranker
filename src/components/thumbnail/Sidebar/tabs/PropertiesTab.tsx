import { useCallback, useMemo } from "react";
import {
  FaAlignCenter,
  FaAlignLeft,
  FaAlignRight,
  FaArrowsRotate,
  FaClone,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaLockOpen,
  FaObjectGroup,
  FaObjectUngroup,
  FaTrash,
} from "react-icons/fa6";
import cn from "classnames";

import { useThumbnailStore } from "@/store/thumbnailStore";
import { useThumbnailEditorStore } from "@/store/thumbnailEditorStore";
import {
  CharacterElement,
  FlagElement,
  ImageElement,
  ShapeElement,
  TextElement,
  ThumbnailElement,
  TournamentIconElement,
} from "@/types/thumbnail/ThumbnailDesign";
import { ColorInput } from "@/components/shared/ColorInput/ColorInput";
import { CharacterSelect } from "@/components/top8/CharacterEditor/CharacterSelect/CharacterSelect";
import { CharacterAltPicker } from "@/components/top8/CharacterEditor/CharacterAltPicker/CharacterAltPicker";
import { FlagPicker } from "@/components/thumbnail/Pickers/FlagPicker";
import { AssetPickerButton } from "@/components/thumbnail/Pickers/AssetPickerButton";
import { TextFontSelect } from "@/components/thumbnail/Pickers/TextFontSelect";
import { useElementActions } from "@/components/thumbnail/useElementActions";
import { getSelectedGroupIds } from "@/utils/thumbnail/groups";
import { findElement } from "@/utils/thumbnail/elementTree";
import { Button } from "@/components/shared/Button/Button";
import { Checkbox } from "@/components/shared/Checkbox/Checkbox";

import styles from "./PropertiesTab.module.scss";

const useUpdate = () => {
  const dispatch = useThumbnailStore((s) => s.dispatch);
  const pushHistory = useThumbnailStore((s) => s.pushHistory);
  return useCallback(
    (id: string, before: ThumbnailElement, patch: Partial<ThumbnailElement>) => {
      const undoPatch: Partial<ThumbnailElement> = Object.fromEntries(
        Object.keys(patch).map((k) => [
          k,
          (before as Record<string, unknown>)[k],
        ]),
      ) as Partial<ThumbnailElement>;
      dispatch({ type: "UPDATE_ELEMENT", payload: { id, patch } });
      pushHistory({
        type: "THUMBNAIL_ELEMENT_UPDATE",
        undoData: [{ id, patch: undoPatch }],
        redoData: [{ id, patch }],
      });
    },
    [dispatch, pushHistory],
  );
};

const useRemove = () => {
  const dispatch = useThumbnailStore((s) => s.dispatch);
  const pushHistory = useThumbnailStore((s) => s.pushHistory);
  const design = useThumbnailStore((s) => s.design);
  const clearSelection = useThumbnailEditorStore((s) => s.clearSelection);
  return (ids: string[]) => {
    const removed = design.elements
      .map((element, index) => (ids.includes(element.id) ? { element, index } : null))
      .filter((x): x is { element: ThumbnailElement; index: number } => Boolean(x));
    dispatch({ type: "REMOVE_ELEMENTS", payload: { ids } });
    pushHistory({
      type: "THUMBNAIL_ELEMENT_REMOVE",
      undoData: removed,
      redoData: removed,
    });
    clearSelection();
  };
};

const useDuplicate = () => {
  const dispatch = useThumbnailStore((s) => s.dispatch);
  const pushHistory = useThumbnailStore((s) => s.pushHistory);
  const setSelectedIds = useThumbnailEditorStore((s) => s.setSelectedIds);
  return (ids: string[]) => {
    const before = useThumbnailStore.getState().design.elements;
    dispatch({ type: "DUPLICATE_ELEMENTS", payload: { ids } });
    const after = useThumbnailStore.getState().design.elements;
    const added = after.slice(before.length);
    const addedIds = added.map((el) => el.id);
    pushHistory({
      type: "THUMBNAIL_ELEMENT_DUPLICATE",
      undoData: { addedIds, clones: added },
      redoData: { addedIds, clones: added },
    });
    setSelectedIds(addedIds);
  };
};

export const PropertiesTab = () => {
  const selectedIds = useThumbnailEditorStore((s) => s.selectedIds);
  const design = useThumbnailStore((s) => s.design);
  const update = useUpdate();
  const remove = useRemove();
  const duplicate = useDuplicate();

  // Walk the full tree (not just top level) so elements nested in groups
  // resolve when selected via the Layers panel.
  const elements = useMemo(
    () =>
      selectedIds
        .map((id) => findElement(design.elements, id))
        .filter((el): el is ThumbnailElement => Boolean(el)),
    [design.elements, selectedIds],
  );

  if (elements.length === 0) {
    return (
      <div className={styles.empty}>
        Select an element on the canvas to edit its properties.
      </div>
    );
  }

  if (elements.length > 1) {
    return (
      <MultiSelectionProperties
        elements={elements}
        onDuplicate={() => duplicate(elements.map((e) => e.id))}
        onRemove={() => remove(elements.map((e) => e.id))}
      />
    );
  }

  const element = elements[0];
  return (
    <SingleElementProperties
      element={element}
      update={update}
      remove={() => remove([element.id])}
      duplicate={() => duplicate([element.id])}
    />
  );
};

const MultiSelectionProperties = ({
  elements,
  onDuplicate,
  onRemove,
}: {
  elements: ThumbnailElement[];
  onDuplicate: () => void;
  onRemove: () => void;
}) => {
  const design = useThumbnailStore((s) => s.design);
  const actions = useElementActions();
  const ids = elements.map((e) => e.id);
  const selectedGroupIds = getSelectedGroupIds(ids, design.elements);
  const canGroup = elements.length >= 2;
  const canUngroup = selectedGroupIds.length > 0;
  return (
    <div>
      <div className={styles.section}>
        <h4>{elements.length} elements selected</h4>
        <div className={styles.actions}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => actions.groupIds(ids)}
            disabled={!canGroup}
            title="Group (Cmd+G)"
          >
            <FaObjectGroup /> Group
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => actions.ungroupSelection(ids)}
            disabled={!canUngroup}
            title="Ungroup (Cmd+Shift+G)"
          >
            <FaObjectUngroup /> Ungroup
          </Button>
          <Button variant="outline" size="sm" onClick={onDuplicate}>
            <FaClone /> Duplicate
          </Button>
          <Button variant="outline" size="sm" onClick={onRemove}>
            <FaTrash /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

const SingleElementProperties = ({
  element,
  update,
  remove,
  duplicate,
}: {
  element: ThumbnailElement;
  update: (id: string, before: ThumbnailElement, patch: Partial<ThumbnailElement>) => void;
  remove: () => void;
  duplicate: () => void;
}) => {
  return (
    <div>
      <CommonProperties element={element} update={update} />
      <TransformProperties element={element} update={update} />
      {element.type === "text" && (
        <TextProperties element={element} update={update} />
      )}
      {element.type === "image" && (
        <ImageProperties element={element} update={update} />
      )}
      {element.type === "character" && (
        <CharacterProperties element={element} update={update} />
      )}
      {element.type === "flag" && (
        <FlagProperties element={element} update={update} />
      )}
      {element.type === "tournamentIcon" && (
        <TournamentIconProperties element={element} update={update} />
      )}
      {element.type === "shape" && (
        <ShapeProperties element={element} update={update} />
      )}
      <div className={styles.section}>
        <h4>Actions</h4>
        <div className={styles.actions}>
          <Button variant="outline" size="sm" onClick={duplicate}>
            <FaClone /> Duplicate
          </Button>
          <Button variant="outline" size="sm" onClick={remove}>
            <FaTrash /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

const CommonProperties = ({
  element,
  update,
}: {
  element: ThumbnailElement;
  update: (id: string, before: ThumbnailElement, patch: Partial<ThumbnailElement>) => void;
}) => {
  return (
    <div className={styles.section}>
      <h4>General</h4>
      <div className={styles.row}>
        <label>Name</label>
        <input
          type="text"
          value={element.name ?? ""}
          onChange={(e) =>
            update(element.id, element, { name: e.target.value })
          }
        />
      </div>
      <div className={styles.row}>
        <label>Opacity</label>
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={element.opacity}
          onChange={(e) =>
            update(element.id, element, { opacity: Number(e.target.value) })
          }
        />
      </div>
      <div className={styles.actions}>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            update(element.id, element, { visible: !element.visible })
          }
        >
          {element.visible ? <FaEye /> : <FaEyeSlash />}
          {element.visible ? "Visible" : "Hidden"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            update(element.id, element, { locked: !element.locked })
          }
        >
          {element.locked ? <FaLock /> : <FaLockOpen />}
          {element.locked ? "Locked" : "Unlocked"}
        </Button>
      </div>
    </div>
  );
};

const TransformProperties = ({
  element,
  update,
}: {
  element: ThumbnailElement;
  update: (id: string, before: ThumbnailElement, patch: Partial<ThumbnailElement>) => void;
}) => {
  return (
    <div className={styles.section}>
      <h4>Transform</h4>
      <div className={styles.rowGroup}>
        <div>
          <label>X</label>
          <input
            type="number"
            value={Math.round(element.x)}
            onChange={(e) =>
              update(element.id, element, { x: Number(e.target.value) })
            }
          />
        </div>
        <div>
          <label>Y</label>
          <input
            type="number"
            value={Math.round(element.y)}
            onChange={(e) =>
              update(element.id, element, { y: Number(e.target.value) })
            }
          />
        </div>
        <div>
          <label>W</label>
          <input
            type="number"
            value={Math.round(element.width)}
            onChange={(e) =>
              update(element.id, element, {
                width: Math.max(8, Number(e.target.value)),
              })
            }
          />
        </div>
        <div>
          <label>H</label>
          <input
            type="number"
            value={Math.round(element.height)}
            onChange={(e) =>
              update(element.id, element, {
                height: Math.max(8, Number(e.target.value)),
              })
            }
          />
        </div>
      </div>
      <div className={styles.row}>
        <label>
          <FaArrowsRotate style={{ marginRight: 4 }} /> Rotation
        </label>
        <input
          type="number"
          step={1}
          value={Math.round(element.rotation)}
          onChange={(e) =>
            update(element.id, element, { rotation: Number(e.target.value) })
          }
        />
      </div>
    </div>
  );
};

const TextProperties = ({
  element,
  update,
}: {
  element: TextElement;
  update: (id: string, before: ThumbnailElement, patch: Partial<ThumbnailElement>) => void;
}) => {
  const isBold = element.fontStyle.includes("bold");
  const isItalic = element.fontStyle.includes("italic");

  const updateFontStyle = (bold: boolean, italic: boolean) => {
    let style = "";
    if (italic) style = "italic";
    if (bold) style = style ? `${style} bold` : "bold";
    if (!style) style = "normal";
    update(element.id, element, { fontStyle: style });
  };

  return (
    <div className={styles.section}>
      <h4>Text</h4>
      <div className={styles.row}>
        <label>Content</label>
        <textarea
          value={element.text}
          onChange={(e) =>
            update(element.id, element, { text: e.target.value })
          }
        />
      </div>
      <div className={styles.row}>
        <label>Font</label>
        <TextFontSelect
          value={element.fontFamily}
          onChange={(fontFamily) =>
            update(element.id, element, { fontFamily })
          }
        />
      </div>
      <div className={styles.rowGroup}>
        <div>
          <label>Size</label>
          <input
            type="number"
            value={Math.round(element.fontSize)}
            onChange={(e) =>
              update(element.id, element, {
                fontSize: Math.max(4, Number(e.target.value)),
              })
            }
          />
        </div>
        <div>
          <label>Letter spacing</label>
          <input
            type="number"
            step={0.5}
            value={element.letterSpacing ?? 0}
            onChange={(e) =>
              update(element.id, element, {
                letterSpacing: Number(e.target.value),
              })
            }
          />
        </div>
      </div>
      <div className={styles.actions}>
        <Checkbox
          checked={isBold}
          onChange={(checked) => updateFontStyle(checked, isItalic)}
          label="Bold"
        />
        <Checkbox
          checked={isItalic}
          onChange={(checked) => updateFontStyle(isBold, checked)}
          label="Italic"
        />
      </div>
      <Checkbox
        checked={Boolean(element.autoFit)}
        onChange={(checked) =>
          update(element.id, element, { autoFit: checked })
        }
        label="Auto-fit to box (lock size, shrink font to fit)"
      />
      <div className={styles.row}>
        <label>Align</label>
        <div className={styles.alignButtons}>
          <button
            type="button"
            className={cn({ [styles.active]: element.align === "left" })}
            onClick={() => update(element.id, element, { align: "left" })}
          >
            <FaAlignLeft />
          </button>
          <button
            type="button"
            className={cn({ [styles.active]: element.align === "center" })}
            onClick={() => update(element.id, element, { align: "center" })}
          >
            <FaAlignCenter />
          </button>
          <button
            type="button"
            className={cn({ [styles.active]: element.align === "right" })}
            onClick={() => update(element.id, element, { align: "right" })}
          >
            <FaAlignRight />
          </button>
        </div>
      </div>
      <div className={styles.row}>
        <label>V-Align</label>
        <div className={styles.alignButtons}>
          <button
            type="button"
            className={cn({
              [styles.active]: (element.verticalAlign ?? "top") === "top",
            })}
            onClick={() =>
              update(element.id, element, { verticalAlign: "top" })
            }
            title="Top"
          >
            <FaAlignLeft style={{ transform: "rotate(90deg)" }} />
          </button>
          <button
            type="button"
            className={cn({
              [styles.active]: element.verticalAlign === "middle",
            })}
            onClick={() =>
              update(element.id, element, { verticalAlign: "middle" })
            }
            title="Middle"
          >
            <FaAlignCenter style={{ transform: "rotate(90deg)" }} />
          </button>
          <button
            type="button"
            className={cn({
              [styles.active]: element.verticalAlign === "bottom",
            })}
            onClick={() =>
              update(element.id, element, { verticalAlign: "bottom" })
            }
            title="Bottom"
          >
            <FaAlignRight style={{ transform: "rotate(90deg)" }} />
          </button>
        </div>
      </div>
      <div className={styles.row}>
        <label>Color</label>
        <ColorInput
          color={element.fill}
          onChange={(color) => update(element.id, element, { fill: color })}
        />
      </div>
      <div className={styles.row}>
        <label>Stroke</label>
        <ColorInput
          color={element.stroke ?? "#000000"}
          onChange={(color) => update(element.id, element, { stroke: color })}
        />
      </div>
      <div className={styles.row}>
        <label>Stroke W</label>
        <input
          type="number"
          min={0}
          step={0.5}
          value={element.strokeWidth ?? 0}
          onChange={(e) =>
            update(element.id, element, {
              strokeWidth: Number(e.target.value),
            })
          }
        />
      </div>
    </div>
  );
};

const ImageProperties = ({
  element,
  update,
}: {
  element: ImageElement;
  update: (id: string, before: ThumbnailElement, patch: Partial<ThumbnailElement>) => void;
}) => {
  return (
    <div className={styles.section}>
      <h4>Image</h4>
      <AssetPickerButton
        src={element.src}
        label="Image"
        onChange={(src) => update(element.id, element, { src })}
        onClear={() => update(element.id, element, { src: "" })}
      />
      <div className={styles.row}>
        <label>Fit</label>
        <select
          value={element.fillMode}
          onChange={(e) =>
            update(element.id, element, {
              fillMode: e.target.value as "contain" | "cover",
            })
          }
        >
          <option value="cover">Cover (fill, crop)</option>
          <option value="contain">Contain (fit, no crop)</option>
        </select>
      </div>
      <div className={styles.row}>
        <label>Corner radius</label>
        <input
          type="number"
          min={0}
          value={element.cornerRadius ?? 0}
          onChange={(e) =>
            update(element.id, element, {
              cornerRadius: Math.max(0, Number(e.target.value)),
            })
          }
        />
      </div>
    </div>
  );
};

const CharacterProperties = ({
  element,
  update,
}: {
  element: CharacterElement;
  update: (id: string, before: ThumbnailElement, patch: Partial<ThumbnailElement>) => void;
}) => {
  return (
    <div className={styles.section}>
      <h4>Character</h4>
      <div className={styles.row}>
        <label>Character</label>
        <CharacterSelect
          selectedCharacter={{ id: element.characterId, alt: element.alt as 0 }}
          onValueChange={(id) =>
            update(element.id, element, { characterId: id, alt: 0 })
          }
        />
      </div>
      <CharacterAltPicker
        selectedCharacter={{ id: element.characterId, alt: element.alt as 0 }}
        onAltChange={(alt) => update(element.id, element, { alt: alt as number })}
      />
      <div className={styles.row}>
        <label>Image type</label>
        <select
          value={element.imageType}
          onChange={(e) =>
            update(element.id, element, {
              imageType: e.target.value as "stock" | "main",
            })
          }
        >
          <option value="main">Splash art</option>
          <option value="stock">Stock icon</option>
        </select>
      </div>
      <div className={styles.row}>
        <label>Fit</label>
        <select
          value={element.fillMode ?? "cover"}
          onChange={(e) =>
            update(element.id, element, {
              fillMode: e.target.value as "contain" | "cover",
            })
          }
        >
          <option value="cover">Cover (fill, crop)</option>
          <option value="contain">Contain (fit, no crop)</option>
        </select>
      </div>
      <Checkbox
        checked={Boolean(element.flipX)}
        onChange={(checked) =>
          update(element.id, element, { flipX: checked })
        }
        label="Flip horizontally"
      />
    </div>
  );
};

const FlagProperties = ({
  element,
  update,
}: {
  element: FlagElement;
  update: (id: string, before: ThumbnailElement, patch: Partial<ThumbnailElement>) => void;
}) => {
  return (
    <div className={styles.section}>
      <h4>Flag</h4>
      <FlagPicker
        selected={element.country}
        onSelect={(code) => update(element.id, element, { country: code })}
      />
    </div>
  );
};

const TournamentIconProperties = ({
  element,
  update,
}: {
  element: TournamentIconElement;
  update: (id: string, before: ThumbnailElement, patch: Partial<ThumbnailElement>) => void;
}) => {
  return (
    <div className={styles.section}>
      <h4>Tournament icon</h4>
      <AssetPickerButton
        src={element.src}
        label="Icon"
        onChange={(src) => update(element.id, element, { src })}
        onClear={() => update(element.id, element, { src: undefined })}
      />
      <div className={styles.row}>
        <label>Corner radius</label>
        <input
          type="number"
          min={0}
          value={element.cornerRadius ?? 0}
          onChange={(e) =>
            update(element.id, element, {
              cornerRadius: Math.max(0, Number(e.target.value)),
            })
          }
        />
      </div>
    </div>
  );
};

const ShapeProperties = ({
  element,
  update,
}: {
  element: ShapeElement;
  update: (id: string, before: ThumbnailElement, patch: Partial<ThumbnailElement>) => void;
}) => {
  return (
    <div className={styles.section}>
      <h4>Shape</h4>
      <div className={styles.row}>
        <label>Shape</label>
        <select
          value={element.shape}
          onChange={(e) =>
            update(element.id, element, {
              shape: e.target.value as "rect" | "circle",
            })
          }
        >
          <option value="rect">Rectangle</option>
          <option value="circle">Circle</option>
        </select>
      </div>
      <div className={styles.row}>
        <label>Fill</label>
        <ColorInput
          color={element.fill}
          onChange={(color) => update(element.id, element, { fill: color })}
        />
      </div>
      <div className={styles.row}>
        <label>Stroke</label>
        <ColorInput
          color={element.stroke ?? "#000000"}
          onChange={(color) => update(element.id, element, { stroke: color })}
        />
      </div>
      <div className={styles.row}>
        <label>Stroke W</label>
        <input
          type="number"
          min={0}
          step={0.5}
          value={element.strokeWidth ?? 0}
          onChange={(e) =>
            update(element.id, element, {
              strokeWidth: Number(e.target.value),
            })
          }
        />
      </div>
      {element.shape === "rect" && (
        <div className={styles.row}>
          <label>Corner radius</label>
          <input
            type="number"
            min={0}
            value={element.cornerRadius ?? 0}
            onChange={(e) =>
              update(element.id, element, {
                cornerRadius: Math.max(0, Number(e.target.value)),
              })
            }
          />
        </div>
      )}
    </div>
  );
};
