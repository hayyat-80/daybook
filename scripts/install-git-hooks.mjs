import { execFileSync } from "node:child_process";
import { chmodSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const hook = join(root, ".githooks", "pre-commit");

if (!existsSync(join(root, ".git"))) {
  process.exit(0);
}

chmodSync(hook, 0o755);
execFileSync("git", ["config", "core.hooksPath", ".githooks"], {
  cwd: root,
  stdio: "inherit",
});
console.log("Git hooks installed (.githooks).");
