import { useMemo } from "react";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import {
  DropDownSelect,
  type DropDownItem,
} from "@/components/shared/DropDownSelect/DropDownSelect";
import { type TokenOption } from "@/utils/social/templateTokens";

import styles from "./SocialPostComposer.module.scss";

type Props = {
  insertableTokens: TokenOption[];
  onInsertVariable: (token: string) => void;
};

/**
 * Template-mode helper: just the "Insert variable" dropdown. Saving lives
 * in the composer's action row (name input + Save button) so the save UI
 * is always visible, not tucked behind a toggle.
 */
export const TemplatePicker = ({
  insertableTokens,
  onInsertVariable,
}: Props) => {
  const { _ } = useLingui();

  const tokenOptions: DropDownItem<string>[] = useMemo(
    () =>
      insertableTokens.map((t) => ({
        value: t.token,
        id: t.token,
        display: `${t.group} · ${t.label}`,
        searchTerms: [t.label, t.group, t.token],
      })),
    [insertableTokens],
  );

  return (
    <div className={styles.templateActions}>
      <DropDownSelect<string>
        className={styles.tokenInsertPicker}
        searchable
        searchPlaceholder={_(msg`Search variables…`)}
        placeholder={_(msg`Insert variable…`)}
        options={tokenOptions}
        selectedValue=""
        onChange={onInsertVariable}
      />
    </div>
  );
};
