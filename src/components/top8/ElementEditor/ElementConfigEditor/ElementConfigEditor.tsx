import { useCallback } from "react";
import { LuEyeOff } from "react-icons/lu";

import { Condition, ElementConfig } from "@/types/top8/LayoutTypes";
import { TextConfigEditor } from "@/components/top8/ElementEditor/TextConfigEditor/TextConfigEditor";
import { ImageConfigEditor } from "@/components/top8/ElementEditor/ImageConfigEditor";
import { Input } from "@/components/shared/Input/Input";
import { ConditionEditor } from "@/components/top8/ElementEditor/ConditionEditor/ConditionEditor";

import styles from "./ElementConfigEditor.module.scss";

type Props = {
  element: ElementConfig;
  onUpdateElement: (element: ElementConfig) => void;
};

const SpecificConfigEditor = ({ element, onUpdateElement }: Props) => {
  switch (element.type) {
    case "text":
    case "smartText":
      return (
        <TextConfigEditor element={element} onUpdateElement={onUpdateElement} />
      );
    case "image":
      return (
        <ImageConfigEditor
          element={element}
          onUpdateElement={onUpdateElement}
        />
      );
  }
  return null;
};

export const ElementConfigEditor = (props: Props) => {
  const { element } = props;

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      props.onUpdateElement({ ...element, hidden: event.target.checked });
    },
    [element, props]
  );

  const handleConditionUpdate = useCallback(
    (conditions: Condition[]) => {
      props.onUpdateElement({ ...element, conditions });
    },
    [element, props]
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.basicConfig}>
        <Input
          type="checkbox"
          id={`hidden-${element.id}`}
          name="hidden"
          label={<LuEyeOff size={20} />}
          checked={element.hidden ?? false}
          onChange={handleInputChange}
        />
        <ConditionEditor
          conditions={element.conditions}
          onUpdateConditions={handleConditionUpdate}
        />
      </div>
      <SpecificConfigEditor {...props} />
    </div>
  );
};
