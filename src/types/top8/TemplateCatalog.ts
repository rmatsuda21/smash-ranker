import type { MessageDescriptor } from "@lingui/core";

import type { Design } from "@/types/top8/Design";

export type TemplateMode = "singles" | "doubles";

// One loadable built-in template. A family's variants are the same idea in
// another colour (those have a `swatch`) or another layout (those don't).
export type TemplateVariant = {
  id: string;
  name: MessageDescriptor;
  // What the variant's pill says when the full name is too long for one.
  short?: MessageDescriptor | string;
  design: Design;
  font: string;
  mode: TemplateMode;
  // Two colours that tell this colourway from its siblings: ground, then
  // what sits on it.
  swatch?: [string, string];
};

// What the picker shows as one card.
export type TemplateFamily = {
  id: string;
  name: MessageDescriptor;
  variants: TemplateVariant[];
};
