#!/usr/bin/env tsx
/**
 * Codegen for n8n-nodes-imagekit.
 *
 * Reads the vendored OpenAPI spec at `openapi/imagekit.yaml` plus the
 * operation map at `openapi/config.json`, and produces one TS file per
 * resource at `nodes/Imagekit/resources/_generated/<resource>.ts`.
 *
 * Each generated file exports `<resource>Description` (INodeProperties[])
 * and `execute<Resource>` (IExecuteFunctions handler) — the same shape the
 * hand-written resources export today.
 *
 * Run via `npm run generate`. The generator never touches the hand-written
 * resources under `nodes/Imagekit/resources/<resource>/index.ts`; review the
 * generated output, then swap imports in `Imagekit.node.ts` when ready.
 *
 * Override mechanism: list an operationId under `programmatic` in
 * `openapi/config.json` and the generator will skip it. You then implement
 * it by hand. Operations not listed in `operations` and not marked
 * `programmatic` show up in the drift report at the end of a generate run.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as loadYaml } from 'js-yaml';
import { format as prettierFormat } from 'prettier';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
// The OpenAPI spec and Stainless SDK config both live in the upstream
// `imagekit-developer/sdk-generation` repo, mounted as a git submodule
// at `vendor/sdk-generation`. To refresh, run:
//   git submodule update --remote vendor/sdk-generation
const SUBMODULE = join(ROOT, 'vendor', 'sdk-generation');
const SPEC_PATH = join(SUBMODULE, 'openapi', 'v1.0.0.yaml');
const STAINLESS_CONFIG_PATH = join(SUBMODULE, 'stainless-config', 'main.yaml');
const CONFIG_PATH = join(ROOT, 'openapi', 'config.json');
const OUT_DIR = join(ROOT, 'nodes', 'Imagekit', 'resources', '_generated');
// The single generated trigger node sits next to `Imagekit.node.ts` (not in
// a subdirectory) so it shares an identical `file:imagekit.svg` icon path
// with the main action node — n8n's node picker uses the icon string as
// part of the brand-grouping key, so the strings must match byte-for-byte.
const TRIGGER_OUT_FILE = join(ROOT, 'nodes', 'Imagekit', 'ImagekitTrigger.node.ts');

// ---------- OpenAPI types ----------

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface OpenApiOperation {
	operationId?: string;
	summary?: string;
	description?: string;
}

type OpenApiPaths = Record<string, Partial<Record<HttpMethod, OpenApiOperation>>>;

interface OpenApiSpec {
	servers?: Array<{ url: string }>;
	paths: OpenApiPaths;
	/** Top-level OAS 3.1 `webhooks:` block. Each key is the event-name path
	 *  (e.g. `file.created`, `upload.pre-transform.success`) and the value is
	 *  a path-item where `post.operationId` is the stable identifier we map
	 *  to in `config.triggers.<group>.events`. */
	webhooks?: OpenApiPaths;
}

// ---------- Config schema ----------

type FieldType = 'string' | 'boolean' | 'number' | 'json';

interface ConfigField {
	displayName: string;
	description?: string;
	type?: FieldType; // default 'string'
	required?: boolean; // default true
	default?: string | boolean | number; // type-aware fallback ('' / false / 0 / '{}')
	placeholder?: string;
	/** When true on a queryParams field: only include in the request `qs` if
	 *  the value differs from the default. Used for optional flags that the
	 *  hand-written code conditionally sets (e.g. `customMetadataFields.list`'s
	 *  `includeDeleted`). */
	omitWhenDefault?: boolean;
	/** When set on a string-typed bodyFields field: applies the named transform
	 *  before assembling the body. `csv` splits the value by comma and trims
	 *  each entry, producing `string[]` (used by all `file.bulk*` ops). */
	transform?: 'csv';
	/** When the n8n UI parameter name differs from the API body field key.
	 *  e.g. `customMetadataFields.create` uses `fieldName` in the UI but the
	 *  API expects `name` in the body — set `bodyKey: "name"` on the
	 *  `fieldName` entry. Only meaningful inside `bodyFields`. */
	bodyKey?: string;
}

interface ConfigPathParam {
	name: string;
	displayName: string;
	description?: string;
}

/** Single-JSON-blob body. Mutually exclusive with `bodyFields`. */
interface ConfigBodyBlob {
	name: string;
	displayName: string;
	description?: string;
}

interface ConfigOperation {
	resource: string;
	operation: string;
	name: string;
	action: string;
	description: string;
	pathParams?: Record<string, ConfigPathParam>;
	queryParams?: Record<string, ConfigField>;
	body?: ConfigBodyBlob;
	bodyFields?: Record<string, ConfigField>;
	/** Override which identifier appears in the DELETE success envelope.
	 *  Defaults to the last path param. Use this for DELETE-with-body cases
	 *  (e.g. folder.delete returns `{ success: true, folderPath }`). */
	successEnvelope?: string;
}

interface ConfigResource {
	displayName: string;
	singular: string;
	article: string;
	defaultOperation: string;
}

/** A group of webhook events surfaced as one n8n Trigger node. */
interface ConfigTrigger {
	/** Plain English label, used for the `displayName` ("ImageKit <X> Trigger"). */
	displayName: string;
	/** Long description shown in the node picker. */
	description: string;
	/** Webhook operationIds (kebab-case, matching `spec.webhooks[*].post.operationId`)
	 *  to surface as `Events` multi-options on this trigger. */
	events: string[];
}

interface Config {
	baseURL: string;
	resources: Record<string, ConfigResource>;
	programmatic: string[];
	operations: Record<string, ConfigOperation>;
	/** Optional. Each key produces one TriggerNode at
	 *  `nodes/Imagekit/triggers/_generated/<key>Trigger.node.ts`. */
	triggers?: Record<string, ConfigTrigger>;
}

// ---------- Internal model ----------

interface ResolvedOperation {
	operationId: string;
	method: HttpMethod;
	path: string;
	cfg: ConfigOperation;
	pathTokens: string[];
}

// ---------- Helpers ----------

function pascalCase(s: string): string {
	return s.replace(/(^|[^a-zA-Z0-9])([a-zA-Z0-9])/g, (_, __, c: string) => c.toUpperCase());
}

function loadSpec(): OpenApiSpec {
	return loadYaml(readFileSync(SPEC_PATH, 'utf8')) as OpenApiSpec;
}

function loadConfig(): Config {
	return JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as Config;
}

function pathTemplateTokens(path: string): string[] {
	return Array.from(path.matchAll(/\{([^}]+)\}/g)).map((m) => m[1]);
}

function indexSpec(spec: OpenApiSpec): Map<string, { method: HttpMethod; path: string; op: OpenApiOperation }> {
	const idx = new Map<string, { method: HttpMethod; path: string; op: OpenApiOperation }>();
	for (const [path, item] of Object.entries(spec.paths ?? {})) {
		for (const method of ['get', 'post', 'put', 'patch', 'delete'] as HttpMethod[]) {
			const op = item?.[method];
			if (!op?.operationId) continue;
			idx.set(op.operationId, { method, path, op });
		}
	}
	return idx;
}

function tsString(s: string): string {
	return JSON.stringify(s);
}

function fieldType(f: ConfigField): FieldType {
	return f.type ?? 'string';
}

function fieldDefault(f: ConfigField): string {
	if (f.default !== undefined) return JSON.stringify(f.default);
	switch (fieldType(f)) {
		case 'boolean':
			return 'false';
		case 'number':
			return '0';
		case 'json':
			return `'{}'`;
		default:
			return "''";
	}
}

function fieldRequired(f: ConfigField): boolean {
	return f.required ?? true;
}

/** TS expression to read a field value from the n8n params at index `i`.
 *  Honors `transform` (currently only `csv`) and `type: 'json'`. */
function fieldRead(name: string, f: ConfigField): string {
	const t = fieldType(f);
	if (t === 'json') {
		return `JSON.parse(this.getNodeParameter(${tsString(name)}, i) as string) as IDataObject`;
	}
	if (f.transform === 'csv') {
		return `(this.getNodeParameter(${tsString(name)}, i) as string).split(',').map((s) => s.trim())`;
	}
	const tsType = t === 'boolean' ? 'boolean' : t === 'number' ? 'number' : 'string';
	return `this.getNodeParameter(${tsString(name)}, i) as ${tsType}`;
}

// ---------- Code emission ----------

/** True iff the op surfaces any extra UI fields beyond the operation switch. */
function opHasExtraFields(op: ResolvedOperation): boolean {
	return (
		op.pathTokens.length > 0 ||
		Boolean(op.cfg.body) ||
		Boolean(op.cfg.bodyFields && Object.keys(op.cfg.bodyFields).length) ||
		Boolean(op.cfg.queryParams && Object.keys(op.cfg.queryParams).length)
	);
}

function emitDisplayOptionsConsts(resource: string, ops: ResolvedOperation[]): string {
	const lines: string[] = [];
	lines.push(`const showOnlyFor${pascalCase(resource)} = {`);
	lines.push(`\tresource: [${tsString(resource)}],`);
	lines.push(`};`);
	lines.push('');
	for (const op of ops) {
		if (!opHasExtraFields(op)) continue;
		lines.push(`const showOnlyFor${pascalCase(resource)}${pascalCase(op.cfg.operation)} = {`);
		lines.push(`\toperation: [${tsString(op.cfg.operation)}],`);
		lines.push(`\tresource: [${tsString(resource)}],`);
		lines.push(`};`);
		lines.push('');
	}
	return lines.join('\n');
}

function emitOperationOptions(resource: string, ops: ResolvedOperation[], defaultOp: string): string {
	const opts = ops
		.slice()
		.sort((a, b) => a.cfg.name.localeCompare(b.cfg.name))
		.map((op) =>
			[
				`\t\t{`,
				`\t\t\tname: ${tsString(op.cfg.name)},`,
				`\t\t\tvalue: ${tsString(op.cfg.operation)},`,
				`\t\t\taction: ${tsString(op.cfg.action)},`,
				`\t\t\tdescription: ${tsString(op.cfg.description)},`,
				`\t\t},`,
			].join('\n'),
		)
		.join('\n');
	return [
		`\t{`,
		`\t\tdisplayName: 'Operation',`,
		`\t\tname: 'operation',`,
		`\t\ttype: 'options',`,
		`\t\tnoDataExpression: true,`,
		`\t\tdisplayOptions: { show: showOnlyFor${pascalCase(resource)} },`,
		`\t\toptions: [`,
		opts,
		`\t\t],`,
		`\t\tdefault: ${tsString(defaultOp)},`,
		`\t},`,
	].join('\n');
}

function emitFieldNode(name: string, f: ConfigField, showConst: string): string {
	return [
		`\t{`,
		`\t\tdisplayName: ${tsString(f.displayName)},`,
		`\t\tname: ${tsString(name)},`,
		`\t\ttype: ${tsString(fieldType(f))},`,
		fieldRequired(f) ? `\t\trequired: true,` : null,
		`\t\tdefault: ${fieldDefault(f)},`,
		f.placeholder ? `\t\tplaceholder: ${tsString(f.placeholder)},` : null,
		f.description ? `\t\tdescription: ${tsString(f.description)},` : null,
		`\t\tdisplayOptions: { show: ${showConst} },`,
		`\t},`,
	]
		.filter((l): l is string => l !== null)
		.join('\n');
}

function emitFieldsForOp(resource: string, op: ResolvedOperation): string {
	const showConst = `showOnlyFor${pascalCase(resource)}${pascalCase(op.cfg.operation)}`;
	const blocks: string[] = [];

	// Path params (in declaration order from the path template).
	for (const tok of op.pathTokens) {
		const cfg = op.cfg.pathParams?.[tok];
		if (!cfg) {
			throw new Error(
				`Operation ${op.operationId}: path parameter "{${tok}}" is in the spec but missing from config.operations.${op.operationId}.pathParams`,
			);
		}
		blocks.push(
			emitFieldNode(
				cfg.name,
				{ displayName: cfg.displayName, description: cfg.description, type: 'string', required: true },
				showConst,
			),
		);
	}

	// Query params.
	if (op.cfg.queryParams) {
		for (const [name, f] of Object.entries(op.cfg.queryParams)) {
			blocks.push(emitFieldNode(name, f, showConst));
		}
	}

	// Body — either a single JSON blob (`body`) or a record of typed fields (`bodyFields`).
	if (op.cfg.body && op.cfg.bodyFields) {
		throw new Error(`Operation ${op.operationId}: only one of "body" or "bodyFields" may be set`);
	}
	if (op.cfg.body) {
		const b = op.cfg.body;
		blocks.push(
			[
				`\t{`,
				`\t\tdisplayName: ${tsString(b.displayName)},`,
				`\t\tname: ${tsString(b.name)},`,
				`\t\ttype: 'json',`,
				`\t\trequired: true,`,
				`\t\tdefault: '{}',`,
				b.description ? `\t\tdescription: ${tsString(b.description)},` : null,
				`\t\tdisplayOptions: { show: ${showConst} },`,
				`\t},`,
			]
				.filter((l): l is string => l !== null)
				.join('\n'),
		);
	}
	if (op.cfg.bodyFields) {
		for (const [name, f] of Object.entries(op.cfg.bodyFields)) {
			blocks.push(emitFieldNode(name, f, showConst));
		}
	}

	return blocks.length ? `\t// ${op.cfg.name}\n${blocks.join('\n')}` : '';
}

function emitDescription(resource: string, ops: ResolvedOperation[], cfgRes: ConfigResource): string {
	const parts: string[] = [];
	parts.push(`export const ${resource}Description: INodeProperties[] = [`);
	parts.push(emitOperationOptions(resource, ops, cfgRes.defaultOperation));
	for (const op of ops) {
		const fields = emitFieldsForOp(resource, op);
		if (fields) parts.push(fields);
	}
	parts.push(`];`);
	return parts.join('\n');
}

function emitUrlTemplate(op: ResolvedOperation): string {
	if (op.pathTokens.length === 0) return tsString(op.path);
	let result = op.path;
	for (const tok of op.pathTokens) {
		const cfg = op.cfg.pathParams![tok];
		result = result.replace(`{${tok}}`, '${' + cfg.name + '}');
	}
	return '`' + result + '`';
}

function emitExecuteCase(op: ResolvedOperation, baseURL: string): string {
	const lines: string[] = [];
	lines.push(`\t\tcase ${tsString(op.cfg.operation)}: {`);

	// Read path params.
	for (const tok of op.pathTokens) {
		const cfg = op.cfg.pathParams![tok];
		lines.push(`\t\t\tconst ${cfg.name} = this.getNodeParameter(${tsString(cfg.name)}, i) as string;`);
	}

	// Read query params. Read every field unconditionally; only the
	// inclusion in `qs` is conditional when `omitWhenDefault` is set.
	const qsEntries: Array<{ name: string; f: ConfigField }> = [];
	if (op.cfg.queryParams) {
		for (const [name, f] of Object.entries(op.cfg.queryParams)) {
			lines.push(`\t\t\tconst ${name} = ${fieldRead(name, f)};`);
			qsEntries.push({ name, f });
		}
	}
	const hasConditionalQs = qsEntries.some((e) => e.f.omitWhenDefault);

	// Read body. Each bodyFields entry may have a `bodyKey` aliasing the
	// API body key away from the n8n UI parameter name.
	let bodyExpr: string | null = null;
	if (op.cfg.body) {
		lines.push(
			`\t\t\tconst ${op.cfg.body.name} = JSON.parse(this.getNodeParameter(${tsString(op.cfg.body.name)}, i) as string);`,
		);
		bodyExpr = op.cfg.body.name;
	} else if (op.cfg.bodyFields) {
		const parts: string[] = [];
		for (const [name, f] of Object.entries(op.cfg.bodyFields)) {
			lines.push(`\t\t\tconst ${name} = ${fieldRead(name, f)};`);
			parts.push(f.bodyKey && f.bodyKey !== name ? `${f.bodyKey}: ${name}` : name);
		}
		bodyExpr = `{ ${parts.join(', ')} }`;
	}

	// `qs` construction. When at least one entry is `omitWhenDefault`, build
	// it imperatively so we can emit per-field guards; otherwise keep the
	// terser inline form for diff-cleanliness with the existing output.
	if (hasConditionalQs) {
		lines.push(`\t\t\tconst qs: IDataObject = {};`);
		for (const { name, f } of qsEntries) {
			if (f.omitWhenDefault) {
				const def = fieldDefault(f);
				lines.push(`\t\t\tif (${name} !== ${def}) qs.${name} = ${name};`);
			} else {
				lines.push(`\t\t\tqs.${name} = ${name};`);
			}
		}
	}

	// Build options.
	lines.push(`\t\t\toptions = {`);
	lines.push(`\t\t\t\tmethod: ${tsString(op.method.toUpperCase())},`);
	lines.push(`\t\t\t\tbaseURL: ${tsString(baseURL)},`);
	lines.push(`\t\t\t\turl: ${emitUrlTemplate(op)},`);
	if (hasConditionalQs) {
		lines.push(`\t\t\t\tqs,`);
	} else if (qsEntries.length > 0) {
		lines.push(`\t\t\t\tqs: { ${qsEntries.map((e) => e.name).join(', ')} },`);
	}
	if (bodyExpr) {
		lines.push(`\t\t\t\tbody: ${bodyExpr},`);
	}
	lines.push(`\t\t\t};`);

	// Response handling. DELETE returns `{ success, <id> }` envelope per
	// repo convention; the id field is the last path param by default, or
	// the explicit `successEnvelope` override (used for DELETE-with-body).
	if (op.method === 'delete') {
		lines.push(`\t\t\tawait this.helpers.httpRequestWithAuthentication.call(this, 'imagekitApi', options);`);
		// Success envelope keys: explicit override > all path-param names.
		// Hand-written DELETEs include every identifying path param (e.g.
		// fileVersion.delete returns { success, fileId, versionId }).
		const envelopeKeys: string[] =
			op.cfg.successEnvelope != null
				? [op.cfg.successEnvelope]
				: op.pathTokens.map((t) => op.cfg.pathParams![t].name);
		if (envelopeKeys.length > 0) {
			lines.push(`\t\t\treturn [{ json: { success: true, ${envelopeKeys.join(', ')} } as IDataObject }];`);
		} else {
			lines.push(`\t\t\treturn [{ json: { success: true } as IDataObject }];`);
		}
	} else {
		lines.push(
			`\t\t\tconst responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'imagekitApi', options);`,
		);
		// All GETs get an array-flatten guard. At runtime the branch only
		// triggers when the API returns a JSON array (i.e. list/collection
		// endpoints). For single-resource GETs the response is an object
		// and the branch is skipped. This matches the convention in the
		// hand-written list ops (e.g. fileVersion.list at /files/{id}/versions).
		if (op.method === 'get') {
			lines.push(`\t\t\tif (Array.isArray(responseData)) {`);
			lines.push(`\t\t\t\treturn this.helpers.returnJsonArray(responseData as IDataObject[]);`);
			lines.push(`\t\t\t}`);
		}
		lines.push(`\t\t\treturn [{ json: responseData as IDataObject }];`);
	}

	lines.push(`\t\t}`);
	return lines.join('\n');
}

function emitExecute(resource: string, ops: ResolvedOperation[], cfgRes: ConfigResource, baseURL: string): string {
	const fnName = `execute${pascalCase(resource)}`;
	const cases = ops.map((op) => emitExecuteCase(op, baseURL)).join('\n');
	return [
		`export async function ${fnName}(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {`,
		`\tconst operation = this.getNodeParameter('operation', i) as string;`,
		``,
		`\tlet options: IHttpRequestOptions;`,
		``,
		`\tswitch (operation) {`,
		cases,
		`\t\tdefault:`,
		`\t\t\tthrow new Error(\`Unsupported ${cfgRes.singular} operation: \${operation}\`);`,
		`\t}`,
		`}`,
	].join('\n');
}

function emitResourceFile(resource: string, ops: ResolvedOperation[], cfgRes: ConfigResource, baseURL: string): string {
	const header = [
		`// AUTO-GENERATED by scripts/generate.ts — do not edit by hand.`,
		`// Run \`npm run generate\` after updating vendor/sdk-generation or openapi/config.json.`,
	].join('\n');
	const imports = [
		`import type {`,
		`\tIDataObject,`,
		`\tIExecuteFunctions,`,
		`\tIHttpRequestOptions,`,
		`\tINodeExecutionData,`,
		`\tINodeProperties,`,
		`} from 'n8n-workflow';`,
	].join('\n');
	const consts = emitDisplayOptionsConsts(resource, ops);
	const desc = emitDescription(resource, ops, cfgRes);
	const exec = emitExecute(resource, ops, cfgRes, baseURL);
	return [header, '', imports, '', consts, desc, '', exec, ''].join('\n');
}

// ---------- Stainless cross-validation ----------

/** A flat (resource.subresource.method) → (HTTP method, path) entry parsed
 *  from the upstream Stainless config. Used purely for drift detection
 *  against `config.json`; never touches code generation. */
interface StainlessOp {
	stainlessPath: string; // e.g. "accounts.origins.create"
	httpMethod: HttpMethod;
	httpPath: string; // e.g. "/v1/accounts/origins"
}

/** Stainless resource node:
 *  resources:
 *    foo:
 *      methods: { create: post /x, ... }
 *      subresources: { bar: { methods: ..., subresources: ... } }
 *  We only care about `methods` and `subresources` for drift detection. */
interface StainlessResourceNode {
	methods?: Record<string, string | { endpoint?: string; type?: string }>;
	subresources?: Record<string, StainlessResourceNode>;
}

interface StainlessConfig {
	resources?: Record<string, StainlessResourceNode>;
}

function loadStainless(): StainlessConfig | null {
	if (!existsSync(STAINLESS_CONFIG_PATH)) return null;
	return loadYaml(readFileSync(STAINLESS_CONFIG_PATH, 'utf8')) as StainlessConfig;
}

/** Walks the Stainless resource tree, yielding one `StainlessOp` per real
 *  HTTP method declaration. `$shared` (model-only) and webhook unwrap entries
 *  are skipped because they don't correspond to OpenAPI operations. */
function flattenStainlessOps(cfg: StainlessConfig): StainlessOp[] {
	const out: StainlessOp[] = [];
	function walk(node: StainlessResourceNode, prefix: string[]): void {
		for (const [methodName, decl] of Object.entries(node.methods ?? {})) {
			// `decl` is either "post /v1/foo" or { endpoint: "post /v1/foo" } or { type: "webhook_unwrap", ... }.
			let endpoint: string | undefined;
			if (typeof decl === 'string') endpoint = decl;
			else if (decl && typeof decl === 'object' && typeof decl.endpoint === 'string') endpoint = decl.endpoint;
			if (!endpoint) continue; // skip webhook_unwrap and similar non-HTTP methods
			const match = endpoint.match(/^([a-z]+)\s+(\/.*)$/i);
			if (!match) continue;
			const [, method, path] = match;
			out.push({
				stainlessPath: [...prefix, methodName].join('.'),
				httpMethod: method.toLowerCase() as HttpMethod,
				httpPath: path,
			});
		}
		for (const [name, child] of Object.entries(node.subresources ?? {})) {
			walk(child, [...prefix, name]);
		}
	}
	for (const [name, node] of Object.entries(cfg.resources ?? {})) {
		if (name === '$shared') continue;
		walk(node, [name]);
	}
	return out;
}

/** Builds an `(httpMethod, httpPath) → operationId` reverse index from the
 *  OpenAPI spec, since Stainless keys ops by path+method while we key them
 *  by operationId. */
function pathMethodToOperationId(spec: OpenApiSpec): Map<string, string> {
	const idx = new Map<string, string>();
	for (const [path, item] of Object.entries(spec.paths ?? {})) {
		for (const method of ['get', 'post', 'put', 'patch', 'delete'] as HttpMethod[]) {
			const op = item?.[method];
			if (op?.operationId) idx.set(`${method} ${path}`, op.operationId);
		}
	}
	return idx;
}

/** Cross-checks our `config.json` mapping against the upstream Stainless
 *  config. Reports operations Stainless ships that we haven't mapped (and
 *  that aren't in `programmatic`), plus any (op id) we mapped that doesn't
 *  appear in Stainless (likely renamed/removed upstream). Output-only;
 *  never fails the build. */
function validateAgainstStainless(spec: OpenApiSpec, config: Config, stainless: StainlessConfig): void {
	const reverse = pathMethodToOperationId(spec);
	const stainlessOps = flattenStainlessOps(stainless);
	const stainlessOpIds = new Set<string>();
	const unresolved: StainlessOp[] = [];

	for (const sop of stainlessOps) {
		const opId = reverse.get(`${sop.httpMethod} ${sop.httpPath}`);
		if (opId) stainlessOpIds.add(opId);
		else unresolved.push(sop);
	}

	const ourOps = new Set([...Object.keys(config.operations), ...config.programmatic]);
	const stainlessButUnmapped = [...stainlessOpIds].filter((id) => !ourOps.has(id)).sort();
	const oursButNotInStainless = [...ourOps].filter((id) => !stainlessOpIds.has(id)).sort();

	if (stainlessButUnmapped.length) {
		console.warn(
			`[stainless] ${stainlessButUnmapped.length} operation(s) ImageKit's Stainless config exposes that are not in our config.json (add them under operations or programmatic):`,
		);
		for (const id of stainlessButUnmapped) console.warn(`  - ${id}`);
	}
	if (oursButNotInStainless.length) {
		console.warn(
			`[stainless] ${oursButNotInStainless.length} operation(s) in our config.json are not in upstream Stainless config (renamed or removed?):`,
		);
		for (const id of oursButNotInStainless) console.warn(`  - ${id}`);
	}
	if (unresolved.length) {
		console.warn(
			`[stainless] ${unresolved.length} Stainless method(s) had no matching path+method in the OpenAPI spec (upstream inconsistency):`,
		);
		for (const sop of unresolved) console.warn(`  - ${sop.stainlessPath} (${sop.httpMethod.toUpperCase()} ${sop.httpPath})`);
	}
}

// ---------- Webhook indexing ----------

/** Resolved webhook event: operationId, the event-name path key, and the
 *  human-readable summary. */
interface ResolvedWebhookEvent {
	operationId: string;
	/** The event identifier sent in the request body's `type` field, e.g.
	 *  `file.created`. Derived from the spec's `webhooks:` map key. */
	eventKey: string;
	summary: string;
}

/** Index `spec.webhooks[*].post.operationId` -> resolved metadata. */
function indexWebhooks(spec: OpenApiSpec): Map<string, ResolvedWebhookEvent> {
	const idx = new Map<string, ResolvedWebhookEvent>();
	for (const [eventKey, item] of Object.entries(spec.webhooks ?? {})) {
		const op = item?.post;
		if (!op?.operationId) continue;
		idx.set(op.operationId, {
			operationId: op.operationId,
			eventKey,
			summary: op.summary ?? eventKey,
		});
	}
	return idx;
}

// ---------- Trigger code emission ----------

/** Title-case a webhook summary ("File created" → "File Created",
 *  "Pre-transformation success" → "Pre-Transformation Success"). Words
 *  separated by spaces OR hyphens are each capitalized so the result
 *  satisfies the n8n lint rule `node-param-display-name-miscased`.
 *  The picker auto-prefixes "On " to trigger multi-options entries, so we
 *  deliberately omit it here — otherwise the UI renders "On On File Created". */
function eventToDisplayLabel(summary: string): string {
	return summary.replace(/(^|[\s-])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

/** Emits the single `ImagekitTrigger.node.ts` file. One n8n trigger node
 *  with a multi-select Events dropdown listing every webhook event the spec
 *  exposes — same shape as `SlackTrigger.node.ts`. The user picks which
 *  events the workflow reacts to; ImageKit fans every configured event out
 *  to one URL, so we filter inside `webhook()`. Sharing one file with the
 *  main action node's directory + icon path is what makes n8n's picker
 *  group them under a single "Imagekit" brand panel. */
function emitTriggerFile(
	triggers: Record<string, ConfigTrigger>,
	webhookIdx: Map<string, ResolvedWebhookEvent>,
): string {
	// Flatten every group's events into one ordered list, preserving config
	// order so the multi-options dropdown reads in the same shape developers
	// see in `openapi/config.json`.
	const allEvents: ResolvedWebhookEvent[] = [];
	for (const tcfg of Object.values(triggers)) {
		for (const opId of tcfg.events) {
			const ev = webhookIdx.get(opId);
			if (ev) allEvents.push(ev);
		}
	}

	// n8n's `node-param-multi-options-type-unsorted-items` rule requires
	// options sorted alphabetically by display name; do that here so the
	// generator output passes lint without follow-up autofix passes.
	// `description` is intentionally omitted: the option's `name` is the
	// title-cased form of `summary`, so an n8n lint rule flags any
	// description-equal-to-name as redundant.
	const sortedEvents = [...allEvents].sort((a, b) =>
		eventToDisplayLabel(a.summary).localeCompare(eventToDisplayLabel(b.summary)),
	);
	const eventOptions = sortedEvents
		.map((e) => {
			const label = eventToDisplayLabel(e.summary);
			return [
				`\t\t\t\t{`,
				`\t\t\t\t\tname: ${tsString(label)},`,
				`\t\t\t\t\tvalue: ${tsString(e.eventKey)},`,
				`\t\t\t\t},`,
			].join('\n');
		})
		.join('\n');

	const allEventValues = allEvents.map((e) => tsString(e.eventKey)).join(', ');

	const header = [
		`// AUTO-GENERATED by scripts/generate.ts — do not edit by hand.`,
		`// Run \`npm run generate\` after updating vendor/sdk-generation or openapi/config.json.`,
	].join('\n');

	const imports = [
		`import type {`,
		`\tIDataObject,`,
		`\tINodeType,`,
		`\tINodeTypeDescription,`,
		`\tIWebhookFunctions,`,
		`\tIWebhookResponseData,`,
		`} from 'n8n-workflow';`,
		`import { NodeConnectionType } from 'n8n-workflow';`,
		`import { verifyImagekitSignature } from './verifySignature';`,
	].join('\n');

	const body = `
/** Single trigger node for every ImageKit webhook event. Sits next to
 *  Imagekit.node.ts so n8n's picker groups them under one "Imagekit"
 *  panel (Actions + Triggers) — same convention as Slack/SlackTrigger.
 *  See https://imagekit.io/docs/webhooks for payload structure. */
export class ImagekitTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Imagekit Trigger',
		name: 'imagekitTrigger',
		icon: { light: 'file:imagekit.svg', dark: 'file:imagekit.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Triggers on ImageKit webhook events (file lifecycle, transformations, video processing).',
		eventTriggerDescription: 'Waiting for an ImageKit webhook delivery',
		defaults: { name: 'Imagekit Trigger' },
		inputs: [],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'imagekitWebhookApi',
				required: false,
				displayOptions: { show: { verifySignature: [true] } },
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'imagekit-webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: [${allEventValues}],
				description:
					'Which event types this trigger should fire on. ImageKit fans every configured event out to the same URL, so unselected events are 200-acked but no workflow run is started.',
				options: [
${eventOptions}
				],
			},
			{
				displayName: 'Verify Signature',
				name: 'verifySignature',
				type: 'boolean',
				default: true,
				description:
					'Whether to validate the x-ik-signature header against the webhook signing secret stored in the ImageKit Webhook credential. Strongly recommended; disable only for local debugging.',
			},
			{
				displayName:
					'Signature verification is disabled. Any caller who discovers this webhook URL can trigger this workflow with arbitrary payloads. Re-enable verification (and connect an ImageKit Webhook credential) before going to production.',
				name: 'verifySignatureDisabledNotice',
				type: 'notice',
				default: '',
				displayOptions: { show: { verifySignature: [false] } },
			},
			{
				displayName: 'Tolerance (Seconds)',
				name: 'toleranceSeconds',
				type: 'number',
				default: 300,
				typeOptions: { minValue: 0 },
				displayOptions: { show: { verifySignature: [true] } },
				description:
					'Maximum allowed difference between the timestamp in the x-ik-signature header and the current time. Helps mitigate replay attacks.',
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const events = this.getNodeParameter('events') as string[];
		const verify = this.getNodeParameter('verifySignature') as boolean;
		const toleranceSeconds = this.getNodeParameter('toleranceSeconds', 300) as number;
		const headers = this.getHeaderData() as IDataObject;
		const body = this.getBodyData() as IDataObject;
		const eventType = (body.type as string | undefined) ?? '';

		if (verify) {
			const credentials = await this.getCredentials('imagekitWebhookApi');
			const secret = (credentials?.secret as string | undefined) ?? '';
			// n8n's express layer preserves the raw text on req.rawBody; we need
			// it because re-stringifying the parsed body would change byte
			// ordering and break the HMAC.
			const req = this.getRequestObject() as unknown as { rawBody?: Buffer | string };
			const result = verifyImagekitSignature(
				req.rawBody,
				headers['x-ik-signature'] as string | string[] | undefined,
				secret,
				{ toleranceMs: toleranceSeconds * 1000 },
			);
			if (!result.valid) {
				const res = this.getResponseObject();
				res.status(401).json({ error: 'invalid-signature', reason: result.reason });
				return { noWebhookResponse: true };
			}
		}

		// Drop deliveries that aren't in the user-selected events filter.
		// 200-ack so ImageKit doesn't retry; the workflow just doesn't run.
		if (events.length > 0 && !events.includes(eventType)) {
			return { noWebhookResponse: false, workflowData: [] };
		}

		return { workflowData: [this.helpers.returnJsonArray([body])] };
	}
}
`;

	return [header, '', imports, body].join('\n');
}

// ---------- Driver ----------

async function main(): Promise<void> {
	const spec = loadSpec();
	const config = loadConfig();
	const specIdx = indexSpec(spec);

	for (const opId of Object.keys(config.operations)) {
		if (!specIdx.has(opId)) {
			throw new Error(`config.operations.${opId} does not exist in the OpenAPI spec`);
		}
	}
	for (const opId of config.programmatic) {
		if (!specIdx.has(opId)) {
			console.warn(`[warn] programmatic operationId "${opId}" not found in spec`);
		}
	}

	const byResource = new Map<string, ResolvedOperation[]>();
	for (const [opId, cfg] of Object.entries(config.operations)) {
		const hit = specIdx.get(opId)!;
		const tokens = pathTemplateTokens(hit.path);
		const resolved: ResolvedOperation = { operationId: opId, method: hit.method, path: hit.path, cfg, pathTokens: tokens };
		if (!byResource.has(cfg.resource)) byResource.set(cfg.resource, []);
		byResource.get(cfg.resource)!.push(resolved);
	}

	const mapped = new Set([...Object.keys(config.operations), ...config.programmatic]);
	const unmapped = [...specIdx.keys()].filter((id) => !mapped.has(id));
	if (unmapped.length) {
		console.warn(`[drift] ${unmapped.length} operation(s) in spec not mapped or marked programmatic:`);
		for (const id of unmapped) console.warn(`  - ${id}`);
	}

	// Cross-check against the upstream Stainless config. This is advisory:
	// it surfaces upstream additions/renames so we know when to refresh
	// `config.json`, but never fails the run.
	const stainless = loadStainless();
	if (stainless) validateAgainstStainless(spec, config, stainless);
	else console.warn(`[stainless] ${STAINLESS_CONFIG_PATH} not found; skipping cross-validation`);

	if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
	mkdirSync(OUT_DIR, { recursive: true });

	const prettierConfig = {
		semi: true,
		trailingComma: 'all' as const,
		bracketSpacing: true,
		useTabs: true,
		tabWidth: 2,
		arrowParens: 'always' as const,
		singleQuote: true,
		quoteProps: 'as-needed' as const,
		endOfLine: 'lf' as const,
		printWidth: 100,
	};
	const indexExports: string[] = [];

	for (const [resource, ops] of byResource) {
		const cfgRes = config.resources[resource];
		if (!cfgRes) throw new Error(`config.resources.${resource} is missing`);
		const code = emitResourceFile(resource, ops, cfgRes, config.baseURL);
		const formatted = await prettierFormat(code, { ...prettierConfig, parser: 'typescript' });
		const outPath = join(OUT_DIR, `${resource}.ts`);
		writeFileSync(outPath, formatted, 'utf8');
		console.log(`generated ${outPath} (${ops.length} op${ops.length === 1 ? '' : 's'})`);
		indexExports.push(`export * from './${resource}';`);
	}

	const indexHeader = [
		`// AUTO-GENERATED by scripts/generate.ts — do not edit by hand.`,
	].join('\n');
	writeFileSync(join(OUT_DIR, 'index.ts'), `${indexHeader}\n${indexExports.join('\n')}\n`, 'utf8');
	console.log(`generated ${join(OUT_DIR, 'index.ts')}`);

	// ---------- Trigger generation ----------

	const triggers = config.triggers ?? {};
	const triggerKeys = Object.keys(triggers);
	if (triggerKeys.length > 0) {
		const webhookIdx = indexWebhooks(spec);
		// Validate that every event referenced in `config.triggers` exists in
		// `spec.webhooks`. This is the trigger equivalent of the operations-side
		// existence check we run above.
		for (const [tk, tcfg] of Object.entries(triggers)) {
			for (const ev of tcfg.events) {
				if (!webhookIdx.has(ev)) {
					throw new Error(
						`config.triggers.${tk}.events references "${ev}" which is not a webhook operationId in the OpenAPI spec`,
					);
				}
			}
		}
		// Drift report for webhook events the spec exposes but our config
		// doesn't surface. Advisory; matches the [drift] section for ops.
		const surfaced = new Set<string>();
		for (const tcfg of Object.values(triggers)) for (const ev of tcfg.events) surfaced.add(ev);
		const unmappedWebhooks = [...webhookIdx.keys()].filter((id) => !surfaced.has(id));
		if (unmappedWebhooks.length) {
			console.warn(
				`[drift] ${unmappedWebhooks.length} webhook event(s) in spec not surfaced by any trigger:`,
			);
			for (const id of unmappedWebhooks) console.warn(`  - ${id}`);
		}

		// Emit a single ImagekitTrigger.node.ts (Slack-style multi-event
		// trigger) sibling to Imagekit.node.ts. Sharing the directory and
		// `file:imagekit.svg` icon path is what makes n8n's picker fold the
		// trigger and the action node into one "Imagekit" brand panel.
		const code = emitTriggerFile(triggers, webhookIdx);
		const formatted = await prettierFormat(code, { ...prettierConfig, parser: 'typescript' });
		writeFileSync(TRIGGER_OUT_FILE, formatted, 'utf8');
		console.log(`generated ${TRIGGER_OUT_FILE} (${webhookIdx.size} events in 1 trigger node)`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
