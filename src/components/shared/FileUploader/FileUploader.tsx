import { useEffect, useRef, useState } from "react";
import { IoIosRemoveCircle } from "react-icons/io";
import cn from "classnames";

import { Button } from "@/components/shared/Button/Button";

import styles from "./FileUploader.module.scss";

type Props = {
  id?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  multiple?: boolean;
  accept?: string;
  onChange: (files?: File[]) => void;
};

const matchesAccept = (file: File, accept: string): boolean => {
  const types = accept.split(",").map((t) => t.trim());
  return types.some((type) => {
    if (type.endsWith("/*")) {
      return file.type.startsWith(type.slice(0, -1));
    }
    if (type.startsWith(".")) {
      return file.name.toLowerCase().endsWith(type.toLowerCase());
    }
    return file.type === type;
  });
};

export const FileUploader = ({
  id,
  name,
  value,
  disabled,
  onChange,
  multiple = false,
  accept = "image/*",
}: Props) => {
  const [isFileOver, setIsFileOver] = useState(false);

  const ref = useRef<HTMLLabelElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    if (!files.every((file) => matchesAccept(file, accept))) return;
    onChange(files);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleRemoveClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    onChange(undefined);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!ref.current || disabled) return;
    const element = ref.current;

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      if (!e.dataTransfer) return;
      const files = Array.from(e.dataTransfer.files ?? []);

      if (
        files.length === 0 ||
        !files.every((file) => matchesAccept(file, accept))
      ) {
        return;
      }

      setIsFileOver(false);
      onChange(files);
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (!e.dataTransfer) return;
      const fileItems = [...e.dataTransfer.items].filter(
        (item) => item.kind === "file"
      );
      if (fileItems.length > 0) {
        setIsFileOver(true);
      }
    };

    const handleDragLeave = () => {
      setIsFileOver(false);
    };

    const handleDragEnd = () => {
      setIsFileOver(false);
    };

    element.addEventListener("drop", handleDrop);
    element.addEventListener("dragover", handleDragOver);
    element.addEventListener("dragleave", handleDragLeave);
    element.addEventListener("dragend", handleDragEnd);

    return () => {
      element.removeEventListener("drop", handleDrop);
      element.removeEventListener("dragover", handleDragOver);
      element.removeEventListener("dragleave", handleDragLeave);
      element.removeEventListener("dragend", handleDragEnd);
    };
  }, [onChange, disabled, accept]);

  return (
    <label
      ref={ref}
      className={cn(styles.wrapper, {
        [styles.isFileOver]: isFileOver,
        [styles.disabled]: disabled,
      })}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        id={id}
        name={name}
        onChange={handleChange}
        multiple={multiple}
      />
      <div className={styles.content}>
        <Button
          variant="outline"
          onClick={handleButtonClick}
          disabled={disabled}
        >
          Upload
        </Button>
        <span>Or drag and drop</span>
      </div>
      {value && <img src={value} alt="Preview" width={100} />}
      {value && (
        <Button
          className={styles.removeButton}
          onClick={handleRemoveClick}
          size="sm"
        >
          <IoIosRemoveCircle />
        </Button>
      )}
    </label>
  );
};
