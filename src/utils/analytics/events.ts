// Single source of truth for PostHog event + property shapes.
//
// Naming conventions (per https://posthog.com/docs/product-analytics/best-practices):
//   - Events: `<object>_<verb>` in present tense, snake_case
//     (e.g. `tournament_load`, `graphic_export_start`)
//   - Properties: snake_case, namespaced by domain
//     (e.g. `tournament_platform`, `export_format`)
//   - Booleans prefixed with `is_` / `has_`
//   - Time fields suffixed with `_ms` (relative) or `_at` (absolute ISO)

export type TournamentPlatform = "startgg" | "challonge" | "tonamel";

export type FetchFailureKind =
  | "query_error"
  | "not_found"
  | "multi_group"
  | "post_process";

export type ExportSurface =
  | "predict"
  | "ranker"
  | "tier"
  | "thumbnail"
  | "results";

export type ShareMethod = "clipboard" | "url";

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
  // Editor engagement
  | "panel_switch"
  // Graphic export funnel
  | "graphic_export_start"
  | "graphic_export_complete"
  | "graphic_export_fail"
  | "graphic_share"
  // Customization
  | "template_select"
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
