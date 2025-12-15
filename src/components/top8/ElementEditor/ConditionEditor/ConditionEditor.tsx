import { useEffect, useRef } from "react";
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

import styles from "./ConditionEditor.module.scss";

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

// type DropdownOption = {
//   value: LayoutPlaceholder | RenderCondition;
//   id: string;
//   display: string;
// };

// const dropdownOptions: DropdownOption[] = [
//   ...Object.values(LayoutPlaceholder).map((placeholder) => ({
//     value: placeholder,
//     id: placeholder,
//     display: PlaceholderLabel[placeholder],
//   })),
//   ...Object.values(RenderCondition).map((renderCondition) => ({
//     value: renderCondition,
//     id: renderCondition,
//     display: RenderConditionLabel[renderCondition],
//   })),
// ];

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
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (condition: Condition, negated: boolean) => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = "block";
      const content = getConditionLabel(condition, negated);
      tooltipRef.current.innerText = content;
      tooltipRef.current.setAttribute("data-tooltip-content", content);
    }
  };

  const handleMouseLeave = () => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = "none";
      tooltipRef.current.removeAttribute("data-tooltip-content");
      tooltipRef.current.innerText = "";
    }
  };

  // const handleConditionClick = (
  //   event: React.MouseEvent<HTMLDivElement>,
  //   condition: Condition
  // ) => {
  //   if (event.shiftKey) {
  //     onUpdateConditions(conditions?.filter((c) => c !== condition) ?? []);
  //   }
  // };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (tooltipRef.current) {
        tooltipRef.current.style.top = `${event.clientY + 10}px`;
        tooltipRef.current.style.left = `${event.clientX + 10}px`;
      }
    };

    // const handleKeyDown = (event: KeyboardEvent) => {
    //   if (event.key === "Shift") {
    //     event.preventDefault();
    //     event.stopPropagation();
    //     if (tooltipRef.current) {
    //       tooltipRef.current.innerText = "";
    //     }
    //   }
    // };

    // const handleKeyUp = (event: KeyboardEvent) => {
    //   if (event.key === "Shift") {
    //     event.preventDefault();
    //     event.stopPropagation();
    //     if (tooltipRef.current) {
    //       tooltipRef.current.innerText =
    //         tooltipRef.current.getAttribute("data-tooltip-content") ?? "";
    //     }
    //   }
    // };

    window.addEventListener("mousemove", handleMouseMove);
    // window.addEventListener("keydown", handleKeyDown);
    // window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      // window.removeEventListener("keydown", handleKeyDown);
      // window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const negatedConditions = applyNegationToConditions(conditions ?? []);

  return (
    <div className={styles.wrapper}>
      <p className={styles.title}>Conditions</p>
      <div className={styles.conditions}>
        {negatedConditions?.map(({ condition, negated }, index) => (
          <div
            key={`${condition}-${index}`}
            className={cn(styles.condition, {
              [styles.negated]: negated,
            })}
            onMouseEnter={() => handleMouseEnter(condition, negated)}
            onMouseLeave={handleMouseLeave}
            // onClick={(event) => handleConditionClick(event, condition)}
          >
            {condition}
          </div>
        ))}
        {negatedConditions.length === 0 && <p>No conditions</p>}
      </div>
      {/* <DropDownSelect
        selectedValue={dropdownOptions[0].value}
        options={dropdownOptions}
        onChange={(value) => {
          console.log(value);
          if (value.length > 0) {
            onUpdateConditions([...(conditions ?? []), value[0].value]);
          }
        }}
      /> */}
      <div ref={tooltipRef} className={styles.tooltip}></div>
    </div>
  );
};
