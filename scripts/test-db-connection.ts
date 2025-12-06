import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testConnection() {
  console.log('🔌 Testing connection to:', process.env.DATABASE_URL?.split('@')[1]); // Hide password

  // Clean the URL (remove unsupported parameters)
  const cleanUrl = process.env.DATABASE_URL?.replace(/\?pgbouncer=true/g, '') || '';
  console.log('📝 Cleaned URL:', cleanUrl.replace(/:[^:@]+@/, ':****@')); // Hide password

  // Test 1: Direct Connection (Session Mode)
  // Force port 5432 for the test to rule out PGBouncer issues
  const directUrl = cleanUrl.replace('6543', '5432');

  console.log('\n🔐 Test 1: Direct Connection (Port 5432)');
  try {
    const sql = postgres(directUrl, { connect_timeout: 5, ssl: 'require' });
    const result = await sql`SELECT version()`;
    console.log('✅ DIRECT Connection (5432) Success:', result[0].version.substring(0, 50) + '...');
    await sql.end();
  } catch (e: any) {
    console.error('❌ DIRECT Connection Failed:', e.message);
  }

  // Test 2: Transaction Mode (Pooler) - Best practice config
  console.log('\n🔐 Test 2: Pooled Connection (Port 6543) - Production Config');
  try {
    const sql = postgres(cleanUrl, {
      prepare: false,
      connect_timeout: 10,
      ssl: 'prefer', // Prefer SSL but fall back if needed
      connection: {
        application_name: 'longevity-valley'
      }
    });
    const result = await sql`SELECT version()`;
    console.log('✅ POOLED Connection Success!');
    console.log('   PostgreSQL Version:', result[0].version.substring(0, 60) + '...');
    await sql.end();
  } catch (e: any) {
    console.error('❌ POOLED Connection Failed:', e.message);
    console.error('   Full error:', e);
  }
}

testConnection();
