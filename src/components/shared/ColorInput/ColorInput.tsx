import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HexAlphaColorPicker } from "react-colorful";
import { FaCheck, FaEyeDropper } from "react-icons/fa6";
import debounce from "lodash/debounce";

import cn from "classnames";
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

type Position = {
  top: number;
  left: number;
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
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

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

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) {
      setPosition(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const pickerWidth = 200;
    const pickerHeight = pickerRef.current?.offsetHeight ?? 290;
    const left = Math.max(
      8,
      Math.min(rect.left, window.innerWidth - pickerWidth - 8),
    );
    const wouldOverflowBottom =
      rect.bottom + 4 + pickerHeight > window.innerHeight - 8;
    const top = wouldOverflowBottom
      ? Math.max(8, rect.top - 4 - pickerHeight)
      : rect.bottom + 4;
    setPosition({ top, left });
  }, [isOpen]);

  // After the picker actually mounts, re-measure with its real height — the
  // first useLayoutEffect runs before pickerRef is attached so it falls back
  // to an estimate.
  useEffect(() => {
    if (!isOpen || !triggerRef.current || !pickerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const pickerHeight = pickerRef.current.offsetHeight;
    const pickerWidth = pickerRef.current.offsetWidth || 200;
    const left = Math.max(
      8,
      Math.min(rect.left, window.innerWidth - pickerWidth - 8),
    );
    const wouldOverflowBottom =
      rect.bottom + 4 + pickerHeight > window.innerHeight - 8;
    const top = wouldOverflowBottom
      ? Math.max(8, rect.top - 4 - pickerHeight)
      : rect.bottom + 4;
    setPosition((prev) =>
      prev && prev.top === top && prev.left === left ? prev : { top, left },
    );
  }, [isOpen, position]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;

      const clickedTrigger = triggerRef.current?.contains(event.target);
      const clickedPicker = pickerRef.current?.contains(event.target);

      if (!clickedTrigger && !clickedPicker) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

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
      {isOpen &&
        position &&
        createPortal(
          <div
            ref={pickerRef}
            className={styles.picker}
            style={{ top: position.top, left: position.left }}
            onMouseDown={(e) => e.stopPropagation()}
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
          </div>,
          document.body
        )}
    </div>
  );
};
