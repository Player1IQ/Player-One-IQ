import checklist from "./post-beta-checklist.json";

export interface PostBetaChecklistItem {
  id: string;
  label: string;
  detail: string;
}

export interface PostBetaChecklistSection {
  id: string;
  title: string;
  items: PostBetaChecklistItem[];
}

export interface PostBetaChecklist {
  title: string;
  description: string;
  sections: PostBetaChecklistSection[];
}

export const POST_BETA_LAUNCH_CHECKLIST = checklist as PostBetaChecklist;

export const POST_BETA_STORAGE_KEY = "poiq-post-beta-checklist-v1";

export function getPostBetaChecklistProgress(
  completedIds: ReadonlySet<string>
): { completed: number; total: number } {
  const total = POST_BETA_LAUNCH_CHECKLIST.sections.reduce(
    (sum, section) => sum + section.items.length,
    0
  );
  const completed = POST_BETA_LAUNCH_CHECKLIST.sections.reduce(
    (sum, section) =>
      sum + section.items.filter((item) => completedIds.has(item.id)).length,
    0
  );
  return { completed, total };
}
