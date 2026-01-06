import { useEffect, useState } from "react";
import cn from "classnames";

import { useTemplateDB } from "@/hooks/useConfigDb";
import { Spinner } from "@/components/shared/Spinner/Spinner";

import styles from "./TemplateEditor.module.scss";
import { TemplatePreview } from "./TemplatePreview";
import { Design } from "@/types/top8/Design";

type Props = {
  className?: string;
};

export const TemplateEditor = ({ className }: Props) => {
  const { templates, loading, getTemplateWithId } = useTemplateDB();
  const [designs, setDesigns] = useState<Design[]>([]);

  useEffect(() => {
    const fetchDesigns = async () => {
      const _templates = await Promise.all(
        templates.map((template) => getTemplateWithId(template.id))
      );
      setDesigns(
        _templates
          .map((template) => template?.design)
          .filter((design) => design !== undefined) as Design[]
      );
    };

    fetchDesigns();
  }, [templates, getTemplateWithId]);

  if (loading)
    return (
      <div className={cn(className, styles.loading)}>
        <Spinner size={25} />
      </div>
    );
  if (templates.length === 0)
    return (
      <div className={cn(className, styles.noTemplates)}>
        No templates found
      </div>
    );

  return (
    <div className={cn(className, styles.templateEditor)}>
      <div className={styles.templates}>
        {/* {templates.map((template) => (
          <button
            key={template.id}
            onClick={async () =>
              console.log(await getTemplateWithId(template.id))
            }
          >
            {template.name}
          </button>
        ))} */}
        {designs.map((design) => (
          <TemplatePreview key={crypto.randomUUID()} design={design} />
        ))}
      </div>
    </div>
  );
};
