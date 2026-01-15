import { useCallback, useMemo } from "react";

import {
  DropDownItem,
  DropDownSelect,
} from "@/components/top8/DropDownSelect/DropDownSelect";
import { useFontStore } from "@/store/fontStore";
import { FontOption } from "@/components/top8/DesignEditor/FontSelect/FontOption";

export const FontSelect = () => {
  const error = useFontStore((state) => state.error);
  const fonts = useFontStore((state) => state.fonts);
  const fetching = useFontStore((state) => state.fetching);
  const selectedFont = useFontStore((state) => state.selectedFont);
  const selectFont = useFontStore((state) => state.selectFont);

  const fontOptions = useMemo(() => {
    return Array.from(fonts).map((font) => ({
      value: font.fontFamily,
      id: font.fontFamily,
      display: font.fontFamily,
    }));
  }, [fonts]);

  const handleChange = useCallback(
    (fontFamily: string) => {
      selectFont(fontFamily);
    },
    [selectFont]
  );

  const renderFontOption = useCallback(
    (option: DropDownItem<string>) => <FontOption option={option} />,
    []
  );

  return (
    <DropDownSelect
      options={fontOptions}
      selectedValue={selectedFont}
      onChange={handleChange}
      loading={fetching}
      error={error}
      searchable
      renderOption={renderFontOption}
    />
  );
};
