import { config } from '@n8n/node-cli/eslint';

// Exclude build-time scripts (codegen, etc.) from the lint pass. The n8n
// community-nodes rules are designed for the published runtime node code,
// where node:* imports, console statements, and `process` are forbidden
// for n8n Cloud compatibility. Those constraints do not apply to dev
// scripts that run on the maintainer's machine and never ship in `dist/`.
export default [...config, { ignores: ['scripts/**', '__tests__/**'] }];
