const { Client } = require('pg');

const connectionString = "postgresql://postgres:Ahsan123%21%21_@db.zkhppxjeaizpyinfpecj.supabase.co:5432/postgres";

const client = new Client({
    connectionString,
});

async function wipeDatabase() {
    try {
        await client.connect();
        console.log("🔥 Connected to database. Initiating WIPE protocol...");

        // Drop migration history to force re-apply
        await client.query('DROP SCHEMA IF EXISTS supabase_migrations CASCADE;');
        console.log("📜 Migration history dropped.");

        // Drop the public schema and all its objects (tables, views, triggers, etc.)
        await client.query('DROP SCHEMA public CASCADE;');
        console.log("🗑️  Schema 'public' dropped.");

        // Recreate the public schema
        await client.query('CREATE SCHEMA public;');
        console.log("✨ Schema 'public' recreated.");

        // Grant permissions back to postgres/anon/authenticated roles
        await client.query('GRANT ALL ON SCHEMA public TO postgres;');
        await client.query('GRANT ALL ON SCHEMA public TO public;');
        console.log("🔒 Permissions restored.");

        console.log("✅ DATABASE WIPED SUCCESSFULLY.");
    } catch (err) {
        console.error("❌ Error wiping database:", err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

wipeDatabase();
