import {
  ThumbnailBackground,
  ThumbnailDesign,
  ThumbnailElement,
} from "./ThumbnailDesign";

export type ThumbnailAction =
  | { type: "LOAD_DESIGN"; payload: ThumbnailDesign }
  | { type: "RESET" }
  | { type: "SET_BACKGROUND"; payload: ThumbnailBackground }
  | { type: "SET_CANVAS_SIZE"; payload: { width: number; height: number } }
  | { type: "ADD_ELEMENT"; payload: ThumbnailElement }
  | { type: "ADD_ELEMENTS"; payload: ThumbnailElement[] }
  | { type: "REMOVE_ELEMENTS"; payload: { ids: string[] } }
  | {
      type: "UPDATE_ELEMENT";
      payload: { id: string; patch: Partial<ThumbnailElement> };
    }
  | {
      type: "UPDATE_ELEMENTS";
      payload: Array<{ id: string; patch: Partial<ThumbnailElement> }>;
    }
  | { type: "MOVE_TO_INDEX"; payload: { id: string; index: number } }
  | {
      type: "MOVE_ELEMENT";
      payload: {
        id: string;
        targetParentId: string | null;
        targetIndex: number;
      };
    }
  | { type: "REORDER_ELEMENTS"; payload: { ids: string[] } }
  | { type: "DUPLICATE_ELEMENTS"; payload: { ids: string[] } }
  | { type: "SET_VISIBILITY"; payload: { id: string; visible: boolean } }
  | { type: "SET_LOCKED"; payload: { id: string; locked: boolean } }
  | { type: "RENAME_ELEMENT"; payload: { id: string; name: string } }
  | {
      type: "GROUP_ELEMENTS";
      payload: { ids: string[]; group: { id: string; name?: string } };
    }
  | { type: "UNGROUP_ELEMENTS"; payload: { groupIds: string[] } }
  | { type: "RENAME_GROUP"; payload: { id: string; name: string } };
