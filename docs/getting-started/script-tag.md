# Script-Tag Setup (Any Framework)

Use this when you do not want the React wrapper or are integrating into non-React stacks.

## 1. Start Hemingway Server

```sh
npx hemingway-ai
```

## 2. Inject Client Script On Your Dev Site

```html
<script src="http://localhost:4800/client.js"></script>
```

Add it only in local development.

## 3. Activate

Press `Cmd/Ctrl + Shift + H`.

## 4. Best Practices

- Keep the script disabled in production.
- Configure `sourcePatterns` so writeback only scans real source directories.
- Start with `writeAdapter: "generic"` for non-React templates if React adapter matching is too narrow.

