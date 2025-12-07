import postgres from 'postgres';

const sql = postgres('postgresql://postgres.wlwzfjlvwaosonorsvyf:ProjectLV2025Secure@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres');

async function run() {
  try {
    // Check current enum values
    const result = await sql`SELECT unnest(enum_range(NULL::vision_job_status)) as status`;
    console.log('Current enum values:', result.map(r => r.status));

    // Add processing if not exists
    await sql.unsafe("ALTER TYPE vision_job_status ADD VALUE IF NOT EXISTS 'processing'");
    console.log('✅ Enum updated successfully - added processing');

    // Verify
    const updated = await sql`SELECT unnest(enum_range(NULL::vision_job_status)) as status`;
    console.log('Updated enum values:', updated.map(r => r.status));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await sql.end();
  }
}

run();
