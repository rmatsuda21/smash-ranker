import Select, {
  SelectItemRenderer,
  SelectRenderer,
} from "react-dropdown-select";
import cn from "classnames";
import { useMemo } from "react";

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
};

const itemRenderer = <T,>({
  item,
  state,
  methods,
}: SelectItemRenderer<Item<T>>) => {
  const isSelected = state.values[0]?.id === item.id;
  return (
    <div
      className={cn(styles.item, {
        [styles.selected]: isSelected,
      })}
      key={item.id}
      onClick={() => methods.addItem(item)}
    >
      {item.imageSrc && (
        <img
          width={24}
          height={24}
          src={item.imageSrc}
          alt={item.display ?? ""}
        />
      )}
      {item.display}
    </div>
  );
};

const contentRenderer = <T,>({ state }: SelectRenderer<Item<T>>) => {
  if (state.values.length === 0) return null;
  const item = state.values[0];
  return (
    <div className={styles.content}>
      {item.imageSrc && (
        <img
          width={24}
          height={24}
          src={item.imageSrc}
          alt={item.display ?? ""}
        />
      )}
      {item.display}
    </div>
  );
};

export const DropDownSelect = <T,>({
  options,
  selectedValue,
  onChange,
  disabled = false,
}: Props<T>) => {
  const selectedValues = useMemo(() => {
    return options.filter((option) => option.value === selectedValue);
  }, [options, selectedValue]);

  const handleChange = (values: any[]) => {
    onChange(values);
  };

  return (
    <div className={cn({ [styles.disabled]: disabled })}>
      <Select
        className={styles.container}
        options={options}
        values={selectedValues}
        onChange={handleChange}
        itemRenderer={itemRenderer}
        contentRenderer={contentRenderer}
        disabled={disabled}
      />
    </div>
  );
};
