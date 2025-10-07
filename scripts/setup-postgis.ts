import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * Setup PostGIS extension and geo-spatial features for clinics
 * Run this script once when setting up a new environment
 */
async function setupPostGIS() {
  console.log('Setting up PostGIS extension and geo-spatial features...\n');

  try {
    // 1. Enable PostGIS extension
    console.log('1. Enabling PostGIS extension...');
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis CASCADE`);
    console.log('✓ PostGIS extension enabled\n');

    // 2. Add geography column if not exists
    console.log('2. Adding geography column to clinics table...');
    await db.execute(sql`
      ALTER TABLE clinics 
      ADD COLUMN IF NOT EXISTS location geography(Point, 4326)
    `);
    console.log('✓ Location column added\n');

    // 3. Create spatial index
    console.log('3. Creating spatial index...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_clinic_location 
      ON clinics USING GIST(location)
    `);
    console.log('✓ Spatial index created\n');

    // 4. Create trigger function to auto-update location from lat/lng
    console.log('4. Creating trigger function...');
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION update_clinic_location()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
          NEW.location = ST_MakePoint(NEW.longitude::double precision, NEW.latitude::double precision)::geography;
        ELSE
          NEW.location = NULL;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    console.log('✓ Trigger function created\n');

    // 5. Create trigger
    console.log('5. Creating trigger...');
    await db.execute(sql`DROP TRIGGER IF EXISTS trigger_update_clinic_location ON clinics`);
    await db.execute(sql`
      CREATE TRIGGER trigger_update_clinic_location
        BEFORE INSERT OR UPDATE OF latitude, longitude
        ON clinics
        FOR EACH ROW
        EXECUTE FUNCTION update_clinic_location()
    `);
    console.log('✓ Trigger created\n');

    // 6. Populate existing clinics with location data
    console.log('6. Populating existing clinic locations...');
    const result = await db.execute(sql`
      UPDATE clinics 
      SET location = ST_MakePoint(longitude::double precision, latitude::double precision)::geography 
      WHERE latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND location IS NULL
    `);
    console.log(`✓ Updated ${result.rowCount || 0} clinics with location data\n`);

    // 7. Verify PostGIS version
    console.log('7. Verifying PostGIS installation...');
    const version = await db.execute(sql`SELECT PostGIS_version()`);
    console.log(`✓ PostGIS version: ${version.rows[0]?.postgis_version}\n`);

    console.log('✅ PostGIS setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up PostGIS:', error);
    process.exit(1);
  }
}

setupPostGIS();
