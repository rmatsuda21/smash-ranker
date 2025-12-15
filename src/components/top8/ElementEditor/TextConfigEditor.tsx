import { useEffect, useMemo, useState } from "react";
import { Slider } from "@radix-ui/themes";
import debounce from "lodash/debounce";

import {
  SmartTextElementConfig,
  TextElementConfig,
} from "@/types/top8/LayoutTypes";
import { Input } from "@/components/shared/Input/Input";
import { ColorInput } from "@/components/shared/ColorInput/ColorInput";

type Props = {
  element: TextElementConfig | SmartTextElementConfig;
  onUpdateElement: (
    element: TextElementConfig | SmartTextElementConfig
  ) => void;
};

export const TextConfigEditor = ({ element, onUpdateElement }: Props) => {
  const [elementConfig, setElementConfig] = useState(element);

  useEffect(() => {
    setElementConfig(element);
  }, [element]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newConfig = {
      ...elementConfig,
      [event.target.name]: event.target.value,
    };
    setElementConfig(newConfig);
    debouncedUpdateElementConfig(newConfig);
  };

  const handleFontWeightChange = (value: number) => {
    const newConfig = {
      ...elementConfig,
      fontWeight: value,
    };
    setElementConfig(newConfig);
    debouncedUpdateElementConfig(newConfig);
  };

  const handleColorChange = (name: string, value: string) => {
    const newConfig = {
      ...elementConfig,
      [name]: value,
    };
    setElementConfig(newConfig);
    debouncedUpdateElementConfig(newConfig);
  };

  const debouncedUpdateElementConfig = useMemo(
    () =>
      debounce((elementConfig: TextElementConfig | SmartTextElementConfig) => {
        onUpdateElement(elementConfig);
      }, 100),
    [onUpdateElement]
  );

  return (
    <div>
      <Input
        label="Text"
        type="text"
        id="text"
        name="text"
        value={elementConfig.text}
        onChange={handleChange}
      />
      <Input
        label="Font Size"
        type="number"
        id="fontSize"
        name="fontSize"
        value={elementConfig.fontSize ?? ""}
        onChange={handleChange}
      />
      <label>Font Weight</label>
      <Slider
        id="fontWeight"
        name="fontWeight"
        value={[Number(elementConfig.fontWeight?.toString() ?? 0)]}
        min={100}
        max={900}
        step={100}
        onValueChange={(value) => {
          handleFontWeightChange(value[0]);
        }}
      />
      <label>Fill</label>
      <ColorInput
        color={elementConfig.fill ?? "#ffffff"}
        onChange={(color) => handleColorChange("fill", color)}
      />
      <Input
        label="Align"
        type="text"
        id="align"
        name="align"
        value={elementConfig.align ?? ""}
        onChange={handleChange}
      />
      <Input
        label="Vertical Align"
        type="text"
        id="verticalAlign"
        name="verticalAlign"
        value={elementConfig.verticalAlign ?? ""}
        onChange={handleChange}
      />
    </div>
  );
};
