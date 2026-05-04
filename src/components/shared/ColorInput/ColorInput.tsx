import { useEffect, useMemo, useRef, useState } from "react";
import { HexAlphaColorPicker } from "react-colorful";
import { FaCheck, FaEyeDropper } from "react-icons/fa6";
import debounce from "lodash/debounce";
import cn from "classnames";

import { Popover } from "@/components/shared/Popover/Popover";

import styles from "./ColorInput.module.scss";

declare class EyeDropper {
  open(options?: { signal?: AbortSignal }): Promise<{ sRGBHex: string }>;
}

const supportsEyeDropper =
  typeof window !== "undefined" && "EyeDropper" in window;

const DEBOUNCE_TIME = 100;

type Props = {
  color: string;
  onChange: (color: string) => void;
  onClick?: () => void;
  className?: string;
};

const isValidHex = (value: string): boolean => {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(
    value
  );
};

const normalizeHex = (value: string): string => {
  let hex = value.startsWith("#") ? value : `#${value}`;
  hex = "#" + hex.slice(1).replace(/[^0-9A-Fa-f]/g, "");
  return hex;
};

export const ColorInput = ({ color, onChange, onClick, className }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalColor, setInternalColor] = useState(color);
  const [inputValue, setInputValue] = useState(color);
  const triggerRef = useRef<HTMLDivElement>(null);

  const debouncedOnChange = useMemo(
    () => debounce((value: string) => onChange(value), DEBOUNCE_TIME),
    [onChange]
  );

  useEffect(() => {
    return () => debouncedOnChange.cancel();
  }, [debouncedOnChange]);

  useEffect(() => {
    setInternalColor(color);
    setInputValue(color);
  }, [color]);

  const handleClick = () => {
    onClick?.();
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = normalizeHex(e.target.value);
    setInputValue(value);
  };

  const handleSubmit = () => {
    if (isValidHex(inputValue)) {
      onChange(inputValue.toLowerCase());
    } else {
      setInputValue(color);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleEyeDropper = async () => {
    try {
      const dropper = new EyeDropper();
      const result = await dropper.open();
      const hex = result.sRGBHex.toLowerCase() + "ff";
      setInternalColor(hex);
      setInputValue(hex);
      onChange(hex);
    } catch {
      // User cancelled (Escape) — ignore
    }
  };

  return (
    <div className={cn(styles.wrapper, className)}>
      <div
        ref={triggerRef}
        className={styles.color}
        style={{ backgroundColor: internalColor }}
        onClick={handleClick}
      />
      <Popover
        anchorRef={triggerRef}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        placement="bottom-start"
        offset={4}
        minWidth={200}
        className={styles.picker}
      >
        <HexAlphaColorPicker
          color={internalColor}
          onChange={(value) => {
            setInternalColor(value);
            setInputValue(value);
            debouncedOnChange(value);
          }}
        />
        <div className={styles.hexInput}>
          {supportsEyeDropper && (
            <button
              type="button"
              onClick={handleEyeDropper}
              className={styles.eyeDropperBtn}
              aria-label="Pick color from screen"
            >
              <FaEyeDropper size={18} />
            </button>
          )}
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onBlur={handleSubmit}
            maxLength={9}
            spellCheck={false}
          />
          <button
            type="button"
            onClick={handleSubmit}
            className={styles.submitBtn}
            aria-label="Apply color"
          >
            <FaCheck size={18} />
          </button>
        </div>
      </Popover>
    </div>
  );
};
