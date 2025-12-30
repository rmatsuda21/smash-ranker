import { useRef, useState, useCallback, useEffect, KeyboardEvent } from "react";
import cn from "classnames";

import {
  LayoutPlaceholder,
  PlaceholderLabel,
} from "@/consts/top8/placeholders";

import styles from "./RichTextInput.module.scss";

const PLACEHOLDER_REGEX = /<[^>]+>/g;

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
};

const textToHtml = (text: string): string => {
  if (!text) return "";

  return text.replace(PLACEHOLDER_REGEX, (match) => {
    const placeholder = match as LayoutPlaceholder;
    const label = PlaceholderLabel[placeholder] ?? placeholder;
    return `<span class="${styles.pill}" contenteditable="false" data-placeholder="${match}">${label}<span class="${styles.removeIcon}">×</span></span>&#8203;`;
  });
};

const htmlToText = (element: HTMLElement): string => {
  let result = "";

  element.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      result += (node.textContent ?? "").replace(/\u200B/g, "");
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const placeholder = el.getAttribute("data-placeholder");
      if (placeholder) {
        result += placeholder;
      } else {
        // Recurse for other elements (like <br>)
        result += htmlToText(el);
      }
    }
  });

  return result;
};

const MAX_HISTORY_SIZE = 50;

export const RichTextInput = ({
  value,
  onChange,
  className,
  placeholder = "Enter text...",
}: Props) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const lastExternalValue = useRef(value);

  const historyRef = useRef<string[]>([value]);
  const historyIndexRef = useRef(0);
  const isUndoRedoAction = useRef(false);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = textToHtml(value);
      lastExternalValue.current = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }

    if (editorRef.current && value !== lastExternalValue.current) {
      const currentText = htmlToText(editorRef.current);
      if (currentText !== value) {
        editorRef.current.innerHTML = textToHtml(value);
      }
      lastExternalValue.current = value;
    }
  }, [value]);

  const filteredPlaceholders = Object.entries(PlaceholderLabel).filter(
    ([, label]) => label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pushToHistory = useCallback((text: string) => {
    if (historyRef.current[historyIndexRef.current] === text) return;

    historyRef.current = historyRef.current.slice(
      0,
      historyIndexRef.current + 1
    );

    historyRef.current.push(text);

    if (historyRef.current.length > MAX_HISTORY_SIZE) {
      historyRef.current.shift();
    } else {
      historyIndexRef.current++;
    }
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const previousText = historyRef.current[historyIndexRef.current];

      if (editorRef.current) {
        isUndoRedoAction.current = true;
        isInternalChange.current = true;
        editorRef.current.innerHTML = textToHtml(previousText);
        lastExternalValue.current = previousText;
        onChange(previousText);

        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  }, [onChange]);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const nextText = historyRef.current[historyIndexRef.current];

      if (editorRef.current) {
        isUndoRedoAction.current = true;
        isInternalChange.current = true;
        editorRef.current.innerHTML = textToHtml(nextText);
        lastExternalValue.current = nextText;
        onChange(nextText);

        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  }, [onChange]);

  const getCursorPosition = useCallback((): number => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current || selection.rangeCount === 0)
      return 0;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editorRef.current);
    preCaretRange.setEnd(range.startContainer, range.startOffset);

    const tempDiv = document.createElement("div");
    tempDiv.appendChild(preCaretRange.cloneContents());
    return htmlToText(tempDiv).length;
  }, []);

  const insertPlaceholder = useCallback(
    (placeholder: LayoutPlaceholder) => {
      if (!editorRef.current) return;

      const currentText = htmlToText(editorRef.current);
      const cursorPos = getCursorPosition();

      const textBeforeCursor = currentText.slice(0, cursorPos);
      const lastBracePos = textBeforeCursor.lastIndexOf("{");
      const insertPos = lastBracePos >= 0 ? lastBracePos : cursorPos;

      const newText =
        currentText.slice(0, insertPos) +
        placeholder +
        currentText.slice(cursorPos);

      editorRef.current.innerHTML = textToHtml(newText);
      lastExternalValue.current = newText;
      isInternalChange.current = true;

      pushToHistory(newText);

      onChange(newText);

      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      setShowDropdown(false);
      setSearchTerm("");
      setSelectedIndex(0);

      editorRef.current.focus();
    },
    [onChange, getCursorPosition, pushToHistory]
  );

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;

    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    const newText = htmlToText(editorRef.current);
    lastExternalValue.current = newText;

    pushToHistory(newText);

    const cursorPos = getCursorPosition();
    const textBeforeCursor = newText.slice(0, cursorPos);
    const lastBracePos = textBeforeCursor.lastIndexOf("{");

    if (lastBracePos >= 0) {
      const textAfterBrace = textBeforeCursor.slice(lastBracePos + 1);
      if (!textAfterBrace.includes("}") && !textAfterBrace.includes("\n")) {
        setSearchTerm(textAfterBrace);
        setShowDropdown(true);
        setSelectedIndex(0);

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const editorRect = editorRef.current.getBoundingClientRect();
          setDropdownPosition({
            x: Math.max(0, rect.left - editorRect.left),
            y: rect.bottom - editorRect.top + 4,
          });
        }
      } else {
        setShowDropdown(false);
      }
    } else {
      setShowDropdown(false);
    }

    isInternalChange.current = true;
    onChange(newText);
  }, [onChange, getCursorPosition, pushToHistory]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }

    if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "y" || (e.key === "z" && e.shiftKey))
    ) {
      e.preventDefault();
      redo();
      return;
    }

    if (showDropdown && filteredPlaceholders.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredPlaceholders.length - 1)
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertPlaceholder(
          filteredPlaceholders[selectedIndex][0] as LayoutPlaceholder
        );
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowDropdown(false);
        setSearchTerm("");
      }
    }
  };

  const handlePillClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const pill = target.closest(`.${styles.pill}`) as HTMLElement | null;

      if (pill && editorRef.current) {
        e.preventDefault();
        e.stopPropagation();

        const placeholder = pill.getAttribute("data-placeholder");
        if (placeholder) {
          const nextSibling = pill.nextSibling;
          if (
            nextSibling &&
            nextSibling.nodeType === Node.TEXT_NODE &&
            nextSibling.textContent === "\u200B"
          ) {
            nextSibling.remove();
          }
          pill.remove();

          const newText = htmlToText(editorRef.current);
          lastExternalValue.current = newText;
          isInternalChange.current = true;

          pushToHistory(newText);

          onChange(newText);
        }
      }
    },
    [onChange, pushToHistory]
  );

  const handleBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  const isEmpty = !value || value.trim() === "";

  return (
    <div className={cn(styles.wrapper, className)}>
      <div
        ref={editorRef}
        className={cn(styles.editor, { [styles.empty]: isEmpty })}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onClick={handlePillClick}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      {showDropdown && filteredPlaceholders.length > 0 && (
        <div
          ref={dropdownRef}
          className={styles.dropdown}
          style={{ left: dropdownPosition.x, top: dropdownPosition.y }}
        >
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>Insert variable</span>
            <span className={styles.dropdownHint}>Type to filter</span>
          </div>
          <div className={styles.dropdownList}>
            {filteredPlaceholders.map(([placeholder, label], index) => (
              <button
                key={placeholder}
                className={cn(styles.dropdownItem, {
                  [styles.selected]: index === selectedIndex,
                })}
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertPlaceholder(placeholder as LayoutPlaceholder);
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className={styles.pillPreview}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.hint}>
        Type <code>{"{"}</code> to insert a variable
      </div>
    </div>
  );
};
