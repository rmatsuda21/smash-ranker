import { Group } from "react-konva";

import type {
  FlexGridElementConfig,
  FlexGroupElementConfig,
  GroupElementConfig,
} from "@/types/top8/Design";
import type { ElementCreator } from "@/types/top8/ElementFactory";
import { ElementList } from "../ElementList";
import { getElementKey } from "../elementKey";
import { layoutFlexChildren } from "../layout/flexLayout";
import { layoutGridChildren } from "../layout/gridLayout";

// Containers render their children through one `ElementList` over the whole
// (positioned) children array, so each child's index in that list is unique
// among its siblings and can serve as its fallback React key.

export const createGroupElement: ElementCreator<GroupElementConfig> = ({
  element,
  index,
  context,
}) => (
  <Group
    key={getElementKey(element, index)}
    x={element.position.x}
    y={element.position.y}
    width={element.size?.width}
    height={element.size?.height}
  >
    <ElementList elements={element.elements} context={context} />
  </Group>
);

export const createFlexGroupElement: ElementCreator<FlexGroupElementConfig> = ({
  element,
  index,
  context,
}) => (
  <Group
    key={getElementKey(element, index)}
    x={element.position.x}
    y={element.position.y}
    width={element.size?.width}
    height={element.size?.height}
  >
    <ElementList
      elements={layoutFlexChildren(element, context)}
      context={context}
    />
  </Group>
);

export const createFlexGridElement: ElementCreator<FlexGridElementConfig> = ({
  element,
  index,
  context,
}) => (
  <Group
    key={getElementKey(element, index)}
    x={element.position.x}
    y={element.position.y}
    width={element.size?.width ?? 0}
    height={element.size?.height ?? 0}
  >
    <ElementList
      elements={layoutGridChildren(element, context)}
      context={context}
    />
  </Group>
);
