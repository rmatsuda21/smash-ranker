// What the popup asks the content script: the page's tournament, answered
// with a `TournamentPage` or null.
export const GET_PAGE = "smash-ranker/get-page";

export type GetPageMessage = { type: typeof GET_PAGE };
