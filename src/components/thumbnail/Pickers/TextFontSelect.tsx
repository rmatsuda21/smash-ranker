import { useCallback, useMemo } from "react";

import {
  DropDownItem,
  DropDownSelect,
} from "@/components/shared/DropDownSelect/DropDownSelect";
import { useFontStore } from "@/store/fontStore";
import { FontOption } from "@/components/top8/DesignEditor/FontSelect/FontOption";
import { loadFamily } from "@/utils/fonts/fontLoader";

type Props = {
  value: string;
  onChange: (fontFamily: string) => void;
};

// Controlled font picker for per-element font selection. Uses the same
// DropDownSelect + FontOption (with live preview) as the Ranker, but does NOT
// touch the global selectedFont state — each text element owns its own font,
// so picking a font in one template never bleeds into another.
export const TextFontSelect = ({ value, onChange }: Props) => {
  const fonts = useFontStore((state) => state.fonts);
  const fetching = useFontStore((state) => state.fetching);
  const error = useFontStore((state) => state.error);

  const options = useMemo(
    () =>
      Array.from(fonts).map((font) => ({
        value: font.fontFamily,
        id: font.fontFamily,
        display: font.fontFamily,
      })),
    [fonts],
  );

  const handleChange = useCallback(
    (fontFamily: string) => {
      onChange(fontFamily);
      // Just load the font so it can render — don't update the global
      // `selectedFont` (that would leak into other templates).
      loadFamily(fontFamily).catch(() => {
        /* TextNode redraws on resolution and fails open to fallback fonts */
      });
    },
    [onChange],
  );

  const renderOption = useCallback(
    (option: DropDownItem<string>) => <FontOption option={option} />,
    [],
  );

  return (
    <DropDownSelect
      options={options}
      selectedValue={value}
      onChange={handleChange}
      loading={fetching}
      error={error}
      searchable
      renderOption={renderOption}
    />
  );
};
