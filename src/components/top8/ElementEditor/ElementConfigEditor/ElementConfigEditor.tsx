import { useCallback } from "react";
import { LuEyeOff } from "react-icons/lu";

import { Condition, ElementConfig } from "@/types/top8/Design";
import { TextConfigEditor } from "@/components/top8/ElementEditor/TextConfigEditor/TextConfigEditor";
import { ImageConfigEditor } from "@/components/top8/ElementEditor/ImageConfigEditor";
import { Checkbox } from "@/components/shared/Checkbox/Checkbox";
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

  const handleHiddenChange = useCallback(
    (checked: boolean) => {
      props.onUpdateElement({ ...element, hidden: checked });
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
        <Checkbox
          id={`hidden-${element.id}`}
          label={<LuEyeOff size={20} />}
          checked={element.hidden ?? false}
          onChange={handleHiddenChange}
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
