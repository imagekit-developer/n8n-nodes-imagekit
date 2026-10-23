# Agent guidelines

## Comments

- Add a comment only when it is absolutely necessary: the logic is genuinely complex and cannot be made clear through naming or structure. Otherwise, write no comment.
- Comments describe the code as it is now. Never describe what was removed or changed ("no longer does X", "previously Y", "moved to Z"); history belongs in git.
- Files under `nodes/Imagekit/resources/_generated/` are emitted by `scripts/generate.ts`; do not hand-edit them or their comments.

## Verification

- `npm run lint`
- `npx tsc --noEmit -p tsconfig.json`
- `npx jest` (or a path, e.g. `npx jest __tests__/triggers`)
