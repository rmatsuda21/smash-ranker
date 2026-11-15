import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLingui } from "@lingui/react/macro";
import { LuChevronsUpDown, LuSearch } from "react-icons/lu";
import cn from "classnames";

import { Popover } from "@/components/shared/Popover/Popover";
import { Spinner } from "@/components/shared/Spinner/Spinner";

import styles from "./DropDownSelect.module.scss";

export type DropDownItem<T> = {
  value: T;
  id: string;
  display: string;
  imageSrc?: string;
  searchTerms?: string[];
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
    isSelected?: boolean,
  ) => React.ReactNode;
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
  searchPlaceholder,
  renderOption,
}: Props<T>) => {
  const { t } = useLingui();
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const triggerRef = useRef<HTMLButtonElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === selectedValue);
  }, [options, selectedValue]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    const query = searchQuery.toLowerCase().trim();
    return options.filter(
      (option) =>
        option.display.toLowerCase().includes(query) ||
        option.searchTerms?.some((term) => term.toLowerCase().includes(query)),
    );
  }, [options, searchQuery]);

  const handleValueChange = useCallback(
    (value: T) => {
      onChange(value);
      setIsOpen(false);
      setSearchQuery("");
      triggerRef.current?.focus();
    },
    [onChange],
  );

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeDropdown = useCallback(() => {
    // Dismissed from the keyboard (Esc) with focus still inside the list:
    // hand focus back to the trigger instead of dropping it on <body>.
    if (windowRef.current?.parentElement?.contains(document.activeElement)) {
      triggerRef.current?.focus();
    }
    setIsOpen(false);
    setSearchQuery("");
  }, []);

  const getItems = () =>
    Array.from(
      windowRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
    );

  const moveFocus = (to: "next" | "previous" | "first" | "last") => {
    const items = getItems();
    if (!items.length) return;
    const current = items.indexOf(document.activeElement as HTMLElement);
    let target: HTMLElement | undefined;
    if (to === "first") {
      target = items[0];
    } else if (to === "last") {
      target = items[items.length - 1];
    } else if (current === -1) {
      // Coming from the search box: start at the selected option if shown.
      target =
        items.find((item) => item.dataset.state === "checked") ??
        (to === "next" ? items[0] : items[items.length - 1]);
    } else {
      const step = to === "next" ? 1 : -1;
      target = items[(current + step + items.length) % items.length];
    }
    target?.focus();
  };

  // Scoped to the popover (not `document`), so it only ever sees keys typed
  // while focus is inside this dropdown.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const active = document.activeElement as HTMLElement | null;
    const isSearchFocused = active === searchInputRef.current;
    const isOptionFocused = active?.getAttribute("role") === "option";

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveFocus("next");
        break;
      case "ArrowUp":
        e.preventDefault();
        moveFocus("previous");
        break;
      case "Home":
        if (isSearchFocused) break;
        e.preventDefault();
        moveFocus("first");
        break;
      case "End":
        if (isSearchFocused) break;
        e.preventDefault();
        moveFocus("last");
        break;
      case "Tab":
        // One tab stop: Tab leaves the list rather than walking the options.
        e.preventDefault();
        closeDropdown();
        break;
      case " ":
        if (!isOptionFocused) break;
        e.preventDefault();
        active?.click();
        break;
      case "Enter":
        // The Enter that confirms an IME conversion is not a selection.
        if (e.nativeEvent.isComposing) break;
        if (isOptionFocused) {
          e.preventDefault();
          active?.click();
        } else if (isSearchFocused && filteredOptions.length === 1) {
          e.preventDefault();
          handleValueChange(filteredOptions[0].value);
        }
        break;
      default:
        // Typing while an option is focused goes to the search box.
        if (
          searchable &&
          isOptionFocused &&
          e.key.length === 1 &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey
        ) {
          searchInputRef.current?.focus();
        }
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  // Move focus into the dropdown on open so the keys above reach it. Deferred
  // a frame: the popover is hidden until it has been positioned.
  useLayoutEffect(() => {
    if (!isOpen) return;

    const rafId = requestAnimationFrame(() => {
      const checked = windowRef.current?.querySelector<HTMLElement>(
        '[data-state="checked"]',
      );
      checked?.scrollIntoView({ block: "start" });
      if (searchable) {
        searchInputRef.current?.focus();
      } else {
        (checked ?? getItems()[0])?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, searchable]);

  return (
    <div className={cn(styles.dropdownSelect, className)}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={toggleDropdown}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
      >
        <TriggerContent
          loading={loading}
          selectedOption={selectedOption}
          placeholder={placeholder}
        />
        <LuChevronsUpDown className={styles.icon} aria-hidden />
      </button>

      <Popover
        anchorRef={triggerRef}
        open={isOpen}
        onClose={closeDropdown}
        placement="bottom-start"
        offset={5}
        matchAnchorWidth
        className={styles.dropdown}
        role={null}
        onKeyDown={handleKeyDown}
      >
        {searchable && (
          <div className={styles.searchContainer}>
            <div className={styles.searchInput}>
              <LuSearch className={styles.searchIcon} aria-hidden />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder ?? t`Search...`}
                aria-label={searchPlaceholder ?? t`Search...`}
                aria-controls={listboxId}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          </div>
        )}
        <div
          className={styles.window}
          ref={windowRef}
          id={listboxId}
          role="listbox"
        >
          {filteredOptions.length === 0 ? (
            <div className={styles.noResults}>{t`No results found`}</div>
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
                  tabIndex={-1}
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
                          alt=""
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
      </Popover>

      {error && (
        <p className={styles.error}>{`${error?.name}: ${error?.message}`}</p>
      )}
    </div>
  );
};
