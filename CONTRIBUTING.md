# Contributing to Hemingway

Thanks for helping improve `hemingway-ai`.

## Prerequisites

- Node.js 20+
- npm

## Local Setup

```sh
npm install
npm run build
```

Run in watch mode:

```sh
npm run dev
```

## Repository Structure

- `src/server/*`: server runtime, generation, writeback
- `src/client/*`: browser overlay runtime
- `docs/*`: public documentation
- `docs/reference/*`: deep technical and agent docs

## Contribution Workflow

1. Create a branch from `main`.
2. Make focused changes with clear commit messages.
3. Run `npm run build` before opening a PR.
4. Update docs when behavior, config, or API changes.
5. Open a pull request using the PR template.

## Coding Guidelines

- Keep changes minimal and targeted.
- Preserve TypeScript ESM style.
- Avoid adding dependencies unless necessary.
- Do not silently change default behavior without updating docs.

## Documentation Requirements

If your change touches:

- Setup flow: update `README.md` and relevant `docs/getting-started/*`
- Config fields: update `docs/configuration.md`
- API routes/payloads: update `docs/api-reference.md`
- Runtime behavior: update `docs/reference/*`

## Reporting Bugs

Use the bug report template and include:

- Exact steps
- Expected vs actual behavior
- Environment details
- Relevant logs/screenshots

## Security Reports

Please do not file public issues for security vulnerabilities.
See [SECURITY.md](./SECURITY.md).
