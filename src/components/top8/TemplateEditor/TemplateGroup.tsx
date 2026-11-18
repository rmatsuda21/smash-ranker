import { useId, useState } from "react";
import cn from "classnames";
import { FaChevronDown } from "react-icons/fa6";

import { DBTemplate } from "@/types/Repository";
import { TemplatePreview } from "@/components/top8/TemplateEditor/TemplatePreview/TemplatePreview";
import { EditorCard } from "@/components/top8/EditorForm/EditorForm";
import { logEvent } from "@/utils/observability/log";

import styles from "./TemplateEditor.module.scss";

type Props = {
  templates: DBTemplate[];
  name: string;
  onTemplateClick: (templateId: string) => void;
  onDeleteTemplate?: (templateId: string) => void;
  viewMode: "grid" | "list";
  loadingTemplateId: string | null;
  /** Shown at the end of the header, next to the group name. */
  action?: React.ReactNode;
  /** Shown in place of the templates when the group has none. */
  emptyHint?: React.ReactNode;
};

export const TemplateGroup = ({
  templates,
  name,
  onTemplateClick,
  onDeleteTemplate,
  viewMode,
  loadingTemplateId,
  action,
  emptyHint,
}: Props) => {
  const [collapsed, setCollapsed] = useState(false);
  const bodyId = useId();
  const isEmpty = templates.length === 0;

  return (
    <EditorCard className={styles.group}>
      <div className={styles.groupHeader}>
        <button
          type="button"
          className={styles.groupToggle}
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          onClick={() => setCollapsed(!collapsed)}
        >
          <FaChevronDown
            size={10}
            className={cn(styles.chevron, { [styles.collapsed]: collapsed })}
          />
          <span className={styles.groupName}>{name}</span>
          {templates.length > 0 && (
            <span className={styles.count}>{templates.length}</span>
          )}
        </button>
        {action}
      </div>

      <div id={bodyId} hidden={collapsed}>
        {isEmpty ? (
          <p className={styles.emptyHint}>{emptyHint}</p>
        ) : (
          <div
            className={cn(styles.templates, {
              [styles.grid]: viewMode === "grid",
            })}
          >
            {templates.map((template) => (
              <TemplatePreview
                key={template.id}
                template={template}
                onClick={() => {
                  onTemplateClick(template.id);
                  logEvent("template_select", {
                    template_id: template.id,
                    template_group: name,
                  });
                }}
                onDelete={
                  onDeleteTemplate
                    ? () => onDeleteTemplate(template.id)
                    : undefined
                }
                isLoading={loadingTemplateId === template.id}
              />
            ))}
          </div>
        )}
      </div>
    </EditorCard>
  );
};
