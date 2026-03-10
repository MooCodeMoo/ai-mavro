#!/usr/bin/env node

/**
 * Automated Product Rules Import Script
 * Imports rules extracted from Slovenian technical data sheets
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'mavro-ai.db');
const db = new Database(dbPath);

// New rules to import
const newRules = [
  {
    substrate: 'Aluminium',
    contamination: 'General dirt / traffic film',
    productName: 'Alu Clean',
    dilution: 'Ready to use (undiluted)',
    applicationSteps: [
      'Always perform a test patch first',
      'Apply Alu Clean using a low-pressure sprayer, brush or sponge',
      'Rinse immediately with clean water and assess the effect',
      'Cleaning with a white pad or scrubbing sponge will accelerate the effect',
      'Repeat if necessary and extend soaking time by a few minutes'
    ],
    safetyGuidelines: 'Do not use on electrolytically galvanized surfaces. Do not use in full sun or on hot surfaces. Ensure good ventilation when using indoors. Do not mix with other products. Contains ammonium bifluoride.'
  },
  {
    substrate: 'Aluminium',
    contamination: 'Rust / oxide',
    productName: 'Alu Clean',
    dilution: 'Ready to use (undiluted)',
    applicationSteps: [
      'Always perform a test patch first',
      'Apply Alu Clean using a low-pressure sprayer, brush or sponge',
      'Rinse immediately with clean water and assess the effect',
      'Cleaning with a white pad or scrubbing sponge will accelerate the effect',
      'Repeat if necessary and extend soaking time by a few minutes'
    ],
    safetyGuidelines: 'Do not use on electrolytically galvanized surfaces. Do not use in full sun or on hot surfaces. Ensure good ventilation when using indoors. Do not mix with other products. Contains ammonium bifluoride.'
  },
  {
    substrate: 'Concrete',
    contamination: 'Efflorescence / cement veil',
    productName: 'Cement Efflorescence Cleaner',
    dilution: 'Ready to use (undiluted)',
    applicationSteps: [
      'Apply undiluted Cement Efflorescence Cleaner to the surface with a brush',
      'Allow to work for 5 to 10 minutes',
      'Scrub the dirt with a sponge or cleaning brush',
      'Rinse the surface thoroughly with water',
      'Repeat if necessary'
    ],
    safetyGuidelines: 'Do not dilute or mix with other products. Be careful when using alkaline products. Ensure good ventilation when using indoors. Contains hydrochloric acid and sulfuric acid. Wear protective gloves and eye protection.'
  },
  {
    substrate: 'Brick',
    contamination: 'Efflorescence / cement veil',
    productName: 'Cement Efflorescence Cleaner',
    dilution: 'Ready to use (undiluted)',
    applicationSteps: [
      'Apply undiluted Cement Efflorescence Cleaner to the surface with a brush',
      'Allow to work for 5 to 10 minutes',
      'Scrub the dirt with a sponge or cleaning brush',
      'Rinse the surface thoroughly with water',
      'Repeat if necessary'
    ],
    safetyGuidelines: 'Do not dilute or mix with other products. Be careful when using alkaline products. Ensure good ventilation when using indoors. Contains hydrochloric acid and sulfuric acid. Wear protective gloves and eye protection.'
  },
  {
    substrate: 'Paving stones',
    contamination: 'Efflorescence / cement veil',
    productName: 'Cement Efflorescence Cleaner',
    dilution: 'Ready to use (undiluted)',
    applicationSteps: [
      'Apply undiluted Cement Efflorescence Cleaner to the surface with a brush',
      'Allow to work for 5 to 10 minutes',
      'Scrub the dirt with a sponge or cleaning brush',
      'Rinse the surface thoroughly with water',
      'Repeat if necessary'
    ],
    safetyGuidelines: 'Do not dilute or mix with other products. Be careful when using alkaline products. Ensure good ventilation when using indoors. Contains hydrochloric acid and sulfuric acid. Wear protective gloves and eye protection.'
  },
  {
    substrate: 'Natural stone (hard)',
    contamination: 'Efflorescence / cement veil',
    productName: 'Cement Efflorescence Cleaner',
    dilution: 'Ready to use (undiluted)',
    applicationSteps: [
      'Test on an inconspicuous area first - not suitable for all natural stone types',
      'Apply undiluted Cement Efflorescence Cleaner to the surface with a brush',
      'Allow to work for 5 to 10 minutes',
      'Scrub the dirt with a sponge or cleaning brush',
      'Rinse the surface thoroughly with water',
      'Repeat if necessary'
    ],
    safetyGuidelines: 'IMPORTANT: Only suitable for acid-resistant natural stone. Do not use on soft or acid-sensitive stone. Always test first. Contains hydrochloric acid and sulfuric acid. Wear protective gloves and eye protection.'
  }
];

console.log('🚀 Starting Product Rules Import...\n');

try {
  // Prepare the insert statement
  const insert = db.prepare(`
    INSERT INTO rules (substrate, contamination, product_name, dilution, application_steps, safety_guidelines)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Check if rules already exist
  const checkDuplicate = db.prepare(`
    SELECT COUNT(*) as count FROM rules 
    WHERE substrate = ? AND contamination = ? AND product_name = ?
  `);

  let imported = 0;
  let skipped = 0;

  // Import each rule
  for (const rule of newRules) {
    const existing = checkDuplicate.get(rule.substrate, rule.contamination, rule.productName);
    
    if (existing.count > 0) {
      console.log(`⏭️  SKIP: ${rule.productName} (${rule.substrate} + ${rule.contamination}) - already exists`);
      skipped++;
    } else {
      const result = insert.run(
        rule.substrate,
        rule.contamination,
        rule.productName,
        rule.dilution,
        JSON.stringify(rule.applicationSteps),
        rule.safetyGuidelines
      );
      
      console.log(`✅ Added: ${rule.productName} (${rule.substrate} + ${rule.contamination}) - ID: ${result.lastInsertRowid}`);
      imported++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Import Summary:`);
  console.log(`   Total rules: ${newRules.length}`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped (duplicates): ${skipped}`);
  console.log('='.repeat(60));

  // Show all rules in database
  const allRules = db.prepare('SELECT COUNT(*) as count FROM rules WHERE active = 1').get();
  console.log(`\n📋 Total active rules in database: ${allRules.count}`);

  console.log('\n✨ Import complete! Check your admin dashboard.\n');

} catch (error) {
  console.error('❌ Import failed:', error);
  process.exit(1);
} finally {
  db.close();
}
