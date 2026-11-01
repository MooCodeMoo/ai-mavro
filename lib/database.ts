import type { CaseInput, Rule, SavedCase, Treatment } from "./domain";
async function backend() {
  return process.env.MAVRO_STORAGE === "blob"
    ? (await import("./blob-database")).blobDatabase
    : import("./sqlite-database");
}
export async function getRules(approvedOnly = false) {
  return (await backend()).getRules(approvedOnly);
}
export async function putRule(rule: Rule) {
  return (await backend()).putRule(rule);
}
export async function disableRule(id: string) {
  return (await backend()).disableRule(id);
}
export async function getCase(id: string) {
  return (await backend()).getCase(id);
}
export async function saveCase(input: CaseInput, treatment: Treatment | null) {
  return (await backend()).saveCase(input, treatment);
}
export async function listCases(limit = 25, offset = 0) {
  return (await backend()).listCases(limit, offset);
}
export async function reviewCase(
  id: string,
  status: SavedCase["review"],
  note: string,
) {
  return (await backend()).reviewCase(id, status, note);
}
export async function deleteCase(id: string) {
  return (await backend()).deleteCase(id);
}
export async function getPhoto(caseId: string, photoId: string) {
  return (await backend()).getPhoto(caseId, photoId);
}
export async function consumeRate(key: string, max: number, ms: number) {
  return (await backend()).consumeRate(key, max, ms);
}
export async function getDb() {
  return (await import("./sqlite-database")).getDb();
}
export async function overview() {
  if (process.env.MAVRO_STORAGE === "blob")
    return (
      (await backend()) as typeof import("./blob-database").blobDatabase
    ).overview();
  const db = await getDb();
  return {
    pending: Number(
      (
        await db.execute(
          "SELECT count(*) AS total FROM treatment_cases WHERE review='pending'",
        )
      ).rows[0].total,
    ),
    legacyAvailable:
      (
        await db.execute(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='analyses'",
        )
      ).rows.length > 0,
  };
}
export async function legacyExport() {
  if (process.env.MAVRO_STORAGE === "blob") return {};
  const db = await getDb();
  const tables = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('analyses','rules')",
  );
  const data: Record<string, unknown> = {};
  for (const row of tables.rows) {
    const name = String(row.name);
    data[name] = (await db.execute(`SELECT * FROM ${name}`)).rows;
  }
  return data;
}
