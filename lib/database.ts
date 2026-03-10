import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'mavro-ai.db');

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    initDatabase();
  }
  return db;
}

function initDatabase() {
  const database = db!;

  database.exec(`
    CREATE TABLE IF NOT EXISTS rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      substrate TEXT NOT NULL,
      contamination TEXT NOT NULL,
      product_name TEXT NOT NULL,
      dilution TEXT NOT NULL,
      application_steps TEXT NOT NULL,
      safety_guidelines TEXT NOT NULL,
      active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_name TEXT,
      image_size INTEGER,
      detected_substrate TEXT,
      detected_contamination TEXT,
      ai_confidence REAL,
      ai_notes TEXT,
      selected_substrate TEXT,
      selected_contamination TEXT,
      recommended_product TEXT,
      user_saved BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_rules_substrate ON rules(substrate);
    CREATE INDEX IF NOT EXISTS idx_rules_contamination ON rules(contamination);
    CREATE INDEX IF NOT EXISTS idx_analyses_date ON analyses(created_at);
  `);

  const count = database.prepare('SELECT COUNT(*) as count FROM rules').get() as { count: number };
  if (count.count === 0) {
    seedInitialRules(database);
  }
}

function seedInitialRules(database: Database.Database) {
  const initialRules = [
    {
      substrate: 'Concrete',
      contamination: 'Green deposits (algae/moss/lichen)',
      product_name: 'Mavro Algae Remover',
      dilution: '1:10 with water (1L product + 10L water)',
      application_steps: JSON.stringify([
        'Wet the surface lightly if it is very dry or warm.',
        'Apply with low-pressure sprayer from bottom to top.',
        'Allow to work for 15–30 minutes, do not let it dry.',
        'Rinse thoroughly with clean water.',
      ]),
      safety_guidelines: 'Wear gloves and eye protection. Avoid contact with plants; rinse them with water if exposed.',
    },
    {
      substrate: 'Concrete',
      contamination: 'General dirt / traffic film',
      product_name: 'Mavro Alkaline Cleaner / Stone Cleaner',
      dilution: '1:5–1:20 depending on soiling',
      application_steps: JSON.stringify([
        'Apply evenly with low-pressure sprayer or brush.',
        'Allow to work for 10–20 minutes.',
        'Agitate if needed with a brush or pad.',
        'Rinse thoroughly with clean water, preferably low/medium pressure.',
      ]),
      safety_guidelines: 'Wear gloves and eye protection. Do not allow the product to dry on the surface.',
    },
    {
      substrate: 'Concrete',
      contamination: 'Black mould',
      product_name: 'Mavro mould/anti-fungal cleaner',
      dilution: 'According to label, often 1:10',
      application_steps: JSON.stringify([
        'Apply to the affected areas.',
        'Allow to work sufficiently (do not rinse too early).',
        'Rinse or wipe off, depending on surface and product.',
      ]),
      safety_guidelines: 'Wear gloves, eye protection and consider respiratory protection in confined spaces. Do not mix with other cleaners.',
    },
    {
      substrate: 'Brick',
      contamination: 'Green deposits (algae/moss/lichen)',
      product_name: 'Mavro Algae Remover',
      dilution: '1:10 with water',
      application_steps: JSON.stringify([
        'Wet the surface lightly.',
        'Apply with low-pressure sprayer.',
        'Allow to work for 15–30 minutes.',
        'Rinse thoroughly with clean water.',
      ]),
      safety_guidelines: 'Wear gloves and eye protection.',
    },
    {
      substrate: 'Roof tiles',
      contamination: 'Green deposits (algae/moss/lichen)',
      product_name: 'Mavro Roof Tile Cleaner',
      dilution: '1:5–1:10 depending on contamination',
      application_steps: JSON.stringify([
        'Ensure safe access to roof area.',
        'Pre-wet the tiles.',
        'Apply cleaner evenly.',
        'Allow to work for 20–30 minutes.',
        'Rinse thoroughly from top to bottom.',
      ]),
      safety_guidelines: 'Work safely at heights. Wear non-slip footwear, gloves and eye protection. Do not walk on wet tiles.',
    },
  ];

  const insert = database.prepare(`
    INSERT INTO rules (substrate, contamination, product_name, dilution, application_steps, safety_guidelines)
    VALUES (@substrate, @contamination, @product_name, @dilution, @application_steps, @safety_guidelines)
  `);

  const insertMany = database.transaction((rules) => {
    for (const rule of rules) insert.run(rule);
  });

  insertMany(initialRules);
}

export function getRecommendation(substrate: string, contamination: string) {
  const rule = getDb().prepare(`
    SELECT * FROM rules
    WHERE substrate = ? AND contamination = ? AND active = 1
    LIMIT 1
  `).get(substrate, contamination);

  if (!rule) return null;

  return {
    product: (rule as any).product_name,
    dilution: (rule as any).dilution,
    steps: JSON.parse((rule as any).application_steps),
    safety: (rule as any).safety_guidelines,
  };
}

export function saveAnalysis(data: {
  imageName?: string;
  imageSize?: number;
  detectedSubstrate?: string;
  detectedContamination?: string;
  aiConfidence?: number;
  aiNotes?: string;
  selectedSubstrate?: string;
  selectedContamination?: string;
  recommendedProduct?: string;
  userSaved?: boolean;
}) {
  const insert = getDb().prepare(`
    INSERT INTO analyses (
      image_name, image_size, detected_substrate, detected_contamination,
      ai_confidence, ai_notes, selected_substrate, selected_contamination,
      recommended_product, user_saved
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    data.imageName || null,
    data.imageSize || null,
    data.detectedSubstrate || null,
    data.detectedContamination || null,
    data.aiConfidence || null,
    data.aiNotes || null,
    data.selectedSubstrate || null,
    data.selectedContamination || null,
    data.recommendedProduct || null,
    data.userSaved ? 1 : 0
  );

  return result.lastInsertRowid;
}

export function getAnalyses(limit = 50, offset = 0) {
  return getDb().prepare(`
    SELECT * FROM analyses
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
}

export function getAnalysesCount() {
  const result = getDb().prepare('SELECT COUNT(*) as count FROM analyses').get() as { count: number };
  return result.count;
}

export function getStatistics() {
  const database = getDb();

  const totalAnalyses = database.prepare('SELECT COUNT(*) as count FROM analyses').get() as { count: number };
  const savedAnalyses = database.prepare('SELECT COUNT(*) as count FROM analyses WHERE user_saved = 1').get() as { count: number };

  const topContaminations = database.prepare(`
    SELECT detected_contamination, COUNT(*) as count
    FROM analyses
    WHERE detected_contamination IS NOT NULL
    GROUP BY detected_contamination
    ORDER BY count DESC
    LIMIT 5
  `).all();

  const topSurfaces = database.prepare(`
    SELECT detected_substrate, COUNT(*) as count
    FROM analyses
    WHERE detected_substrate IS NOT NULL
    GROUP BY detected_substrate
    ORDER BY count DESC
    LIMIT 5
  `).all();

  const avgConfidence = database.prepare(`
    SELECT AVG(ai_confidence) as avg
    FROM analyses
    WHERE ai_confidence IS NOT NULL
  `).get() as { avg: number };

  const recentAnalyses = database.prepare(`
    SELECT * FROM analyses
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  return {
    total: totalAnalyses.count,
    saved: savedAnalyses.count,
    topContaminations,
    topSurfaces,
    averageConfidence: avgConfidence.avg || 0,
    recentAnalyses,
  };
}

export function getAllRules() {
  return getDb().prepare('SELECT * FROM rules WHERE active = 1 ORDER BY substrate, contamination').all();
}

export function getRule(id: number) {
  return getDb().prepare('SELECT * FROM rules WHERE id = ?').get(id);
}

export function addRule(data: {
  substrate: string;
  contamination: string;
  productName: string;
  dilution: string;
  applicationSteps: string[];
  safetyGuidelines: string;
}) {
  const insert = getDb().prepare(`
    INSERT INTO rules (substrate, contamination, product_name, dilution, application_steps, safety_guidelines)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    data.substrate,
    data.contamination,
    data.productName,
    data.dilution,
    JSON.stringify(data.applicationSteps),
    data.safetyGuidelines
  );

  return result.lastInsertRowid;
}

export function updateRule(id: number, data: {
  substrate?: string;
  contamination?: string;
  productName?: string;
  dilution?: string;
  applicationSteps?: string[];
  safetyGuidelines?: string;
}) {
  const updates: string[] = [];
  const values: any[] = [];

  if (data.substrate !== undefined) {
    updates.push('substrate = ?');
    values.push(data.substrate);
  }
  if (data.contamination !== undefined) {
    updates.push('contamination = ?');
    values.push(data.contamination);
  }
  if (data.productName !== undefined) {
    updates.push('product_name = ?');
    values.push(data.productName);
  }
  if (data.dilution !== undefined) {
    updates.push('dilution = ?');
    values.push(data.dilution);
  }
  if (data.applicationSteps !== undefined) {
    updates.push('application_steps = ?');
    values.push(JSON.stringify(data.applicationSteps));
  }
  if (data.safetyGuidelines !== undefined) {
    updates.push('safety_guidelines = ?');
    values.push(data.safetyGuidelines);
  }

  if (updates.length === 0) return;

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const update = getDb().prepare(`
    UPDATE rules SET ${updates.join(', ')} WHERE id = ?
  `);

  return update.run(...values);
}

export function deleteRule(id: number) {
  return getDb().prepare('UPDATE rules SET active = 0 WHERE id = ?').run(id);
}

export function exportAnalysesJSON() {
  return getDb().prepare('SELECT * FROM analyses ORDER BY created_at DESC').all();
}
