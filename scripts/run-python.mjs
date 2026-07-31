#!/usr/bin/env node
import { spawnSync } from "node:child_process";
const candidates = process.platform === "win32"
    ? [["py", ["-3"]], ["python", []], ["python3", []]]
    : [["python3", []], ["python", []]];
const forwarded = process.argv.slice(2);
for (const [command, prefix] of candidates) {
    const probe = spawnSync(command, [...prefix, "--version"], { stdio: "ignore", shell: false });
    if (probe.error || probe.status !== 0) continue;
    const result = spawnSync(command, [...prefix, ...forwarded], {
        stdio: "inherit", shell: false, env: process.env,
    });
    process.exit(typeof result.status === "number" ? result.status : 1);
}
console.error("Python 3 was not found.");
process.exit(127);
