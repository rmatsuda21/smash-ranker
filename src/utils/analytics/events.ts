// Single source of truth for PostHog event + property shapes.
//
// Naming conventions (per https://posthog.com/docs/product-analytics/best-practices):
//   - Events: `<object>_<verb>` in present tense, snake_case
//     (e.g. `tournament_load`, `graphic_export_start`)
//   - Properties: snake_case, namespaced by domain
//     (e.g. `tournament_platform`, `export_format`)
//   - Booleans prefixed with `is_` / `has_`
//   - Time fields suffixed with `_ms` (relative) or `_at` (absolute ISO)

export type TournamentPlatform = "startgg" | "challonge" | "tonamel" | "hivee";

// Why a load failed. `not_found` and `unsupported` are the user's input;
// the rest say something about us or the platform.
export type FetchFailureKind =
  | "query_error"
  | "not_found"
  | "unsupported"
  | "multi_group"
  | "post_process"
  | "rate_limited"
  | "upstream"
  | "network";

// Why an export or upload failed.
export type ExportFailureKind =
  "blob_null" | "render_threw" | "duplicate_family" | "invalid_font";

export type FailureKind = FetchFailureKind | ExportFailureKind;

export type ExportSurface =
  | "predict"
  | "ranker"
  | "tier"
  | "thumbnail"
  | "results"
  | "player_card"
  | "recap";

// How an image left the app. Saving (`share_sheet`, `download`) is logged as
// `graphic_export_complete`; copying (`clipboard`) and links (`url`) as
// `graphic_share`.
export type ShareMethod = "clipboard" | "url" | "share_sheet" | "download";

// Outcome events fire on UI-visible state transitions. Funnel-shaped: pair
// each `_start` with a `_complete` and a `_fail` so success rate is queryable.
export type EventName =
  // Tournament load funnel
  | "tournament_url_submit"
  | "tournament_load"
  | "tournament_fetch_fail"
  // Predict funnel
  | "prediction_load"
  | "prediction_fetch_fail"
  // Results funnel
  | "results_load"
  | "results_fetch_fail"
  | "results_entrant_select"
  // start.gg login
  | "user_login_start"
  | "user_login"
  | "user_login_fail"
  | "user_logout"
  // Profile (/me)
  | "profile_view"
  | "profile_game_switch"
  // Tournament page
  | "tournament_page_view"
  | "tournament_page_fail"
  | "tournament_tab_switch"
  // Links from the home page, the profile and the tournament page into a tool
  | "tool_link_click"
  // Tier list
  | "tier_design_change"
  // Yearly recap
  | "recap_open"
  | "recap_finish"
  // Editor engagement
  | "panel_switch"
  // Graphic export funnel
  | "graphic_export_start"
  | "graphic_export_complete"
  | "graphic_export_fail"
  | "graphic_share"
  // Customization
  | "template_select"
  | "template_favorite"
  | "template_save"
  | "template_delete"
  | "custom_font_upload"
  | "custom_font_upload_fail"
  | "custom_asset_upload";

export type EventProps = Record<string, string | number | boolean | null>;

// Person properties (per-user, accumulating across sessions). Set via
// posthog.setPersonProperties; survive on the user profile.
//
// Counts (e.g. total exports) belong in the event stream — query via
// PostHog Insights with `count()` over `graphic_export_complete`. Person
// properties are for *state* (booleans, first/last timestamps).
export type PersonProps = {
  first_export_at?: string;
  last_export_at?: string;
  has_exported?: boolean;
  has_uploaded_custom_font?: boolean;
  has_uploaded_custom_asset?: boolean;
};

// Super properties (decorate every event with deployment context).
export type SuperProps = {
  app_environment: string;
  commit_sha: string;
};
