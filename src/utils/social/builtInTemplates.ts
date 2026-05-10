import { msg } from "@lingui/core/macro";
import { I18n } from "@lingui/core";

import { SocialTemplate } from "@/types/social/SocialTemplate";

type BuiltInTemplateDef = {
  id: string;
  name: ReturnType<typeof msg>;
  body: string;
};

/**
 * Template bodies are tagged template literals and use real newlines —
 * `\n` and an actual line break compile to the exact same runtime string,
 * but the multi-line form reads as the post will appear, which makes the
 * file far easier to edit. Keep this format when adding new templates.
 */
const BUILT_IN_TEMPLATES: BuiltInTemplateDef[] = [
  {
    id: "built-in:top-3",
    name: msg`Top 3`,
    body: `🏆 {{tournament.name}} Top 3

🥇 {{winner1.handle}}
🥈 {{winner2.handle}}
🥉 {{winner3.handle}}

{{tournament.url}}`,
  },
  {
    id: "built-in:top-8",
    name: msg`Top 8`,
    body: `🏆 {{tournament.name}} Top 8

🥇 {{winner1.handle}}
🥈 {{winner2.handle}}
🥉 {{winner3.handle}}
4. {{winner4.handle}}
5. {{winner5.handle}}
6. {{winner6.handle}}
7. {{winner7.handle}}
8. {{winner8.handle}}

{{tournament.url}}`,
  },
  {
    id: "built-in:trophy-spotlight",
    name: msg`Trophy spotlight`,
    body: `🏆 {{winner1.handle}} takes {{tournament.name}}!

{{tournament.url}}`,
  },
  {
    id: "built-in:minimalist",
    name: msg`Minimalist`,
    body: `Congrats to {{winner1.handle}} on winning {{tournament.name}}`,
  },
];

export const getBuiltInTemplates = (i18n: I18n): SocialTemplate[] =>
  BUILT_IN_TEMPLATES.map((t) => ({
    id: t.id,
    name: i18n._(t.name),
    body: t.body,
    isBuiltIn: true,
  }));

export const getBuiltInTemplateBody = (id: string): string | undefined =>
  BUILT_IN_TEMPLATES.find((t) => t.id === id)?.body;

export const DEFAULT_TEMPLATE_ID = BUILT_IN_TEMPLATES[0].id;
