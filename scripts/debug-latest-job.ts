import { config } from 'dotenv';
import postgres from 'postgres';

// Load .env.local
config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!);

async function debugLatestJob() {
  console.log('🔍 Database Forensic Audit - Latest Vision Job\n');
  console.log('='.repeat(60));

  try {
    const [job] = await sql`
      SELECT id, status, created_at, gemini_output, error_message
      FROM vision_jobs
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!job) {
      console.log('❌ NO JOBS FOUND in database');
      return;
    }

    console.log('\n📊 Job Details:');
    console.log(`   ID:         ${job.id}`);
    console.log(`   Status:     ${job.status}`);
    console.log(`   Created:    ${job.created_at}`);
    console.log(`   Error:      ${job.error_message || 'none'}`);
    console.log(`   Has Output: ${job.gemini_output ? 'YES' : 'NO'}`);

    if (job.gemini_output) {
      console.log('\n📦 Gemini Output Preview:');
      const output = typeof job.gemini_output === 'string'
        ? JSON.parse(job.gemini_output)
        : job.gemini_output;
      console.log(JSON.stringify(output, null, 2).substring(0, 500) + '...');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔎 DIAGNOSIS:\n');

    // Diagnosis
    if (job.status === 'processing') {
      console.log('⚠️  STUCK_IN_PROCESSING');
      console.log('   Cause: Gemini API timed out or crashed during analysis.');
      console.log('   Action: Check Gemini API key and network connectivity.');
    } else if (job.status === 'pending') {
      console.log('⚠️  STUCK_IN_PENDING');
      console.log('   Cause: Background job never started or queueVisionAnalysis failed.');
      console.log('   Action: Check server logs for queueVisionAnalysis errors.');
    } else if (job.status === 'completed' && !job.gemini_output) {
      console.log('❌ DATA_LOSS');
      console.log('   Cause: Status set to completed but gemini_output was not saved.');
      console.log('   Action: Check processVisionAnalysis - update might be overwriting data.');
    } else if (job.status === 'completed' && job.gemini_output) {
      console.log('✅ FRONTEND_DISCONNECT');
      console.log('   Cause: Database is fine - UI is not reading the data correctly.');
      console.log('   Action: Check getJob query and transformVisionJobToAnalysisData.');
    } else if (job.status === 'failed') {
      console.log('❌ JOB_FAILED');
      console.log(`   Cause: ${job.error_message || 'Unknown error'}`);
      console.log('   Action: Check the error message above for root cause.');
    } else {
      console.log(`ℹ️  UNKNOWN STATUS: ${job.status}`);
    }

    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('❌ Database query failed:', error);
  } finally {
    await sql.end();
  }
}

debugLatestJob();
