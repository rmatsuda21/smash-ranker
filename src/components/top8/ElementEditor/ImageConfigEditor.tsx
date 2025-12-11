import { useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce";

import { ImageElementConfig } from "@/types/top8/LayoutTypes";

type Props = {
  element: ImageElementConfig;
  onUpdateElement: (element: ImageElementConfig) => void;
};

export const ImageConfigEditor = ({ element, onUpdateElement }: Props) => {
  const [elementConfig, setElementConfig] = useState(element);
  useEffect(() => {
    setElementConfig(element);
  }, [element]);

  const debouncedUpdateElementConfig = useMemo(
    () =>
      debounce((elementConfig: ImageElementConfig) => {
        onUpdateElement(elementConfig);
      }, 100),
    [onUpdateElement]
  );

  useEffect(() => {
    debouncedUpdateElementConfig(elementConfig);

    return () => {
      debouncedUpdateElementConfig.cancel();
    };
  }, [elementConfig, debouncedUpdateElementConfig]);

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
