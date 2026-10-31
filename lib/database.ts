import { createClient, type Client, type InStatement } from "@libsql/client";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { CaseInput, Rule, SavedCase, Treatment } from "./domain";
import { HttpError } from "./http";
import { SEED_RULES } from "./rule-seeds";
let client: Client | undefined;
let initialization: Promise<void> | undefined;
function connection() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
    if (process.env.NODE_ENV === "production" && !url)
      throw new Error(
        "Configure a persistent DATABASE_URL or TURSO_DATABASE_URL before deployment.",
      );
    client = createClient({
      url: url || `file:${path.join(process.cwd(), "mavro-ai.db")}`,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}
async function init() {
  const db = connection();
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS schema_versions (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS treatment_rules (id TEXT PRIMARY KEY, substrate TEXT NOT NULL, contamination TEXT NOT NULL, product_id TEXT NOT NULL, approved INTEGER NOT NULL, data TEXT NOT NULL)`,
      `DROP INDEX IF EXISTS treatment_rules_one_active`,
      `CREATE UNIQUE INDEX IF NOT EXISTS treatment_rules_one_product ON treatment_rules(substrate,contamination,product_id) WHERE approved=1`,
      `CREATE INDEX IF NOT EXISTS treatment_rules_pair ON treatment_rules(substrate,contamination,approved)`,
      `CREATE TABLE IF NOT EXISTS treatment_cases (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, input TEXT NOT NULL, treatment TEXT, review TEXT NOT NULL DEFAULT 'pending', review_note TEXT NOT NULL DEFAULT '')`,
      `CREATE INDEX IF NOT EXISTS treatment_cases_date ON treatment_cases(created_at)`,
      `CREATE TABLE IF NOT EXISTS case_photos (id TEXT PRIMARY KEY, case_id TEXT NOT NULL REFERENCES treatment_cases(id) ON DELETE CASCADE, name TEXT NOT NULL, data TEXT NOT NULL)`,
      `CREATE INDEX IF NOT EXISTS case_photos_case ON case_photos(case_id)`,
      `CREATE TABLE IF NOT EXISTS rate_buckets (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at INTEGER NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL)`,
    ],
    "write",
  );
  if (
    (await db.execute("SELECT version FROM schema_versions WHERE version=2"))
      .rows.length
  )
    return;
  // Versioned INSERT OR IGNORE keeps deleted/disabled rules disabled and never overwrites an admin edit.
  await db.batch(
    [
      ...SEED_RULES.map((rule) => ({
        sql: `INSERT OR IGNORE INTO treatment_rules(id,substrate,contamination,product_id,approved,data) SELECT ?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM schema_versions WHERE version=2)`,
        args: [
          rule.id,
          rule.substrate,
          rule.contamination,
          rule.productId,
          1,
          JSON.stringify(rule),
        ],
      })),
      {
        sql: "INSERT OR IGNORE INTO schema_versions(version,applied_at) VALUES(2,?)",
        args: [new Date().toISOString()],
      },
    ],
    "write",
  );
}
export async function getDb() {
  initialization ??= init().catch((error) => {
    initialization = undefined;
    throw error;
  });
  await initialization;
  return connection();
}
export async function getRules(approvedOnly = false): Promise<Rule[]> {
  const db = await getDb();
  const result = await db.execute(
    `SELECT data FROM treatment_rules ${approvedOnly ? "WHERE approved=1" : ""} ORDER BY substrate,contamination`,
  );
  return result.rows.map((row) => JSON.parse(String(row.data)) as Rule);
}
export async function putRule(rule: Rule) {
  const db = await getDb();
  if (rule.approved) {
    const collision = await db.execute({
      sql: "SELECT id FROM treatment_rules WHERE substrate=? AND contamination=? AND product_id=? AND approved=1 AND id<>?",
      args: [rule.substrate, rule.contamination, rule.productId, rule.id],
    });
    if (collision.rows.length)
      throw new HttpError(
        409,
        "A published rule already exists for this product and combination. Edit or disable that rule first.",
      );
  }
  const updated = { ...rule, updatedAt: new Date().toISOString() };
  await db.batch(
    [
      {
        sql: `INSERT INTO treatment_rules(id,substrate,contamination,product_id,approved,data) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET substrate=excluded.substrate,contamination=excluded.contamination,product_id=excluded.product_id,approved=excluded.approved,data=excluded.data`,
        args: [
          rule.id,
          rule.substrate,
          rule.contamination,
          rule.productId,
          rule.approved ? 1 : 0,
          JSON.stringify(updated),
        ],
      },
      {
        sql: "INSERT INTO audit_log(at,action,target) VALUES(?,?,?)",
        args: [updated.updatedAt, "rule-update", rule.id],
      },
    ],
    "write",
  );
  return updated;
}
export async function disableRule(id: string) {
  const rule = (await getRules()).find((r) => r.id === id);
  if (!rule) return false;
  await putRule({ ...rule, approved: false });
  return true;
}
export async function saveCase(
  input: CaseInput,
  treatment: Treatment | null,
): Promise<SavedCase> {
  const db = await getDb(),
    id = randomUUID(),
    createdAt = new Date().toISOString();
  const { photos, ...details } = input;
  const pictureRows = photos.map((photo) => ({ ...photo, id: randomUUID() }));
  const statements: InStatement[] = [
    {
      sql: "INSERT INTO treatment_cases(id,created_at,input,treatment) VALUES(?,?,?,?)",
      args: [
        id,
        createdAt,
        JSON.stringify(details),
        treatment ? JSON.stringify(treatment) : null,
      ],
    },
    ...pictureRows.map((photo) => ({
      sql: "INSERT INTO case_photos(id,case_id,name,data) VALUES(?,?,?,?)",
      args: [photo.id, id, photo.name, photo.data],
    })),
  ];
  await db.batch(statements, "write");
  return {
    id,
    createdAt,
    input: details,
    treatment,
    review: "pending",
    reviewNote: "",
    photos: pictureRows.map(({ id, name }) => ({ id, name })),
  };
}
export async function getCase(id: string): Promise<SavedCase | null> {
  const db = await getDb(),
    result = await db.execute({
      sql: "SELECT * FROM treatment_cases WHERE id=?",
      args: [id],
    });
  const row = result.rows[0];
  if (!row) return null;
  const photos = await db.execute({
    sql: "SELECT id,name FROM case_photos WHERE case_id=?",
    args: [id],
  });
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    input: JSON.parse(String(row.input)),
    treatment: row.treatment ? JSON.parse(String(row.treatment)) : null,
    review: row.review as SavedCase["review"],
    reviewNote: String(row.review_note),
    photos: photos.rows.map((p) => ({
      id: String(p.id),
      name: String(p.name),
    })),
  };
}
export async function listCases(limit = 25, offset = 0) {
  const db = await getDb();
  const [page, count, pictures] = await db.batch(
    [
      {
        sql: "SELECT * FROM treatment_cases ORDER BY created_at DESC LIMIT ? OFFSET ?",
        args: [limit, offset],
      },
      "SELECT count(*) AS total FROM treatment_cases",
      {
        sql: "SELECT id,case_id,name FROM case_photos WHERE case_id IN (SELECT id FROM treatment_cases ORDER BY created_at DESC LIMIT ? OFFSET ?)",
        args: [limit, offset],
      },
    ],
    "read",
  );
  const grouped = new Map<string, SavedCase["photos"]>();
  for (const photo of pictures.rows) {
    const id = String(photo.case_id);
    const list = grouped.get(id) || [];
    list.push({ id: String(photo.id), name: String(photo.name) });
    grouped.set(id, list);
  }
  const analyses: SavedCase[] = page.rows.map((row) => ({
    id: String(row.id),
    createdAt: String(row.created_at),
    input: JSON.parse(String(row.input)),
    treatment: row.treatment ? JSON.parse(String(row.treatment)) : null,
    review: row.review as SavedCase["review"],
    reviewNote: String(row.review_note),
    photos: grouped.get(String(row.id)) || [],
  }));
  return { analyses, total: Number(count.rows[0].total), limit, offset };
}
export async function reviewCase(
  id: string,
  status: SavedCase["review"],
  note: string,
) {
  const db = await getDb();
  await db.batch(
    [
      {
        sql: "UPDATE treatment_cases SET review=?, review_note=? WHERE id=?",
        args: [status, note, id],
      },
      {
        sql: "INSERT INTO audit_log(at,action,target) VALUES(?,?,?)",
        args: [new Date().toISOString(), `case-${status}`, id],
      },
    ],
    "write",
  );
}
export async function deleteCase(id: string) {
  const db = await getDb();
  await db.batch(
    [
      { sql: "DELETE FROM case_photos WHERE case_id=?", args: [id] },
      { sql: "DELETE FROM treatment_cases WHERE id=?", args: [id] },
      {
        sql: "INSERT INTO audit_log(at,action,target) VALUES(?,?,?)",
        args: [new Date().toISOString(), "case-delete", id],
      },
    ],
    "write",
  );
}
export async function getPhoto(
  caseId: string,
  photoId: string,
): Promise<string | null> {
  const db = await getDb();
  const result = await db.execute({
    sql: "SELECT data FROM case_photos WHERE case_id=? AND id=?",
    args: [caseId, photoId],
  });
  return result.rows[0] ? String(result.rows[0].data) : null;
}
export async function consumeRate(
  key: string,
  maximum: number,
  windowMs: number,
) {
  const db = await getDb(),
    now = Date.now();
  // One atomic upsert; shared by all server instances when using remote libSQL.
  const result = await db.execute({
    sql: `INSERT INTO rate_buckets(key,hits,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN expires_at<=? THEN 1 ELSE hits+1 END,expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END RETURNING hits,expires_at`,
    args: [key, now + windowMs, now, now],
  });
  await db.execute({
    sql: "DELETE FROM rate_buckets WHERE expires_at<?",
    args: [now - windowMs],
  });
  return {
    allowed: Number(result.rows[0].hits) <= maximum,
    retryAfter: Math.max(
      1,
      Math.ceil((Number(result.rows[0].expires_at) - now) / 1000),
    ),
  };
}
