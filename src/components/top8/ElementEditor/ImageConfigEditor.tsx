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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newConfig = {
      ...elementConfig,
      src: event.target.value,
    };
    setElementConfig(newConfig);
    debouncedUpdateElementConfig(newConfig);
  };

  const debouncedUpdateElementConfig = useMemo(
    () =>
      debounce((elementConfig: ImageElementConfig) => {
        onUpdateElement(elementConfig);
      }, 100),
    [onUpdateElement]
  );

  return (
    <div>
      <label htmlFor="src">Image Source</label>
      <input
        id="src"
        type="text"
        value={elementConfig.src}
        onChange={handleChange}
      />
    </div>
  );
};
