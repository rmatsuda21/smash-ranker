import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

import type {
  SocialPlatform,
  SocialTemplate,
} from "@/types/social/SocialTemplate";
import { DBSocialTemplate } from "@/types/Repository";
import { SocialTemplateStore } from "@/db/socialTemplate/store";
import { DEFAULT_TEMPLATE_ID } from "@/utils/social/builtInTemplates";

const dbStore = new SocialTemplateStore();

interface SocialPostState {
  selectedPlatform: SocialPlatform;
  selectedTemplateId: string;
  customTemplates: SocialTemplate[];
  customTemplatesLoaded: boolean;
}

type SocialPostAction =
  | { type: "SET_PLATFORM"; payload: SocialPlatform }
  | { type: "SET_TEMPLATE"; payload: string }
  | { type: "LOAD_CUSTOM_TEMPLATES"; payload: SocialTemplate[] }
  | { type: "ADD_CUSTOM_TEMPLATE"; payload: SocialTemplate }
  | { type: "DELETE_CUSTOM_TEMPLATE"; payload: string };

const initialState: SocialPostState = {
  selectedPlatform: "x",
  selectedTemplateId: DEFAULT_TEMPLATE_ID,
  customTemplates: [],
  customTemplatesLoaded: false,
};

const socialPostReducer = (
  state: SocialPostState,
  action: SocialPostAction,
): Partial<SocialPostState> => {
  switch (action.type) {
    case "SET_PLATFORM":
      return { selectedPlatform: action.payload };

    case "SET_TEMPLATE":
      return { selectedTemplateId: action.payload };

    case "LOAD_CUSTOM_TEMPLATES":
      return {
        customTemplates: action.payload,
        customTemplatesLoaded: true,
      };

    case "ADD_CUSTOM_TEMPLATE":
      return {
        customTemplates: [...state.customTemplates, action.payload],
        selectedTemplateId: action.payload.id,
      };

    case "DELETE_CUSTOM_TEMPLATE":
      return {
        customTemplates: state.customTemplates.filter(
          (t) => t.id !== action.payload,
        ),
        selectedTemplateId:
          state.selectedTemplateId === action.payload
            ? DEFAULT_TEMPLATE_ID
            : state.selectedTemplateId,
      };

    default:
      return {};
  }
};

interface SocialPostStore extends SocialPostState {
  dispatch: (action: SocialPostAction) => void;
}

export const useSocialPostStore = create<SocialPostStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        dispatch: (action: SocialPostAction) =>
          set((state) => socialPostReducer(state, action), false, action),
      }),
      {
        name: "social-post-store-v1",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          selectedPlatform: state.selectedPlatform,
          selectedTemplateId: state.selectedTemplateId,
        }),
      },
    ),
  ),
);

const fromDB = (record: DBSocialTemplate): SocialTemplate => ({
  id: record.id,
  name: record.name,
  body: record.body,
  isBuiltIn: false,
});

const toDB = (template: SocialTemplate): DBSocialTemplate => ({
  id: template.id,
  name: template.name,
  body: template.body,
  createdAt: new Date(),
});

export const loadCustomTemplates = async () => {
  const records = await dbStore.getAll();
  const sorted = [...records].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
  useSocialPostStore.getState().dispatch({
    type: "LOAD_CUSTOM_TEMPLATES",
    payload: sorted.map(fromDB),
  });
};

export const saveCustomTemplate = async (
  name: string,
  body: string,
): Promise<SocialTemplate> => {
  const id = `custom:${crypto.randomUUID()}`;
  const template: SocialTemplate = {
    id,
    name,
    body,
    isBuiltIn: false,
  };
  await dbStore.put(toDB(template));
  useSocialPostStore.getState().dispatch({
    type: "ADD_CUSTOM_TEMPLATE",
    payload: template,
  });
  return template;
};

export const deleteCustomTemplate = async (id: string) => {
  await dbStore.delete(id);
  useSocialPostStore.getState().dispatch({
    type: "DELETE_CUSTOM_TEMPLATE",
    payload: id,
  });
};
