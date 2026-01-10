import {
  useMemo,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import { LuChevronsUpDown, LuSearch } from "react-icons/lu";
import cn from "classnames";

import { Spinner } from "@/components/shared/Spinner/Spinner";

import styles from "./DropDownSelect.module.scss";

export type DropDownItem<T> = {
  value: T;
  id: string;
  display: string;
  imageSrc?: string;
};

type Props<T> = {
  options: DropDownItem<T>[];
  selectedValue: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  placeholder?: string;
  loading?: boolean;
  error?: Error;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  renderOption?: (
    option: DropDownItem<T>,
    isSelected: boolean
  ) => React.ReactNode;
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
    const window = triggerEl.parentElement?.querySelector(
      "#dropdown-container"
    );
    const windowHeight = window?.getBoundingClientRect().height;

    top = dropdownRect ? dropdownRect.top - (windowHeight ?? 0) - 15 : 0;
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

const TriggerContent = <T,>({
  loading,
  selectedOption,
  placeholder,
}: {
  loading: boolean;
  selectedOption?: DropDownItem<T>;
  placeholder: string;
}) => {
  if (loading) {
    return <Spinner className={styles.spinner} size={20} />;
  }

  if (!selectedOption) {
    return <div className={styles.content}>{placeholder}</div>;
  }

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
};

export const DropDownSelect = <T,>({
  options,
  selectedValue,
  onChange,
  placeholder = "",
  disabled = false,
  loading = false,
  error,
  className,
  searchable = false,
  searchPlaceholder = "Search...",
  renderOption,
}: Props<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAbove, setShowAbove] = useState(false);
  const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({});
  const [searchQuery, setSearchQuery] = useState("");

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const focusedItemRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === selectedValue);
  }, [options, selectedValue]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    const query = searchQuery.toLowerCase().trim();
    return options.filter((option) =>
      option.display.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  const handleValueChange = useCallback(
    (value: T) => {
      onChange(value);
      setIsOpen(false);
      setSearchQuery("");
    },
    [onChange]
  );

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
  }, []);

  useLayoutEffect(() => {
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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeDropdown]);

  useEffect(() => {
    if (!isOpen) return;

    const getVisibleItems = () => {
      return dropdownRef.current?.querySelectorAll(`.${styles.item}`) as
        | NodeListOf<HTMLDivElement>
        | undefined;
    };

    const focusPreviousItem = () => {
      const items = getVisibleItems();
      if (!items?.length) return;

      if (focusedItemRef.current) {
        const currentIndex = Array.from(items).indexOf(focusedItemRef.current);
        const prevIndex =
          currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        const prevItem = items[prevIndex];
        prevItem?.focus();
        focusedItemRef.current = prevItem;
      } else {
        const lastItem = items[items.length - 1];
        lastItem?.focus();
        focusedItemRef.current = lastItem;
      }
    };

    const focusNextItem = () => {
      const items = getVisibleItems();
      if (!items?.length) return;

      if (focusedItemRef.current) {
        const currentIndex = Array.from(items).indexOf(focusedItemRef.current);
        const nextIndex =
          currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        const nextItem = items[nextIndex];
        nextItem?.focus();
        focusedItemRef.current = nextItem;
      } else {
        const firstItem = items[0];
        firstItem?.focus();
        focusedItemRef.current = firstItem;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isSearchFocused = document.activeElement === searchInputRef.current;

      switch (e.key) {
        case "Escape":
          closeDropdown();
          triggerRef.current?.focus();
          break;
        case "ArrowUp":
          e.preventDefault();
          focusPreviousItem();
          break;
        case "ArrowDown":
          e.preventDefault();
          focusNextItem();
          break;
        case "Tab":
          if (!isSearchFocused) {
            e.preventDefault();
            if (e.shiftKey) {
              focusPreviousItem();
            } else {
              focusNextItem();
            }
          }
          break;
        case "Enter":
          if (!isSearchFocused) {
            e.preventDefault();
            focusedItemRef.current?.click();
          } else if (filteredOptions.length === 1) {
            e.preventDefault();
            handleValueChange(filteredOptions[0].value);
          }
          break;
      }
    };

    const container = containerRef.current;
    container?.addEventListener("keydown", handleKeyDown);
    return () => {
      container?.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeDropdown, filteredOptions, handleValueChange]);

  useLayoutEffect(() => {
    if (!isOpen) {
      focusedItemRef.current = null;
      return;
    }

    if (searchable && searchInputRef.current) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
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
  }, [isOpen, searchable]);

  useEffect(() => {
    if (isOpen && searchQuery) {
      focusedItemRef.current = null;
    }
  }, [isOpen, searchQuery]);

  useEffect(() => {
    const calculateShowAbove = () => {
      if (!triggerRef.current || !dropdownRef.current) return false;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;

      return triggerRect.bottom + dropdownHeight > viewportHeight;
    };

    setDropdownStyles(getDropdownStyles(triggerRef.current, showAbove));
    setShowAbove(calculateShowAbove());
  }, [isOpen, showAbove]);

  return (
    <div className={cn(styles.dropdownSelect, className)} ref={containerRef}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        onClick={toggleDropdown}
        disabled={disabled || loading}
        tabIndex={0}
      >
        <TriggerContent
          loading={loading}
          selectedOption={selectedOption}
          placeholder={placeholder}
        />
        <LuChevronsUpDown className={styles.icon} />
      </button>

      <div
        id="dropdown-container"
        className={cn(styles.dropdown, {
          [styles.open]: isOpen,
        })}
        style={dropdownStyles}
        inert={!isOpen ? true : undefined}
        role="listbox"
      >
        {searchable && (
          <div className={styles.searchContainer}>
            <div className={styles.searchInput}>
              <LuSearch className={styles.searchIcon} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          </div>
        )}
        <div className={styles.window} ref={dropdownRef}>
          {filteredOptions.length === 0 ? (
            <div className={styles.noResults}>No results found</div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = option.value === selectedValue;
              const onClick = () => handleValueChange(option.value);
              return (
                <div
                  key={option.id}
                  className={styles.item}
                  data-state={isSelected ? "checked" : undefined}
                  onClick={onClick}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                >
                  {renderOption ? (
                    renderOption(option, isSelected)
                  ) : (
                    <>
                      {option.imageSrc && (
                        <img
                          width={24}
                          height={24}
                          src={option.imageSrc}
                          alt={option.display ?? ""}
                          loading="lazy"
                        />
                      )}
                      {option.display}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      {error && (
        <p className={styles.error}>{`${error?.name}: ${error?.message}`}</p>
      )}
    </div>
  );
};
