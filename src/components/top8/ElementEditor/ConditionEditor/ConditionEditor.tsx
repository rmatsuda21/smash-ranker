import cn from "classnames";

import { Condition } from "@/types/top8/LayoutTypes";
import {
  LayoutPlaceholder,
  PlaceholderLabel,
} from "@/consts/top8/placeholders";
import {
  RenderCondition,
  RenderConditionLabel,
} from "@/consts/top8/renderConditions";
import { Tooltip } from "@/components/shared/Tooltip/Tooltip";
import { useTooltip } from "@/components/shared/Tooltip/useTooltip";

import styles from "./ConditionEditor.module.scss";
import { useRef } from "react";

type Props = {
  conditions?: Condition[];
  onUpdateConditions: (conditions: Condition[]) => void;
};

const isPlaceholder = (condition: Condition): boolean => {
  return Object.values(LayoutPlaceholder).some((placeholder) =>
    condition.includes(placeholder)
  );
};

const isRenderCondition = (condition: Condition): boolean => {
  return Object.values(RenderCondition).some((renderCondition) =>
    condition.includes(renderCondition)
  );
};

const getConditionLabel = (condition: Condition, negated: boolean): string => {
  let label = "";
  if (isPlaceholder(condition)) {
    label = PlaceholderLabel[condition as LayoutPlaceholder];
  }
  if (isRenderCondition(condition)) {
    label = RenderConditionLabel[condition as RenderCondition];
  }

  if (negated) {
    label = `NO ${label}`;
  } else {
    label = `HAS ${label}`;
  }
  return label;
};

const applyNegationToConditions = (
  conditions: Condition[]
): { condition: Condition; negated: boolean }[] => {
  const negatedConditions: { condition: Condition; negated: boolean }[] = [];
  let negated = false;

  for (const condition of conditions) {
    if (condition === RenderCondition.NOT) {
      negated = true;
      continue;
    }

    negatedConditions.push({ condition, negated });
    negated = false;
  }
  return negatedConditions;
};

export const ConditionEditor = ({ conditions }: Props) => {
  const conditionsRef = useRef<HTMLDivElement>(null);
  const [tooltipRef, tooltip] = useTooltip(conditionsRef);

  const handleMouseEnter = (condition: Condition, negated: boolean) => {
    const content = getConditionLabel(condition, negated);
    tooltip.show(content);
  };

  const handleMouseLeave = () => {
    tooltip.hide();
  };

  const negatedConditions = applyNegationToConditions(conditions ?? []);

  return (
    <div className={styles.wrapper}>
      <p className={styles.title}>Conditions</p>
      <div className={styles.conditions} ref={conditionsRef}>
        {negatedConditions?.map(({ condition, negated }, index) => (
          <div
            key={`${condition}-${index}`}
            className={cn(styles.condition, {
              [styles.negated]: negated,
            })}
            onMouseEnter={() => handleMouseEnter(condition, negated)}
            onMouseLeave={handleMouseLeave}
          >
            {condition}
          </div>
        ))}
        {negatedConditions.length === 0 && <p>No conditions</p>}
      </div>
      <Tooltip tooltipRef={tooltipRef} />
    </div>
  );
};
