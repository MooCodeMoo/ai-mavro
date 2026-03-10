#!/usr/bin/env node

/**
 * COMPLETE Product Rules Import Script - ALL BATCHES
 * Imports ALL rules from Slovenian technical data sheets
 * Total: 27 rules covering all products including specialized ones
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'mavro-ai.db');
const db = new Database(dbPath);

// ALL RULES - Complete compilation
const allNewRules = [
  // ==================== BATCH 1 - Original 6 Rules ====================
  
  // ALU CLEAN - Aluminium cleaner (2 rules)
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
  
  // CEMENT EFFLORESCENCE CLEANER (4 rules)
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
  },
  
  // ==================== BATCH 2 - Main Products (8 Rules) ====================
  
  // FACADECLEAN HC - Versatile facade cleaner (4 rules)
  {
    substrate: 'Concrete',
    contamination: 'Green deposits (algae/moss/lichen)',
    productName: 'Facadeclean HC',
    dilution: 'Light dirt: 1:2, Moderate dirt: 1:1, Extreme dirt: undiluted',
    applicationSteps: [
      'Apply Facadeclean HC undiluted or diluted with water depending on contamination level',
      'Apply with low-pressure sprayer or brush',
      'Apply to vertical surfaces from bottom to top',
      'Rinsing is not necessary but can be effective for removing last residues (wait 20-45 minutes)',
      'Repeat treatment if necessary'
    ],
    safetyGuidelines: 'Do not mix with other products. Be especially careful with acidic products and ammonia due to toxic hydrogen chloride fumes. Do not apply to hot surfaces or in direct sunlight. Wear gloves, protective clothing and safety glasses. Contains sodium hypochlorite.'
  },
  {
    substrate: 'Brick',
    contamination: 'Green deposits (algae/moss/lichen)',
    productName: 'Facadeclean HC',
    dilution: 'Light dirt: 1:2, Moderate dirt: 1:1, Extreme dirt: undiluted',
    applicationSteps: [
      'Apply Facadeclean HC undiluted or diluted with water depending on contamination level',
      'Apply with low-pressure sprayer or brush',
      'Apply to vertical surfaces from bottom to top',
      'Rinsing is not necessary but can be effective for removing last residues (wait 20-45 minutes)',
      'Repeat treatment if necessary'
    ],
    safetyGuidelines: 'Do not mix with other products. Be especially careful with acidic products and ammonia due to toxic hydrogen chloride fumes. Do not apply to hot surfaces or in direct sunlight. Wear gloves, protective clothing and safety glasses. Contains sodium hypochlorite.'
  },
  {
    substrate: 'Roof tiles',
    contamination: 'Green deposits (algae/moss/lichen)',
    productName: 'Facadeclean HC',
    dilution: 'Light dirt: 1:2, Moderate dirt: 1:1, Extreme dirt: undiluted',
    applicationSteps: [
      'Apply Facadeclean HC undiluted or diluted with water depending on contamination level',
      'Apply with low-pressure sprayer or brush',
      'Apply to vertical surfaces from bottom to top',
      'Rinsing is not necessary but can be effective for removing last residues (wait 20-45 minutes)',
      'Repeat treatment if necessary'
    ],
    safetyGuidelines: 'Do not mix with other products. Be especially careful with acidic products and ammonia due to toxic hydrogen chloride fumes. Do not apply to hot surfaces or in direct sunlight. Wear gloves, protective clothing and safety glasses. Contains sodium hypochlorite.'
  },
  {
    substrate: 'Render / mineral plaster',
    contamination: 'Green deposits (algae/moss/lichen)',
    productName: 'Facadeclean HC',
    dilution: 'Light dirt: 1:2, Moderate dirt: 1:1, Extreme dirt: undiluted',
    applicationSteps: [
      'Apply Facadeclean HC undiluted or diluted with water depending on contamination level',
      'Apply with low-pressure sprayer or brush',
      'Apply to vertical surfaces from bottom to top',
      'Rinsing is not necessary but can be effective for removing last residues (wait 20-45 minutes)',
      'Repeat treatment if necessary'
    ],
    safetyGuidelines: 'Do not mix with other products. Be especially careful with acidic products and ammonia due to toxic hydrogen chloride fumes. Do not apply to hot surfaces or in direct sunlight. Wear gloves, protective clothing and safety glasses. Contains sodium hypochlorite.'
  },
  
  // UNICLEAN LOW FOAMING - Universal cleaner (2 rules)
  {
    substrate: 'Concrete',
    contamination: 'General dirt / traffic film',
    productName: 'Uniclean Low Foaming',
    dilution: 'Dilute up to 1:30 with water or use concentrated',
    applicationSteps: [
      'Dilute Uniclean Low Foaming with water or use concentrated (dilute maximum 1:30)',
      'Apply with low-pressure sprayer or brush',
      'Allow product to work on surface for a few minutes',
      'Cleaning with white pad or cleaning sponge will accelerate effect',
      'Wipe surface with water and/or microfiber cloth',
      'Repeat if necessary'
    ],
    safetyGuidelines: 'Avoid contact with skin and eyes. Wear appropriate gloves, protective clothing and safety glasses. Do not mix with other products, be careful with acidic products. Contains caprylate-9 carboxylic acid and potassium hydroxide.'
  },
  {
    substrate: 'Brick',
    contamination: 'General dirt / traffic film',
    productName: 'Uniclean Low Foaming',
    dilution: 'Dilute up to 1:30 with water or use concentrated',
    applicationSteps: [
      'Dilute Uniclean Low Foaming with water or use concentrated (dilute maximum 1:30)',
      'Apply with low-pressure sprayer or brush',
      'Allow product to work on surface for a few minutes',
      'Cleaning with white pad or cleaning sponge will accelerate effect',
      'Wipe surface with water and/or microfiber cloth',
      'Repeat if necessary'
    ],
    safetyGuidelines: 'Avoid contact with skin and eyes. Wear appropriate gloves, protective clothing and safety glasses. Do not mix with other products, be careful with acidic products. Contains caprylate-9 carboxylic acid and potassium hydroxide.'
  },
  
  // UNICLEAN HIGH ALKALINE - Heavy duty degreaser (2 rules)
  {
    substrate: 'Concrete',
    contamination: 'Oil / grease',
    productName: 'Uniclean High Alkaline',
    dilution: 'Dilute with water or use concentrated depending on dirt level',
    applicationSteps: [
      'Dilute Uniclean High Alkaline with water or use concentrated depending on dirt level',
      'Apply with low-pressure sprayer, microfiber cloth or brush',
      'Allow product to work on surface for a few minutes',
      'Cleaning with white pad or cleaning sponge will accelerate effect',
      'Wipe surface with water and/or microfiber cloth',
      'Repeat if necessary'
    ],
    safetyGuidelines: 'Avoid contact with skin and eyes. Wear appropriate gloves, protective clothing and safety glasses. Do not mix with other products, be careful with acidic products. Do not use on alkali-sensitive surfaces. Contains potassium hydroxide.'
  },
  {
    substrate: 'Brick',
    contamination: 'Oil / grease',
    productName: 'Uniclean High Alkaline',
    dilution: 'Dilute with water or use concentrated depending on dirt level',
    applicationSteps: [
      'Dilute Uniclean High Alkaline with water or use concentrated depending on dirt level',
      'Apply with low-pressure sprayer, microfiber cloth or brush',
      'Allow product to work on surface for a few minutes',
      'Cleaning with white pad or cleaning sponge will accelerate effect',
      'Wipe surface with water and/or microfiber cloth',
      'Repeat if necessary'
    ],
    safetyGuidelines: 'Avoid contact with skin and eyes. Wear appropriate gloves, protective clothing and safety glasses. Do not mix with other products, be careful with acidic products. Do not use on alkali-sensitive surfaces. Contains potassium hydroxide.'
  },
  
  // ==================== SPECIALIZED PRODUCTS (13 Rules) ====================
  
  // WOOD RENOVATOR - Wood restoration (3 rules for common wood surfaces)
  {
    substrate: 'Wood',
    contamination: 'General dirt / traffic film',
    productName: 'Wood Renovator',
    dilution: 'Ready to use (undiluted)',
    applicationSteps: [
      'Always apply a test patch first to check result and suitability',
      'Apply Wood Renovator undiluted with low-pressure sprayer, bottle or soft brush',
      'Allow to work for 10-15 minutes to soak into surface',
      'Continue with white pad if necessary',
      'Rinse surface thoroughly with warm water under appropriate pressure (use low pressure for soft wood)',
      'Repeat if necessary'
    ],
    safetyGuidelines: 'Caustic product - always wear gloves and safety glasses. Always apply a test patch before use. Do not dilute or mix with other products. Ensure good ventilation indoors. Contains oxalic acid.'
  },
  {
    substrate: 'Wood',
    contamination: 'Black mould',
    productName: 'Wood Renovator',
    dilution: 'Ready to use (undiluted)',
    applicationSteps: [
      'Always apply a test patch first to check result and suitability',
      'Apply Wood Renovator undiluted with low-pressure sprayer, bottle or soft brush',
      'Allow to work for 10-15 minutes to soak into surface',
      'Continue with white pad if necessary',
      'Rinse surface thoroughly with warm water under appropriate pressure (use low pressure for soft wood)',
      'Repeat if necessary'
    ],
    safetyGuidelines: 'Caustic product - always wear gloves and safety glasses. Always apply a test patch before use. Do not dilute or mix with other products. Ensure good ventilation indoors. Contains oxalic acid.'
  },
  {
    substrate: 'Wood',
    contamination: 'Green deposits (algae/moss/lichen)',
    productName: 'Wood Renovator',
    dilution: 'Ready to use (undiluted)',
    applicationSteps: [
      'Always apply a test patch first to check result and suitability',
      'Apply Wood Renovator undiluted with low-pressure sprayer, bottle or soft brush',
      'Allow to work for 10-15 minutes to soak into surface',
      'Continue with white pad if necessary',
      'Rinse surface thoroughly with warm water under appropriate pressure (use low pressure for soft wood)',
      'Repeat if necessary'
    ],
    safetyGuidelines: 'Caustic product - always wear gloves and safety glasses. Always apply a test patch before use. Do not dilute or mix with other products. Ensure good ventilation indoors. Contains oxalic acid.'
  },
  
  // UNICLEAN HIGH FOAMING - Touchless foam cleaning (4 rules)
  {
    substrate: 'Concrete',
    contamination: 'General dirt / traffic film',
    productName: 'Uniclean High Foaming',
    dilution: 'Dilute 1:30 with water depending on contamination',
    applicationSteps: [
      'Dilute Uniclean High Foaming 1:30 with water depending on contamination level',
      'Apply with suitable high-pressure foam equipment for desired foam effect',
      'Allow product to work on surface for a few minutes',
      'For stubborn dirt, continue with soft brush',
      'Rinse surface with appropriate pressure'
    ],
    safetyGuidelines: 'Avoid contact with skin and eyes. Wear appropriate gloves, protective clothing and safety glasses. Do not mix with other products, be especially careful with acidic products. Dilute only with clean tap water, demi water or osmosis water. Do not apply to hot surfaces or direct sunlight.'
  },
  {
    substrate: 'Brick',
    contamination: 'General dirt / traffic film',
    productName: 'Uniclean High Foaming',
    dilution: 'Dilute 1:30 with water depending on contamination',
    applicationSteps: [
      'Dilute Uniclean High Foaming 1:30 with water depending on contamination level',
      'Apply with suitable high-pressure foam equipment for desired foam effect',
      'Allow product to work on surface for a few minutes',
      'For stubborn dirt, continue with soft brush',
      'Rinse surface with appropriate pressure'
    ],
    safetyGuidelines: 'Avoid contact with skin and eyes. Wear appropriate gloves, protective clothing and safety glasses. Do not mix with other products, be especially careful with acidic products. Dilute only with clean tap water, demi water or osmosis water. Do not apply to hot surfaces or direct sunlight.'
  },
  {
    substrate: 'Render / mineral plaster',
    contamination: 'General dirt / traffic film',
    productName: 'Uniclean High Foaming',
    dilution: 'Dilute 1:30 with water depending on contamination',
    applicationSteps: [
      'Dilute Uniclean High Foaming 1:30 with water depending on contamination level',
      'Apply with suitable high-pressure foam equipment for desired foam effect',
      'Allow product to work on surface for a few minutes',
      'For stubborn dirt, continue with soft brush',
      'Rinse surface with appropriate pressure'
    ],
    safetyGuidelines: 'Avoid contact with skin and eyes. Wear appropriate gloves, protective clothing and safety glasses. Do not mix with other products, be especially careful with acidic products. Dilute only with clean tap water, demi water or osmosis water. Do not apply to hot surfaces or direct sunlight.'
  },
  {
    substrate: 'Paving stones',
    contamination: 'General dirt / traffic film',
    productName: 'Uniclean High Foaming',
    dilution: 'Dilute 1:30 with water depending on contamination',
    applicationSteps: [
      'Dilute Uniclean High Foaming 1:30 with water depending on contamination level',
      'Apply with suitable high-pressure foam equipment for desired foam effect',
      'Allow product to work on surface for a few minutes',
      'For stubborn dirt, continue with soft brush',
      'Rinse surface with appropriate pressure'
    ],
    safetyGuidelines: 'Avoid contact with skin and eyes. Wear appropriate gloves, protective clothing and safety glasses. Do not mix with other products, be especially careful with acidic products. Dilute only with clean tap water, demi water or osmosis water. Do not apply to hot surfaces or direct sunlight.'
  },
  
  // STRIP-OFF SERIES - Graffiti removal (6 rules - 2 per product)
  {
    substrate: 'Concrete',
    contamination: 'Graffiti',
    productName: 'Strip-Off',
    dilution: 'Ready to use (undiluted)',
    applicationSteps: [
      'Apply Strip-Off undiluted with brush or roller in thick layer',
      'Wait 30 minutes to 36 hours depending on temperature and layers of paint',
      'Prevent product from drying - cover with foil for long applications',
      'Spray dissolved paint from surface with high pressure (50-300 bar) and hot water (70-90°C)',
      'Work from bottom to top, adjust pressure to surface',
      'On sensitive surfaces, scrape dissolved paint with putty or plastic scraper',
      'Rinse surface thoroughly with clean water after cleaning'
    ],
    safetyGuidelines: 'Avoid inhalation, ensure adequate ventilation. Avoid contact with skin and eyes. Wear appropriate gloves, protective clothing and safety glasses. Do not dilute or mix with other products.'
  },
  {
    substrate: 'Brick',
    contamination: 'Graffiti',
    productName: 'Strip-Off',
    dilution: 'Ready to use (undiluted)',
    applicationSteps: [
      'Apply Strip-Off undiluted with brush or roller in thick layer',
      'Wait 30 minutes to 36 hours depending on temperature and layers of paint',
      'Prevent product from drying - cover with foil for long applications',
      'Spray dissolved paint from surface with high pressure (50-300 bar) and hot water (70-90°C)',
      'Work from bottom to top, adjust pressure to surface',
      'On sensitive surfaces, scrape dissolved paint with putty or plastic scraper',
      'Rinse surface thoroughly with clean water after cleaning'
    ],
    safetyGuidelines: 'Avoid inhalation, ensure adequate ventilation. Avoid contact with skin and eyes. Wear appropriate gloves, protective clothing and safety glasses. Do not dilute or mix with other products.'
  },
  {
    substrate: 'Concrete',
    contamination: 'Graffiti',
    productName: 'Strip-Off Plus',
    dilution: 'Ready to use (undiluted)',
    applicationSteps: [
      'Apply Strip-Off Plus undiluted with brush or roller in thick layer',
      'Wait 30 minutes to 1 hour depending on temperature and number of coats',
      'Prevent product from drying - cover with plastic if necessary',
      'Spray dissolved paint from surface with high pressure (50-300 bar) and hot water (70-90°C)',
      'Work from bottom to top, adjust pressure to substrate',
      'On sensitive surfaces, scrape dissolved paint with spatula or plastic scraper',
      'Rinse substrate thoroughly with clean water after cleaning'
    ],
    safetyGuidelines: 'Avoid inhalation, ensure adequate ventilation and wear respiratory protection with brown filter. Avoid contact with skin and eyes. Wear appropriate solvent-resistant gloves, protective clothing and safety glasses or face shield.'
  },
  {
    substrate: 'Brick',
    contamination: 'Graffiti',
    productName: 'Strip-Off Plus',
    dilution: 'Ready to use (undiluted)',
    applicationSteps: [
      'Apply Strip-Off Plus undiluted with brush or roller in thick layer',
      'Wait 30 minutes to 1 hour depending on temperature and number of coats',
      'Prevent product from drying - cover with plastic if necessary',
      'Spray dissolved paint from surface with high pressure (50-300 bar) and hot water (70-90°C)',
      'Work from bottom to top, adjust pressure to substrate',
      'On sensitive surfaces, scrape dissolved paint with spatula or plastic scraper',
      'Rinse substrate thoroughly with clean water after cleaning'
    ],
    safetyGuidelines: 'Avoid inhalation, ensure adequate ventilation and wear respiratory protection with brown filter. Avoid contact with skin and eyes. Wear appropriate solvent-resistant gloves, protective clothing and safety glasses or face shield.'
  },
  {
    substrate: 'Concrete',
    contamination: 'Graffiti',
    productName: 'Strip-Off HD',
    dilution: 'Ready to use (undiluted)',
    applicationSteps: [
      'Apply Strip-Off HD undiluted with brush or roller in thick layer',
      'Wait 30 minutes to 36 hours depending on temperature and layers of paint',
      'Prevent product from drying - cover with foil for long applications',
      'Spray dissolved paint from surface with high pressure (50-300 bar) and hot water (70-90°C)',
      'Work from bottom to top, adjust pressure to surface',
      'On sensitive surfaces, scrape dissolved paint with putty or plastic scraper',
      'Rinse surface thoroughly with clean water and UNPURIFIED low-foaming agent after cleaning'
    ],
    safetyGuidelines: 'Avoid inhalation, ensure adequate ventilation. Avoid contact with skin and eyes. Wear appropriate gloves, protective clothing and safety glasses. Wear gas mask with ABEK filter if ventilation insufficient. Contains formic acid. Do not use on acid-sensitive substrates.'
  },
  {
    substrate: 'Brick',
    contamination: 'Graffiti',
    productName: 'Strip-Off HD',
    dilution: 'Ready to use (undiluted)',
    applicationSteps: [
      'Apply Strip-Off HD undiluted with brush or roller in thick layer',
      'Wait 30 minutes to 36 hours depending on temperature and layers of paint',
      'Prevent product from drying - cover with foil for long applications',
      'Spray dissolved paint from surface with high pressure (50-300 bar) and hot water (70-90°C)',
      'Work from bottom to top, adjust pressure to surface',
      'On sensitive surfaces, scrape dissolved paint with putty or plastic scraper',
      'Rinse surface thoroughly with clean water and UNPURIFIED low-foaming agent after cleaning'
    ],
    safetyGuidelines: 'Avoid inhalation, ensure adequate ventilation. Avoid contact with skin and eyes. Wear appropriate gloves, protective clothing and safety glasses. Wear gas mask with ABEK filter if ventilation insufficient. Contains formic acid. Do not use on acid-sensitive substrates.'
  }
];

console.log('🚀 COMPLETE PRODUCT RULES IMPORT - ALL BATCHES\n');
console.log('📦 Importing ALL 27 rules from technical data sheets');
console.log('   - Batch 1: 6 rules (Alu Clean, Cement Efflorescence Cleaner)');
console.log('   - Batch 2: 8 rules (Facadeclean HC, Uniclean series)');
console.log('   - Specialized: 13 rules (Wood Renovator, Foam cleaner, Strip-Off series)\n');

try {
  const insert = db.prepare(`
    INSERT INTO rules (substrate, contamination, product_name, dilution, application_steps, safety_guidelines)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const checkDuplicate = db.prepare(`
    SELECT COUNT(*) as count FROM rules 
    WHERE substrate = ? AND contamination = ? AND product_name = ?
  `);

  let imported = 0;
  let skipped = 0;
  const productCounts = {};

  for (const rule of allNewRules) {
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
      
      // Count by product
      productCounts[rule.productName] = (productCounts[rule.productName] || 0) + 1;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`📊 COMPLETE IMPORT SUMMARY:`);
  console.log(`   Total rules processed: ${allNewRules.length}`);
  console.log(`   ✅ Successfully imported: ${imported}`);
  console.log(`   ⏭️  Skipped (duplicates): ${skipped}`);
  console.log('='.repeat(80));

  console.log('\n📦 Rules by Product:');
  Object.entries(productCounts).sort((a, b) => b[1] - a[1]).forEach(([product, count]) => {
    console.log(`   ${product}: ${count} rules`);
  });

  const allRules = db.prepare('SELECT COUNT(*) as count FROM rules WHERE active = 1').get();
  console.log(`\n📋 Total active rules in database: ${allRules.count}`);

  const uniqueSubstrates = db.prepare('SELECT DISTINCT substrate FROM rules WHERE active = 1 ORDER BY substrate').all();
  console.log('\n🏗️  Substrates in database:');
  uniqueSubstrates.forEach(s => console.log(`   - ${s.substrate}`));

  const uniqueContaminations = db.prepare('SELECT DISTINCT contamination FROM rules WHERE active = 1 ORDER BY contamination').all();
  console.log('\n🧹 Contaminations covered:');
  uniqueContaminations.forEach(c => console.log(`   - ${c.contamination}`));
  
  console.log('\n✨ COMPLETE import finished!\n');
  console.log('⚠️  IMPORTANT: Update your app to include these new substrates:');
  console.log('   - Aluminium (if not added yet)');
  console.log('   - Render / mineral plaster');
  console.log('   - Wood (NEW!)');
  console.log('\n💡 Your app now has comprehensive product coverage! 🎉\n');

} catch (error) {
  console.error('❌ Import failed:', error);
  process.exit(1);
} finally {
  db.close();
}
