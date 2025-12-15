import { useEffect, useMemo, useState } from "react";
import { Slider } from "@radix-ui/themes";
import debounce from "lodash/debounce";

import {
  SmartTextElementConfig,
  TextElementConfig,
} from "@/types/top8/LayoutTypes";
import { Input } from "@/components/shared/Input/Input";
import { ColorInput } from "@/components/shared/ColorInput/ColorInput";

import styles from "./TextConfigEditor.module.scss";

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
    const type = event.target.type;
    const value =
      type === "number" ? Number(event.target.value) : event.target.value;

    const newConfig = {
      ...elementConfig,
      [event.target.name]: value,
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
    <div className={styles.wrapper}>
      <Input
        label="Text"
        type="text"
        id="text"
        name="text"
        value={elementConfig.text}
        onChange={handleChange}
      />
      <div className={styles.grid}>
        <label className={styles.label}>Color</label>
        <label className={styles.label}>Font Size</label>
        <label className={styles.label}>Font Weight</label>
        <ColorInput
          color={elementConfig.fill ?? "#ffffff"}
          onChange={(color) => handleColorChange("fill", color)}
        />
        <Input
          type="number"
          id="fontSize"
          name="fontSize"
          value={elementConfig.fontSize ?? ""}
          onChange={handleChange}
        />
        <Slider
          className={styles.slider}
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
      </div>
    </div>
  );
};
