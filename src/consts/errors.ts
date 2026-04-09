import { i18n } from "@lingui/core";
import { msg } from "@lingui/core/macro";

const multiGroupErrorMsg = msg`This tournament has multiple groups without a final bracket, so it doesn't produce a unified Top 8 ranking.`;

export const getMultiGroupError = (): string => i18n._(multiGroupErrorMsg);
