// One tournament load at a time across every platform: each load takes a
// number when it starts and checks it before writing to the stores, so a
// slow answer to an earlier link never overwrites a newer one.
let current = 0;

export const beginTournamentLoad = (): number => ++current;

export const isCurrentTournamentLoad = (id: number): boolean => id === current;
