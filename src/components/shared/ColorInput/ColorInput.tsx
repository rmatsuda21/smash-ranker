import { useEffect, useRef, useState } from "react";
import { HexAlphaColorPicker, HexColorInput } from "react-colorful";

import styles from "./ColorInput.module.scss";

type Props = {
  color: string;
  onChange: (color: string) => void;
};

export const ColorInput = ({ color, onChange }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <div
        className={styles.color}
        style={{ backgroundColor: color }}
        onClick={handleClick}
      />
      {isOpen && (
        <div className={styles.picker}>
          <HexAlphaColorPicker color={color} onChange={onChange} />
          <HexColorInput color={color} onChange={onChange} alpha />
        </div>
      )}
    </div>
  );
};
