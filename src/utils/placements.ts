export const getPlacements = (playerCount: number): number[] => {
  const placements: number[] = [];

  for (let i = 0; i < Math.min(4, playerCount); i++) {
    placements.push(i + 1);
  }

  if (placements.length >= playerCount) return placements;

  let placementValue = 5;
  let groupSize = 2;
  let groupsAtCurrentSize = 0;

  while (placements.length < playerCount) {
    for (let i = 0; i < groupSize && placements.length < playerCount; i++) {
      placements.push(placementValue);
    }
    placementValue += groupSize;
    groupsAtCurrentSize++;
    if (groupsAtCurrentSize === 2) {
      groupSize *= 2;
      groupsAtCurrentSize = 0;
    }
  }

  return placements;
};
