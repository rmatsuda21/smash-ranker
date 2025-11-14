import {
  memo,
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import { LuChevronsUpDown } from "react-icons/lu";

import styles from "./DropDownSelect.module.scss";

type Item<T> = {
  value: T;
  id: string;
  display: string;
  imageSrc?: string;
};

type Props<T> = {
  options: Item<T>[];
  selectedValue: T;
  onChange: (values: any[]) => void;
  disabled?: boolean;
  placeholder?: string;
};

const SelectItemComponent = memo(
  ({
    display,
    imageSrc,
    isSelected,
    onClick,
  }: {
    display: string;
    imageSrc?: string;
    isSelected: boolean;
    onClick: () => void;
  }) => {
    return (
      <div
        className={styles.item}
        data-state={isSelected ? "checked" : undefined}
        onClick={onClick}
        role="option"
        aria-selected={isSelected}
        tabIndex={0}
      >
        <div className={styles.itemContent}>
          {imageSrc && (
            <img
              width={24}
              height={24}
              src={imageSrc}
              alt={display ?? ""}
              loading="lazy"
            />
          )}
          {display}
        </div>
      </div>
    );
  }
);
SelectItemComponent.displayName = "SelectItemComponent";

export const DropDownSelect = <T,>({
  options,
  selectedValue,
  onChange,
  placeholder,
  disabled = false,
}: Props<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAbove, setShowAbove] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const focusedItemRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === selectedValue);
  }, [options, selectedValue]);

  const optionsMap = useMemo(() => {
    return new Map(options.map((option) => [option.id, option]));
  }, [options]);

  const handleValueChange = useCallback(
    (value: string) => {
      const selectedItem = optionsMap.get(value);
      if (selectedItem) {
        onChange([selectedItem]);
      }
      setIsOpen(false);
    },
    [optionsMap, onChange]
  );

  const toggleDropdown = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  }, [disabled, isOpen]);

  useEffect(() => {
    if (!isOpen || !triggerRef.current || !dropdownRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = dropdownRef.current.offsetHeight;
    const viewportHeight = window.innerHeight;
    const buffer = 16;
    const spaceBelow = viewportHeight - triggerRect.bottom - buffer;
    const spaceAbove = triggerRect.top - buffer;

    const shouldShowAbove =
      spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;
    setShowAbove(shouldShowAbove);
  }, [isOpen, options.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const focusPreviousItem = () => {
        if (focusedItemRef.current) {
          const previousItem = focusedItemRef.current
            .previousElementSibling as HTMLDivElement;
          if (previousItem) {
            previousItem.focus();
            focusedItemRef.current = previousItem;
          }
        }
      };

      const focusNextItem = () => {
        if (focusedItemRef.current) {
          const nextItem = focusedItemRef.current
            .nextElementSibling as HTMLDivElement;
          if (nextItem) {
            nextItem.focus();
            focusedItemRef.current = nextItem;
          }
        }
      };

      switch (event.key) {
        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case "ArrowUp":
          event.preventDefault();
          focusPreviousItem();
          break;
        case "ArrowDown":
          event.preventDefault();
          focusNextItem();
          break;
        case "Tab":
          event.preventDefault();
          if (event.shiftKey) {
            focusPreviousItem();
          } else {
            focusNextItem();
          }
          break;
        case "Enter":
          event.preventDefault();
          focusedItemRef.current?.click();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useLayoutEffect(() => {
    if (isOpen && dropdownRef.current) {
      const checkedElement = dropdownRef.current?.querySelector(
        '[data-state="checked"]'
      );
      if (checkedElement) {
        (checkedElement as HTMLElement).scrollIntoView({ block: "nearest" });
        focusedItemRef.current = checkedElement as HTMLDivElement;
      }
    } else {
      focusedItemRef.current = null;
    }

    return () => {
      focusedItemRef.current = null;
    };
  }, [isOpen, dropdownRef]);

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        onClick={toggleDropdown}
        disabled={disabled}
        data-disabled={disabled ? "" : undefined}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        type="button"
      >
        {selectedOption ? (
          <div className={styles.content}>
            {selectedOption.imageSrc && (
              <img
                width={24}
                height={24}
                src={selectedOption.imageSrc}
                alt={selectedOption.display ?? ""}
                loading="eager"
              />
            )}
            {selectedOption.display}
          </div>
        ) : (
          <div className={styles.content}>
            <span className={styles.placeholder}>{placeholder}</span>
          </div>
        )}
        <span className={styles.icon}>
          <LuChevronsUpDown />
        </span>
      </button>

      {isOpen && (
        <div
          className={styles.content_dropdown}
          data-state="open"
          data-show-above={showAbove ? "" : undefined}
          role="listbox"
        >
          <div className={styles.viewport} ref={dropdownRef}>
            {options.map((option) => (
              <SelectItemComponent
                key={option.id}
                display={option.display}
                imageSrc={option.imageSrc}
                isSelected={option.value === selectedValue}
                onClick={() => handleValueChange(option.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
