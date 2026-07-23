import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const checklistPath = resolve(
  process.cwd(),
  "src/lib/launch/post-beta-checklist.json"
);

export function loadPostBetaChecklist() {
  return JSON.parse(readFileSync(checklistPath, "utf8"));
}

export function printPostBetaChecklist() {
  const checklist = loadPostBetaChecklist();
  console.log(`\n── ${checklist.title} (manual) ──\n`);
  console.log(checklist.description);
  console.log(
    "\nTrack progress in Settings → Deploy checklist, or check items below:\n"
  );

  for (const section of checklist.sections) {
    console.log(`${section.title}`);
    for (const item of section.items) {
      console.log(`  [ ] ${item.label}`);
      console.log(`      ${item.detail}`);
    }
    console.log("");
  }
}

printPostBetaChecklist();
