let loaded = false;

export function initDemoToggle() {
  const btn = document.getElementById("demo-toggle");
  if (!btn) return;

  // Check if there are stored edits — if so, restore them
  restoreEdits();

  btn.addEventListener("click", () => {
    if (loaded) {
      // Toggle overlay by simulating keyboard shortcut
      toggleOverlay();
      return;
    }

    // First click: load the client bundle
    btn.textContent = "Loading...";

    const script = document.createElement("script");
    script.src = "/hemingway-client.js";
    script.onload = () => {
      loaded = true;
      btn.textContent = "Hemingway is active";
      btn.classList.add("active");

      // Trigger activation after brief delay for client init
      setTimeout(() => {
        toggleOverlay();
      }, 300);
    };
    script.onerror = () => {
      btn.textContent = "Try it on this page";
      console.warn(
        "[hemingway demo] Failed to load client bundle. Run `npm run build` in the repo root first.",
      );
    };
    document.body.appendChild(script);
  });
}

function toggleOverlay() {
  // Simulate the keyboard shortcut to toggle the overlay
  document.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "c",
      code: "KeyC",
      metaKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    }),
  );
}

function restoreEdits() {
  const editsRaw = sessionStorage.getItem("hemingway-demo-edits");
  if (!editsRaw) return;

  try {
    const edits: Array<{ oldText: string; newText: string }> =
      JSON.parse(editsRaw);
    if (edits.length === 0) return;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    while (walker.nextNode()) {
      const node = walker.currentNode;
      for (const edit of edits) {
        if (
          node.textContent &&
          node.textContent.trim() === edit.oldText.trim()
        ) {
          node.textContent = edit.newText;
        }
      }
    }
  } catch {
    // Invalid JSON, ignore
  }
}
