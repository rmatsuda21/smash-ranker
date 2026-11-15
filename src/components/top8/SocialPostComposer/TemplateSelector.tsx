import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { FaXmark } from "react-icons/fa6";

import {
  DropDownSelect,
  type DropDownItem,
} from "@/components/shared/DropDownSelect/DropDownSelect";
import { useConfirmation } from "@/hooks/useConfirmation";
import type { SocialTemplate } from "@/types/social/SocialTemplate";

import styles from "./SocialPostComposer.module.scss";

type Props = {
  builtIn: SocialTemplate[];
  custom: SocialTemplate[];
  selectedId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

export const TemplateSelector = ({
  builtIn,
  custom,
  selectedId,
  onSelect,
  onDelete,
}: Props) => {
  const { _ } = useLingui();
  const { confirm: confirmDelete, ConfirmationDialog } = useConfirmation(
    onDelete,
    {
      title: _(msg`Delete this template?`),
      description: _(msg`This template will be permanently deleted.`),
    },
  );

  const options: DropDownItem<string>[] = [
    ...builtIn.map((t) => ({ value: t.id, id: t.id, display: t.name })),
    ...custom.map((t) => ({
      value: t.id,
      id: t.id,
      display: t.name,
    })),
  ];

  return (
    <div className={styles.templateSelector}>
      <label className={styles.templateLabel}>
        <Trans>Template</Trans>
      </label>
      <DropDownSelect<string>
        className={styles.dropdown}
        options={options}
        selectedValue={selectedId}
        onChange={onSelect}
        renderOption={(option) => {
          const isCustom = custom.some((c) => c.id === option.value);
          if (!isCustom) {
            return (
              <span className={styles.customRowName}>{option.display}</span>
            );
          }
          return (
            <div className={styles.customRow}>
              <span className={styles.customRowName}>{option.display}</span>
              <button
                type="button"
                className={styles.customRowDelete}
                aria-label={_(msg`Delete template`)}
                onClick={(e) => {
                  e.stopPropagation();
                  // Opening the modal closes the dropdown on its own.
                  confirmDelete(option.value);
                }}
              >
                <FaXmark />
              </button>
            </div>
          );
        }}
      />
      <ConfirmationDialog />
    </div>
  );
};
