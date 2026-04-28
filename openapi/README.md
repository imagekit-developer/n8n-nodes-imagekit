# Codegen for n8n-nodes-imagekit

This directory holds the inputs to the resource codegen. The OpenAPI spec
and Stainless SDK config live upstream; we mount them as a git submodule.

## Inputs

- `../vendor/sdk-generation/openapi/v1.0.0.yaml` — the OpenAPI spec, sourced
  via the [`imagekit-developer/sdk-generation`](https://github.com/imagekit-developer/sdk-generation)
  submodule. Refresh with:
  ```sh
  git submodule update --remote vendor/sdk-generation
  ```
- `../vendor/sdk-generation/stainless-config/main.yaml` — ImageKit's Stainless
  SDK config (resource grouping for their official SDKs). The generator reads
  it for cross-validation only — it warns when our `config.json` diverges from
  what Stainless ships, but never drives codegen directly. This is intentional:
  Stainless's grouping (e.g. `accounts.origins`, `cache.invalidation`) doesn't
  always match the flatter shape n8n nodes prefer.
- `config.json` — the n8n-specific overlay. Every spec operation is either
  listed under `operations` (codegen target) or `programmatic` (skipped,
  hand-written). Tags in the spec are too coarse (`Digital Asset Management
  (DAM)` covers ~25 ops), so the resource→operation grouping for n8n lives
  here.

## First-time clone

```sh
git clone <this-repo>
git submodule update --init --recursive
```

## Generator

`scripts/generate.ts` reads both files and produces one TS file per resource
at `nodes/Imagekit/resources/_generated/<resource>.ts`. Each file exports the
same shape the hand-written resources do today: `<resource>Description`
(an `INodeProperties[]`) and `execute<Resource>` (the request handler).

```sh
npm run generate          # regenerate _generated/
npm run generate:check    # fail if regeneration produces a diff (for CI)
npm test                  # the test suite imports from _generated/ directly
```

`nodes/Imagekit/Imagekit.node.ts` imports 9 of the 10 resources directly
from `./resources/_generated/`. The `file` resource is partial codegen:
9 of its 11 operations are generated, while `upload` (binary handling)
and `update` (collection field) stay hand-written under
`nodes/Imagekit/resources/file/{upload,update}.ts`. The splicer at
`nodes/Imagekit/resources/file/index.ts` composes them into a single
resource. The only fully hand-written resource is `asset` (its `list`
op uses derived sort values and a collection of optional filters).

## Supported features

The config supports these per-operation fields:

| Field             | Purpose                                                      |
| ----------------- | ------------------------------------------------------------ |
| `pathParams`      | OpenAPI `{path}` tokens → typed string UI fields             |
| `queryParams`     | Typed primitive UI fields sent as `qs`                       |
| `body`            | Single JSON-blob UI field, body sent as-is                   |
| `bodyFields`      | Decomposed typed primitives, assembled into the body object  |
| `successEnvelope` | Override DELETE response key (used for DELETE-with-body ops) |

Each typed field accepts `displayName`, `description`, `type` (`string` |
`boolean` | `number` | `json`), `required`, `default`, and `placeholder`.
Four optional modifiers cover non-uniform shapes:

| Modifier          | Where        | Effect                                                                                       |
| ----------------- | ------------ | -------------------------------------------------------------------------------------------- |
| `type: "json"`    | bodyFields   | UI shows a JSON editor; the value is `JSON.parse`d before being placed in the body           |
| `transform: "csv"`| bodyFields   | UI shows a string field; value is split on `,` and trimmed into `string[]` before sending    |
| `bodyKey`         | bodyFields   | Aliases the body field name when it differs from the n8n UI parameter name                   |
| `omitWhenDefault` | queryParams  | The value is only included in `qs` when it differs from `default` (e.g. optional bool flags) |

## Programmatic operations

Four operations stay hand-written because they need primitives the
generator doesn't yet model:

- `upload-file`, `upload-file-v2` — binary-data helpers (`assertBinaryData`,
  `getBinaryDataBuffer`), base64 encoding, and a different `baseURL`
  (`upload.imagekit.io`).
- `update-file-details` — n8n `collection` field with five nested options,
  each with its own transform (csv / `JSON.parse` / raw).
- `list-and-search-assets` — `collection` + a derived value
  (`sort = ${direction}_${by}`) + conditional-if-not-`all` qs entries.

These are listed under `programmatic` in `config.json` so the drift report
doesn't flag them. Move them into `operations` once the generator grows
support for collection fields and template-string composition.

## Webhook trigger node

The OpenAPI spec also exposes a top-level `webhooks:` block (OAS 3.1) that
lists every event ImageKit can deliver. The `triggers` map in `config.json`
groups those events for human readability; the generator then emits **one
single `ImagekitTrigger.node.ts`** with a multi-select Events dropdown that
includes every event across every group. This is the same shape as
`Slack`/`SlackTrigger` and is what makes n8n's node picker fold the
trigger together with the action node into one **Imagekit** brand panel.

The generator output sits at `nodes/Imagekit/ImagekitTrigger.node.ts` —
deliberately a sibling of `Imagekit.node.ts`, sharing the exact icon path
(`file:imagekit.svg`). Both factors are required for n8n's picker to
recognise them as one brand: the picker keys on the icon string verbatim,
so `file:imagekit.svg` and `file:../../imagekit.svg` count as different
brands even though they resolve to the same SVG.

Each `triggers.<key>` entry takes:

| Field         | Purpose                                                                          |
| ------------- | -------------------------------------------------------------------------------- |
| `displayName` | Reserved for future per-group ordering or sub-grouping in the dropdown           |
| `description` | Reserved (currently unused at codegen)                                           |
| `events`      | List of webhook operationIds (kebab-case) from the spec's `webhooks:` block      |

The generated trigger ships:

- **HMAC verification** via the hand-written
  `nodes/Imagekit/verifySignature.ts` helper. It implements the
  `x-ik-signature` scheme documented at
  <https://imagekit.io/docs/webhooks#verify-signature-manually>: the header
  carries `t=<unix-ms>,v1=<hex-hmac-sha256>` and the HMAC is computed over
  `${timestamp}.${rawBody}` with the webhook secret as the key.
- A new `imagekitWebhookApi` credential (see `credentials/ImagekitWebhookApi.credentials.ts`)
  holding only the signing secret. Distinct from the existing `imagekitApi`
  credential (private key for outbound REST), since the two have different
  lifecycles.
- A configurable replay-tolerance window (default 5 minutes).
- A multi-event filter — ImageKit fans every configured event out to one
  URL, so deliveries whose `type` is not in the user's Events selection
  get a 200 ack but no workflow run.

The generator validates that every operationId listed under `triggers.<key>.events`
exists in `spec.webhooks`, and emits a drift warning for webhook events the
spec exposes but no trigger group surfaces.

## Drift detection

`npm run generate` emits these cross-checks:

- **`[drift]` (operations)** — operations present in `spec.paths` but neither
  mapped under `operations` nor listed in `programmatic`.
- **`[drift]` (webhook events)** — events present in `spec.webhooks` but not
  surfaced by any trigger group.
- **`[stainless]`** — operations whose presence/absence in our `config.json`
  disagrees with the upstream Stainless config. Useful for catching upstream
  renames (Stainless drops an op) or additions (Stainless adds one).

Wire `npm run generate:check` into CI to fail PRs that haven't regenerated
after a submodule bump. The check covers `nodes/Imagekit/resources/_generated`,
`nodes/Imagekit/triggers/_generated`, and `openapi/config.json`.

## Refreshing upstream

A scheduled GitHub Action (`.github/workflows/sync-openapi.yml`) bumps the
submodule daily, regenerates, runs the test suite, and opens a PR if
anything changed. To bump locally:

```sh
git submodule update --remote vendor/sdk-generation
npm run generate
npm test
```
