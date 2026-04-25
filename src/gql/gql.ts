/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query PredictionEventMeta($slug: String!) {\n    event(slug: $slug) {\n      name\n      startAt\n      numEntrants\n      tournament {\n        name\n        url(tab: \"\", relative: false)\n        images {\n          url\n          type\n        }\n      }\n      phases {\n        id\n        phaseOrder\n      }\n    }\n  }\n": typeof types.PredictionEventMetaDocument,
    "\n  query PredictionPhaseSeeds($phaseId: ID!, $perPage: Int!, $page: Int!) {\n    phase(id: $phaseId) {\n      seeds(query: { page: $page, perPage: $perPage }) {\n        pageInfo {\n          total\n          totalPages\n        }\n        nodes {\n          seedNum\n          entrant {\n            id\n            name\n            participants {\n              gamerTag\n              prefix\n              user {\n                location {\n                  country\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n": typeof types.PredictionPhaseSeedsDocument,
    "\n  query EventStandings($slug: String!, $playerCount: Int!) {\n    event(slug: $slug) {\n      id\n      name\n      startAt\n      tournament {\n        name\n        addrState\n        city\n        countryCode\n        url(tab: \"\", relative: false)\n        images {\n          url\n          type\n          id\n        }\n      }\n      teamRosterSize {\n        maxPlayers\n        minPlayers\n      }\n      entrants(query: {}) {\n        pageInfo {\n          total\n        }\n      }\n      phases {\n        bracketType\n        groupCount\n      }\n      standings(query: { perPage: $playerCount, page: 1 }) {\n        nodes {\n          placement\n          entrant {\n            id\n            name\n          }\n          player {\n            gamerTag\n            prefix\n            user {\n              id\n              authorizations(types: [TWITTER]) {\n                id\n                externalId\n                externalUsername\n              }\n              location {\n                country\n                countryId\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n": typeof types.EventStandingsDocument,
    "\n  query PlayerSets($slug: String!, $entrantId: ID!) {\n    event(slug: $slug) {\n      sets(perPage: 50, page: 1, filters: { entrantIds: [$entrantId] }) {\n        nodes {\n          games {\n            selections {\n              character {\n                id\n              }\n              entrant {\n                id\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n": typeof types.PlayerSetsDocument,
};
const documents: Documents = {
    "\n  query PredictionEventMeta($slug: String!) {\n    event(slug: $slug) {\n      name\n      startAt\n      numEntrants\n      tournament {\n        name\n        url(tab: \"\", relative: false)\n        images {\n          url\n          type\n        }\n      }\n      phases {\n        id\n        phaseOrder\n      }\n    }\n  }\n": types.PredictionEventMetaDocument,
    "\n  query PredictionPhaseSeeds($phaseId: ID!, $perPage: Int!, $page: Int!) {\n    phase(id: $phaseId) {\n      seeds(query: { page: $page, perPage: $perPage }) {\n        pageInfo {\n          total\n          totalPages\n        }\n        nodes {\n          seedNum\n          entrant {\n            id\n            name\n            participants {\n              gamerTag\n              prefix\n              user {\n                location {\n                  country\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n": types.PredictionPhaseSeedsDocument,
    "\n  query EventStandings($slug: String!, $playerCount: Int!) {\n    event(slug: $slug) {\n      id\n      name\n      startAt\n      tournament {\n        name\n        addrState\n        city\n        countryCode\n        url(tab: \"\", relative: false)\n        images {\n          url\n          type\n          id\n        }\n      }\n      teamRosterSize {\n        maxPlayers\n        minPlayers\n      }\n      entrants(query: {}) {\n        pageInfo {\n          total\n        }\n      }\n      phases {\n        bracketType\n        groupCount\n      }\n      standings(query: { perPage: $playerCount, page: 1 }) {\n        nodes {\n          placement\n          entrant {\n            id\n            name\n          }\n          player {\n            gamerTag\n            prefix\n            user {\n              id\n              authorizations(types: [TWITTER]) {\n                id\n                externalId\n                externalUsername\n              }\n              location {\n                country\n                countryId\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n": types.EventStandingsDocument,
    "\n  query PlayerSets($slug: String!, $entrantId: ID!) {\n    event(slug: $slug) {\n      sets(perPage: 50, page: 1, filters: { entrantIds: [$entrantId] }) {\n        nodes {\n          games {\n            selections {\n              character {\n                id\n              }\n              entrant {\n                id\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n": types.PlayerSetsDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PredictionEventMeta($slug: String!) {\n    event(slug: $slug) {\n      name\n      startAt\n      numEntrants\n      tournament {\n        name\n        url(tab: \"\", relative: false)\n        images {\n          url\n          type\n        }\n      }\n      phases {\n        id\n        phaseOrder\n      }\n    }\n  }\n"): (typeof documents)["\n  query PredictionEventMeta($slug: String!) {\n    event(slug: $slug) {\n      name\n      startAt\n      numEntrants\n      tournament {\n        name\n        url(tab: \"\", relative: false)\n        images {\n          url\n          type\n        }\n      }\n      phases {\n        id\n        phaseOrder\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PredictionPhaseSeeds($phaseId: ID!, $perPage: Int!, $page: Int!) {\n    phase(id: $phaseId) {\n      seeds(query: { page: $page, perPage: $perPage }) {\n        pageInfo {\n          total\n          totalPages\n        }\n        nodes {\n          seedNum\n          entrant {\n            id\n            name\n            participants {\n              gamerTag\n              prefix\n              user {\n                location {\n                  country\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query PredictionPhaseSeeds($phaseId: ID!, $perPage: Int!, $page: Int!) {\n    phase(id: $phaseId) {\n      seeds(query: { page: $page, perPage: $perPage }) {\n        pageInfo {\n          total\n          totalPages\n        }\n        nodes {\n          seedNum\n          entrant {\n            id\n            name\n            participants {\n              gamerTag\n              prefix\n              user {\n                location {\n                  country\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query EventStandings($slug: String!, $playerCount: Int!) {\n    event(slug: $slug) {\n      id\n      name\n      startAt\n      tournament {\n        name\n        addrState\n        city\n        countryCode\n        url(tab: \"\", relative: false)\n        images {\n          url\n          type\n          id\n        }\n      }\n      teamRosterSize {\n        maxPlayers\n        minPlayers\n      }\n      entrants(query: {}) {\n        pageInfo {\n          total\n        }\n      }\n      phases {\n        bracketType\n        groupCount\n      }\n      standings(query: { perPage: $playerCount, page: 1 }) {\n        nodes {\n          placement\n          entrant {\n            id\n            name\n          }\n          player {\n            gamerTag\n            prefix\n            user {\n              id\n              authorizations(types: [TWITTER]) {\n                id\n                externalId\n                externalUsername\n              }\n              location {\n                country\n                countryId\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query EventStandings($slug: String!, $playerCount: Int!) {\n    event(slug: $slug) {\n      id\n      name\n      startAt\n      tournament {\n        name\n        addrState\n        city\n        countryCode\n        url(tab: \"\", relative: false)\n        images {\n          url\n          type\n          id\n        }\n      }\n      teamRosterSize {\n        maxPlayers\n        minPlayers\n      }\n      entrants(query: {}) {\n        pageInfo {\n          total\n        }\n      }\n      phases {\n        bracketType\n        groupCount\n      }\n      standings(query: { perPage: $playerCount, page: 1 }) {\n        nodes {\n          placement\n          entrant {\n            id\n            name\n          }\n          player {\n            gamerTag\n            prefix\n            user {\n              id\n              authorizations(types: [TWITTER]) {\n                id\n                externalId\n                externalUsername\n              }\n              location {\n                country\n                countryId\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PlayerSets($slug: String!, $entrantId: ID!) {\n    event(slug: $slug) {\n      sets(perPage: 50, page: 1, filters: { entrantIds: [$entrantId] }) {\n        nodes {\n          games {\n            selections {\n              character {\n                id\n              }\n              entrant {\n                id\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query PlayerSets($slug: String!, $entrantId: ID!) {\n    event(slug: $slug) {\n      sets(perPage: 50, page: 1, filters: { entrantIds: [$entrantId] }) {\n        nodes {\n          games {\n            selections {\n              character {\n                id\n              }\n              entrant {\n                id\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;