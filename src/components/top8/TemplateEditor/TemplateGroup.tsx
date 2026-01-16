import { useState } from "react";
import cn from "classnames";
import { FaChevronUp, FaPlus } from "react-icons/fa6";
import { Trans } from "@lingui/react/macro";

import { DBTemplate } from "@/types/Repository";
import { TemplatePreview } from "@/components/top8/TemplateEditor/TemplatePreview/TemplatePreview";
import { Button } from "@/components/shared/Button/Button";

import styles from "./TemplateEditor.module.scss";

type Props = {
  templates: DBTemplate[];
  name: string;
  onTemplateClick: (templateId: string) => void;
  viewMode: "grid" | "list";
  loadingTemplateId: string | null;
  onCreateCustom?: () => void;
};

export const TemplateGroup = ({
  templates,
  name,
  onTemplateClick,
  viewMode,
  loadingTemplateId,
  onCreateCustom,
}: Props) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={styles.templateGroup}>
      <div className={styles.groupHeader}>
        <p className={styles.groupName}>{name}</p>
        <Button
          className={cn({ [styles.collapsed]: collapsed })}
          onClick={() => setCollapsed(!collapsed)}
        >
          <FaChevronUp size={8} />
        </Button>
      </div>

      <div
        className={cn(styles.templates, {
          [styles.grid]: viewMode === "grid",
          [styles.collapsed]: collapsed,
        })}
      >
        {templates.map((template) => (
          <TemplatePreview
            className={styles.template}
            key={template.id}
            template={template}
            onClick={() => onTemplateClick(template.id)}
            isLoading={loadingTemplateId === template.id}
          />
        ))}
        {onCreateCustom && (
          <button
            className={cn(styles.template, styles.createCustomCard)}
            onClick={onCreateCustom}
          >
            <FaPlus size={16} />
            <span>
              <Trans>Custom Minimal</Trans>
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
