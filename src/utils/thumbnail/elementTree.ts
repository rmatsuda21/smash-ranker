import {
  GroupElement,
  ThumbnailElement,
} from "@/types/thumbnail/ThumbnailDesign";

const isGroup = (el: ThumbnailElement): el is GroupElement =>
  el.type === "group";

export const findElement = (
  elements: ThumbnailElement[],
  id: string,
): ThumbnailElement | null => {
  for (const el of elements) {
    if (el.id === id) return el;
    if (isGroup(el)) {
      const found = findElement(el.children, id);
      if (found) return found;
    }
  }
  return null;
};

export const findElementWithContext = (
  elements: ThumbnailElement[],
  id: string,
): {
  element: ThumbnailElement;
  parent: GroupElement | null;
  parentChildren: ThumbnailElement[];
  index: number;
} | null => {
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el.id === id) {
      return { element: el, parent: null, parentChildren: elements, index: i };
    }
    if (isGroup(el)) {
      const found = findElementWithContext(el.children, id);
      if (found) {
        if (!found.parent) {
          return { ...found, parent: el };
        }
        return found;
      }
    }
  }
  return null;
};

export const getAncestors = (
  elements: ThumbnailElement[],
  id: string,
): GroupElement[] => {
  const ancestors: GroupElement[] = [];
  const search = (els: ThumbnailElement[], path: GroupElement[]): boolean => {
    for (const el of els) {
      if (el.id === id) {
        ancestors.push(...path);
        return true;
      }
      if (isGroup(el)) {
        if (search(el.children, [...path, el])) return true;
      }
    }
    return false;
  };
  search(elements, []);
  return ancestors;
};

export const getTopLevelAncestor = (
  elements: ThumbnailElement[],
  id: string,
): ThumbnailElement | null => {
  const ancestors = getAncestors(elements, id);
  if (ancestors.length > 0) return ancestors[0];
  return findElement(elements, id);
};

export const getTopLevelAncestorId = (
  elements: ThumbnailElement[],
  id: string,
): string => {
  const top = getTopLevelAncestor(elements, id);
  return top ? top.id : id;
};

export const flattenTree = (
  elements: ThumbnailElement[],
): ThumbnailElement[] => {
  const out: ThumbnailElement[] = [];
  const walk = (els: ThumbnailElement[]) => {
    for (const el of els) {
      out.push(el);
      if (isGroup(el)) walk(el.children);
    }
  };
  walk(elements);
  return out;
};

export const mapTree = (
  elements: ThumbnailElement[],
  callback: (el: ThumbnailElement) => ThumbnailElement,
): ThumbnailElement[] => {
  return elements.map((el) => {
    if (isGroup(el)) {
      const newChildren = mapTree(el.children, callback);
      const updated = callback({ ...el, children: newChildren });
      return updated;
    }
    return callback(el);
  });
};

export const updateElementInTree = (
  elements: ThumbnailElement[],
  id: string,
  patch: Partial<ThumbnailElement>,
): ThumbnailElement[] => {
  return elements.map((el) => {
    if (el.id === id) {
      return { ...el, ...patch } as ThumbnailElement;
    }
    if (isGroup(el)) {
      return { ...el, children: updateElementInTree(el.children, id, patch) };
    }
    return el;
  });
};

export const removeElementsFromTree = (
  elements: ThumbnailElement[],
  ids: Set<string>,
): ThumbnailElement[] => {
  const out: ThumbnailElement[] = [];
  for (const el of elements) {
    if (ids.has(el.id)) continue;
    if (isGroup(el)) {
      out.push({
        ...el,
        children: removeElementsFromTree(el.children, ids),
      });
    } else {
      out.push(el);
    }
  }
  return out;
};

export const removeAndReturn = (
  elements: ThumbnailElement[],
  id: string,
): { tree: ThumbnailElement[]; removed: ThumbnailElement | null } => {
  let removed: ThumbnailElement | null = null;
  const removeFrom = (els: ThumbnailElement[]): ThumbnailElement[] => {
    const out: ThumbnailElement[] = [];
    for (const el of els) {
      if (el.id === id) {
        removed = el;
        continue;
      }
      if (isGroup(el)) {
        out.push({ ...el, children: removeFrom(el.children) });
      } else {
        out.push(el);
      }
    }
    return out;
  };
  const tree = removeFrom(elements);
  return { tree, removed };
};

export const insertIntoTree = (
  elements: ThumbnailElement[],
  parentId: string | null,
  index: number,
  toInsert: ThumbnailElement,
): ThumbnailElement[] => {
  if (parentId === null) {
    const out = [...elements];
    const adj = Math.max(0, Math.min(index, out.length));
    out.splice(adj, 0, toInsert);
    return out;
  }
  return elements.map((el) => {
    if (el.id === parentId && isGroup(el)) {
      const newChildren = [...el.children];
      const adj = Math.max(0, Math.min(index, newChildren.length));
      newChildren.splice(adj, 0, toInsert);
      return { ...el, children: newChildren };
    }
    if (isGroup(el)) {
      return {
        ...el,
        children: insertIntoTree(el.children, parentId, index, toInsert),
      };
    }
    return el;
  });
};

export const isDescendantOf = (
  ancestor: ThumbnailElement,
  descendantId: string,
): boolean => {
  if (!isGroup(ancestor)) return false;
  const search = (els: ThumbnailElement[]): boolean => {
    for (const el of els) {
      if (el.id === descendantId) return true;
      if (isGroup(el) && search(el.children)) return true;
    }
    return false;
  };
  return search(ancestor.children);
};

// Compute the axis-aligned bounding box of a list of elements,
// in the coordinate space of their parent (each element's x, y, width, height).
// Note: ignores rotation for simplicity (treats elements as axis-aligned at create time).
export const computeBoundingBox = (
  elements: ThumbnailElement[],
): { x: number; y: number; width: number; height: number } => {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const el of elements) {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

const degToRad = (deg: number) => (deg * Math.PI) / 180;

// Apply a parent's transform to a child's local coords, returning the child's
// world coords. Used when ungrouping to flatten transform back into children.
export const applyParentTransform = (
  parent: {
    x: number;
    y: number;
    rotation: number;
    scaleX?: number;
    scaleY?: number;
  },
  child: ThumbnailElement,
): ThumbnailElement => {
  const sx = parent.scaleX ?? 1;
  const sy = parent.scaleY ?? 1;
  const rad = degToRad(parent.rotation);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const localX = child.x * sx;
  const localY = child.y * sy;
  const rotatedX = localX * cos - localY * sin;
  const rotatedY = localX * sin + localY * cos;
  const worldX = parent.x + rotatedX;
  const worldY = parent.y + rotatedY;
  const worldRotation = (child.rotation + parent.rotation) % 360;

  return {
    ...child,
    x: worldX,
    y: worldY,
    rotation: worldRotation,
  } as ThumbnailElement;
};

// Compose a list of ancestor transforms (immediate parent first, then up to
// root) onto an element's local coordinates, producing the element's WORLD
// coordinates.
export const elementLocalToWorld = (
  element: ThumbnailElement,
  ancestors: { x: number; y: number; rotation: number; scaleX?: number; scaleY?: number }[],
): ThumbnailElement => {
  // ancestors are root-first (e.g. [Outer, Inner]). Apply innermost first so
  // we walk outward toward world.
  let result = element;
  for (let i = ancestors.length - 1; i >= 0; i--) {
    result = applyParentTransform(ancestors[i], result);
  }
  return result;
};

// Inverse of elementLocalToWorld: take world coords down through a chain of
// ancestors (root-first order) into the innermost ancestor's local frame.
export const elementWorldToLocal = (
  element: ThumbnailElement,
  ancestors: { x: number; y: number; rotation: number; scaleX?: number; scaleY?: number }[],
): ThumbnailElement => {
  let result = element;
  for (const ancestor of ancestors) {
    result = applyInverseParentTransform(ancestor, result);
  }
  return result;
};

// Convert a child's world coords into the parent's local coordinate frame.
// Used when reparenting an element INTO a group so that its on-canvas position
// stays the same.
export const applyInverseParentTransform = (
  parent: {
    x: number;
    y: number;
    rotation: number;
    scaleX?: number;
    scaleY?: number;
  },
  child: ThumbnailElement,
): ThumbnailElement => {
  const sx = parent.scaleX ?? 1;
  const sy = parent.scaleY ?? 1;
  const rad = degToRad(-parent.rotation);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const dx = child.x - parent.x;
  const dy = child.y - parent.y;
  const rotatedX = dx * cos - dy * sin;
  const rotatedY = dx * sin + dy * cos;
  const localX = sx === 0 ? 0 : rotatedX / sx;
  const localY = sy === 0 ? 0 : rotatedY / sy;
  const localRotation = ((child.rotation - parent.rotation) % 360 + 360) % 360;

  return {
    ...child,
    x: localX,
    y: localY,
    rotation: localRotation,
  } as ThumbnailElement;
};
