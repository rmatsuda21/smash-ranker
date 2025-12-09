import { useEffect, useMemo, useState } from "react";
import { Slider } from "@radix-ui/themes";
import debounce from "lodash/debounce";

import { TextElementConfig } from "@/types/top8/LayoutTypes";
import { useCanvasStore } from "@/store/canvasStore";
import { Input } from "@/components/shared/Input/Input";

type Props = {
  element: TextElementConfig;
  index: number;
};

export const TextConfigEditor = ({ element, index }: Props) => {
  const [elementConfig, setElementConfig] = useState(element);
  const dispatch = useCanvasStore((state) => state.dispatch);

  useEffect(() => {
    setElementConfig(element);
  }, [element]);

  const debouncedUpdateElementConfig = useMemo(
    () =>
      debounce((elementConfig: TextElementConfig) => {
        dispatch({
          type: "EDIT_TOURNAMENT_ELEMENT",
          payload: { index, element: elementConfig },
        });
      }, 100),
    [dispatch, index]
  );

  useEffect(() => {
    debouncedUpdateElementConfig(elementConfig);

    return () => {
      debouncedUpdateElementConfig.cancel();
    };
  }, [elementConfig, index, debouncedUpdateElementConfig]);

  return (
    <div>
      <Input
        label="Text"
        type="text"
        id="text"
        value={elementConfig.text}
        onChange={(event) => {
          setElementConfig({
            ...elementConfig,
            text: event.currentTarget.value,
          });
        }}
      />
      <Input
        label="Font Size"
        type="number"
        id="fontSize"
        value={elementConfig.fontSize}
        onChange={(event) => {
          setElementConfig({
            ...elementConfig,
            fontSize: Number(event.currentTarget.value),
          });
        }}
      />
      <label htmlFor="fontWeight">Font Weight</label>
      <Slider
        id="fontWeight"
        value={[Number(elementConfig.fontWeight?.toString() ?? 0)]}
        min={100}
        max={900}
        step={100}
        onValueChange={(value) => {
          setElementConfig({
            ...elementConfig,
            fontWeight: String(value[0]),
          });
        }}
      />
      <label htmlFor="fill">Fill</label>
      <input
        id="fill"
        aria-label="Fill"
        type="color"
        value={elementConfig.fill}
        onChange={(event) => {
          setElementConfig({
            ...elementConfig,
            fill: event.currentTarget.value,
          });
        }}
      />
      <Input
        label="Align"
        type="text"
        id="align"
        value={elementConfig.align}
        onChange={(event) => {
          setElementConfig({
            ...elementConfig,
            align: event.currentTarget.value as "left" | "center" | "right",
          });
        }}
      />
      <Input
        label="Vertical Align"
        type="text"
        id="verticalAlign"
        value={elementConfig.verticalAlign}
        onChange={(event) => {
          setElementConfig({
            ...elementConfig,
            verticalAlign: event.currentTarget.value as
              | "top"
              | "middle"
              | "bottom",
          });
        }}
      />
    </div>
  );
};
