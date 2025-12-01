import { useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce";

import { ImageElementConfig } from "@/types/top8/LayoutTypes";
import { useCanvasStore } from "@/store/canvasStore";

type Props = {
  element: ImageElementConfig;
  index: number;
};

export const ImageConfigEditor = ({ element, index }: Props) => {
  const [elementConfig, setElementConfig] = useState(element);
  const dispatch = useCanvasStore((state) => state.dispatch);
  useEffect(() => {
    setElementConfig(element);
  }, [element]);

  const debouncedUpdateElementConfig = useMemo(
    () =>
      debounce((elementConfig: ImageElementConfig) => {
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
      <label htmlFor="src">Image Source</label>
      <input
        id="src"
        type="text"
        value={elementConfig.src}
        onChange={(event) => {
          setElementConfig({
            ...elementConfig,
            src: event.currentTarget.value,
          });
        }}
      />
    </div>
  );
};
