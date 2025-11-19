import {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";
import { LuChevronsUpDown } from "react-icons/lu";
import cn from "classnames";

import styles from "./DropDownSelect.module.scss";
import { Spinner } from "@radix-ui/themes";

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
  loading?: boolean;
};

const SelectItemComponent = ({
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
};

export const DropDownSelect = <T,>({
  options,
  selectedValue,
  onChange,
  placeholder,
  disabled = false,
  loading = false,
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
    const calculateShowAbove = () => {
      if (!triggerRef.current || !dropdownRef.current) return false;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;

      // Show above if dropdown would extend beyond viewport bottom
      return triggerRect.bottom + dropdownHeight > viewportHeight;
    };

    const handleResize = () => {
      const shouldShowAbove = calculateShowAbove();
      setShowAbove(shouldShowAbove);
    };

    setShowAbove(calculateShowAbove());
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [options.length]);

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
  }, [isOpen, dropdownRef]);

  const content = useMemo(() => {
    if (loading) return <Spinner size="3" />;
    if (selectedOption)
      return (
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
      );
    return placeholder;
  }, [loading, selectedOption, placeholder]);

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        onClick={toggleDropdown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        type="button"
        tabIndex={0}
      >
        {content}
        <LuChevronsUpDown className={styles.icon} />
      </button>

      <div
        className={cn(styles.dropdown, {
          [styles.open]: isOpen,
          [styles.showAbove]: showAbove,
        })}
        aria-hidden={!isOpen}
        aria-expanded={isOpen}
        role="listbox"
        aria-label="Select an option"
      >
        <div className={styles.window} ref={dropdownRef}>
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
    </div>
  );
};
