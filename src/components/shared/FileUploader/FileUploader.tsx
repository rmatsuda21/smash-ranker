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
  onChange: (file?: File) => void;
};

export const FileUploader = ({
  id,
  name,
  value,
  disabled,
  onChange,
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
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    onChange(file);
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
      const file = e.dataTransfer.files[0];
      if (!file || !file.type.startsWith("image/")) return;
      onChange(file);
      setIsFileOver(false);
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
  }, [onChange, disabled]);

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
        accept="image/*"
        id={id}
        name={name}
        onChange={handleChange}
      />
      <Button variant="outline" onClick={handleButtonClick} disabled={disabled}>
        Upload
      </Button>
      <span>Or drag and drop</span>
      {value && <img src={value} alt="Preview" width={100} />}
      {value && (
        <Button onClick={handleRemoveClick} size="sm">
          <IoIosRemoveCircle />
        </Button>
      )}
    </label>
  );
};
