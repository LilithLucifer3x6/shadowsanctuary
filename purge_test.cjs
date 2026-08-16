require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
  try {
    await client.connect();

    console.log("--- START PURGE ---");
    // Clear alchemy batches
    const resBatches = await client.query("DELETE FROM alchemy_batches WHERE name ILIKE '%TEST%' RETURNING id, name");
    console.log(`Deleted ${resBatches.rowCount} test alchemy_batches:`, resBatches.rows);

    // Clear test items
    const resItems = await client.query("DELETE FROM items WHERE name ILIKE '%TEST%' OR brand ILIKE '%TEST%' RETURNING id, name");
    console.log(`Deleted ${resItems.rowCount} test items:`, resItems.rows);
    
    // Check test items
    const checkItems = await client.query("SELECT id, name FROM items WHERE name ILIKE '%TEST%'");
    console.log("Remaining TEST items:", checkItems.rows);

    // Clear user_profile test keys
    const testUser = await client.query("SELECT * FROM auth.users WHERE email ILIKE '%test%' LIMIT 1");
    if (testUser.rows.length > 0) {
      const uId = testUser.rows[0].id;
      // We overwrite test-automation profile to clean state
      await client.query("UPDATE user_profile SET intake_answers = '{}'::jsonb WHERE id = $1", [uId]);
      const profile = await client.query("SELECT * FROM user_profile WHERE id = $1", [uId]);
      console.log("Test user profile intake_answers after clear:", profile.rows[0].intake_answers);
    }

    console.log("--- END PURGE ---");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
})();
