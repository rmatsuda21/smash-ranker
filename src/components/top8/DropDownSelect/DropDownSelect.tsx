import { useMemo, useState, useRef, useEffect, useLayoutEffect } from "react";
import { LuChevronsUpDown } from "react-icons/lu";
import cn from "classnames";

import { Spinner } from "@/components/shared/Spinner/Spinner";

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
  onChange: (value: T) => void;
  disabled?: boolean;
  placeholder?: string;
  loading?: boolean;
};

const getDropdownStyles = (
  triggerEl: HTMLButtonElement | null,
  showAbove: boolean
): React.CSSProperties => {
  if (!triggerEl)
    return {
      width: 0,
      top: 0,
      left: 0,
    };

  const dropdownRect = triggerEl.getBoundingClientRect();
  const width = dropdownRect ? dropdownRect.width : triggerEl.clientWidth;
  const left = dropdownRect ? dropdownRect.left : 0;
  let top;
  let bottom;

  if (showAbove) {
    bottom = dropdownRect ? dropdownRect.bottom : 0;
  } else {
    top = dropdownRect ? dropdownRect.top + dropdownRect.height + 5 : 0;
  }

  const dropdownStyles: React.CSSProperties = {
    width,
    top,
    bottom,
    left,
  };

  return dropdownStyles;
};

const Item = ({
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

const TriggerContent = <T,>({
  loading,
  selectedOption,
  placeholder,
}: {
  loading: boolean;
  selectedOption?: Item<T>;
  placeholder: string;
}) => {
  if (loading) {
    return <Spinner size={20} />;
  }

  if (!selectedOption) {
    return <div className={styles.content}>{placeholder}</div>;
  }

  return (
    <>
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
    </>
  );
};

const Trigger = <T,>({
  ref,
  onClick,
  disabled,
  loading,
  selectedOption,
  placeholder,
}: {
  ref: React.RefObject<HTMLButtonElement | null>;
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  selectedOption?: Item<T>;
  placeholder: string;
}) => {
  return (
    <button
      ref={ref}
      className={styles.trigger}
      onClick={onClick}
      disabled={disabled}
      tabIndex={0}
    >
      <div className={styles.content}>
        <TriggerContent
          loading={loading}
          selectedOption={selectedOption}
          placeholder={placeholder}
        />
      </div>
      <LuChevronsUpDown className={styles.icon} />
    </button>
  );
};

export const DropDownSelect = <T,>({
  options,
  selectedValue,
  onChange,
  placeholder = "",
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

  const handleValueChange = (value: T) => {
    onChange(value);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const calculateShowAbove = () => {
      if (!triggerRef.current || !dropdownRef.current) return false;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;

      return triggerRect.bottom + dropdownHeight > viewportHeight;
    };

    const handleResize = () => {
      setShowAbove(calculateShowAbove());
    };

    handleResize();

    document.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("resize", handleResize);
    };
  }, []);

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
    const handleKeyDown = (e: KeyboardEvent) => {
      const focusPreviousItem = () => {
        if (focusedItemRef.current) {
          const previousItem = focusedItemRef.current
            .previousElementSibling as HTMLDivElement;

          if (previousItem) {
            previousItem.focus();
            focusedItemRef.current = previousItem;
          } else {
            const parent = focusedItemRef.current.parentElement;
            const lastEl = parent?.children[
              parent.children.length - 1
            ] as HTMLDivElement;

            if (lastEl) {
              lastEl.focus();
              focusedItemRef.current = lastEl;
            }
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
          } else {
            const parent = focusedItemRef.current.parentElement;
            const firstEl = parent?.children[0] as HTMLDivElement;
            if (firstEl) {
              firstEl.focus();
              focusedItemRef.current = firstEl;
            }
          }
        }
      };

      switch (e.key) {
        case "Escape":
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case "ArrowUp":
          focusPreviousItem();
          break;
        case "ArrowDown":
          focusNextItem();
          break;
        case "Tab":
          e.preventDefault();
          if (e.shiftKey) {
            focusPreviousItem();
          } else {
            focusNextItem();
          }
          break;
        case "Enter":
          e.preventDefault();
          focusedItemRef.current?.click();
          break;
      }
    };

    const container = containerRef.current;
    container?.addEventListener("keydown", handleKeyDown);
    return () => {
      container?.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      focusedItemRef.current = null;
      return;
    }

    if (dropdownRef.current) {
      const checkedElement = dropdownRef.current?.querySelector(
        '[data-state="checked"]'
      );
      if (checkedElement) {
        (checkedElement as HTMLElement).scrollIntoView({ block: "start" });
        focusedItemRef.current = checkedElement as HTMLDivElement;
      }
    }
  }, [isOpen, dropdownRef]);

  return (
    <div className={styles.dropdownSelect} ref={containerRef}>
      <Trigger
        ref={triggerRef}
        onClick={toggleDropdown}
        loading={loading}
        disabled={disabled || loading}
        selectedOption={selectedOption}
        placeholder={placeholder}
      />

      <div
        className={cn(styles.dropdown, {
          [styles.open]: isOpen,
        })}
        style={getDropdownStyles(triggerRef.current, showAbove)}
        inert={!isOpen ? true : undefined}
        role="listbox"
      >
        <div className={styles.window} ref={dropdownRef}>
          {options.map((option) => (
            <Item
              key={option.id}
              display={option.display}
              imageSrc={option.imageSrc}
              isSelected={option.value === selectedValue}
              onClick={() => handleValueChange(option.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
