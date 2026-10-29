#!/usr/bin/env node
/**
 * Blocks committing secret-bearing paths or staged content that looks like credentials.
 */
import { execFileSync } from "node:child_process";

function stagedFiles() {
  const out = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR"], {
    encoding: "utf8",
  });
  return out
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function stagedPatch() {
  return execFileSync("git", ["diff", "--cached", "--unified=0"], { encoding: "utf8" });
}

const BLOCKED_PATH =
  /(^|\/)(\.env($|\.(?!example([./]|$)))|.*\.(pem|p12|p8|key|jks|keystore)$|credentials\.json$|id_rsa)/i;

const SECRET_LINE =
  /^\+.*(?:DATABASE_AUTH_TOKEN|API_SECRET|NEXT_PUBLIC_API_SECRET|AUTH_TOKEN|PRIVATE_KEY|AWS_SECRET|GITHUB_TOKEN)\s*=\s*(?!change-me|your_|your-|xxx|placeholder|example|<).+/im;

const JWT_OR_LONG =
  /^\+.*\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/m;

const HEX_SECRET = /^\+.*(?:SECRET|TOKEN|PASSWORD)\s*=\s*[a-f0-9]{32,}\s*$/im;

const files = stagedFiles();
const badPaths = files.filter((f) => BLOCKED_PATH.test(f));
if (badPaths.length > 0) {
  console.error("✕ Refusing commit — secret-like paths staged:");
  for (const f of badPaths) console.error(`  - ${f}`);
  console.error("Keep real secrets in .env (gitignored). Only .env.example may be committed.");
  process.exit(1);
}

if (files.length === 0) process.exit(0);

const patch = stagedPatch();
const hits = [];
if (SECRET_LINE.test(patch)) hits.push("env assignment that looks like a real secret");
if (JWT_OR_LONG.test(patch)) hits.push("JWT-like token");
if (HEX_SECRET.test(patch)) hits.push("long hex secret/token value");

if (hits.length > 0) {
  console.error("✕ Refusing commit — staged diff may contain secrets:");
  for (const h of hits) console.error(`  - ${h}`);
  console.error("Remove secrets from the index. Use placeholders in .env.example only.");
  process.exit(1);
}

console.log("→ Secret scan passed.");
