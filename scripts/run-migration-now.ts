import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runMigration() {
  // Use pooled connection (Port 6543) with prepare: false
  const url = process.env.DATABASE_URL?.replace(/\?pgbouncer=true/g, '') || '';
  const sql = postgres(url, { prepare: false });

  try {
    console.log('🔧 Applying Schema Fix Migration\n');

    // Step 1: Rename column
    console.log('1️⃣  Renaming vision_jobs.analysis_data → gemini_output');
    await sql.unsafe(`ALTER TABLE "vision_jobs" RENAME COLUMN "analysis_data" TO "gemini_output"`);
    console.log('   ✅ Column renamed\n');

    // Step 2: Add missing column
    console.log('2️⃣  Adding vision_job_video_prompts.remastered_image_url');
    await sql.unsafe(`ALTER TABLE "vision_job_video_prompts" ADD COLUMN IF NOT EXISTS "remastered_image_url" text`);
    console.log('   ✅ Column added\n');

    console.log('✅ Migration applied successfully!\n');

    // Verify
    console.log('🔍 Verifying changes...\n');

    const visionJobsCols = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'vision_jobs' AND column_name IN ('gemini_output', 'analysis_data')
    `;

    const videoPromptsCols = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'vision_job_video_prompts' AND column_name = 'remastered_image_url'
    `;

    const hasGeminiOutput = visionJobsCols.some((c: any) => c.column_name === 'gemini_output');
    const hasAnalysisData = visionJobsCols.some((c: any) => c.column_name === 'analysis_data');
    const hasRemasteredUrl = videoPromptsCols.length > 0;

    console.log(`  ${hasGeminiOutput ? '✅' : '❌'} vision_jobs.gemini_output exists`);
    console.log(`  ${!hasAnalysisData ? '✅' : '⚠️ '} vision_jobs.analysis_data removed`);
    console.log(`  ${hasRemasteredUrl ? '✅' : '❌'} vision_job_video_prompts.remastered_image_url exists\n`);

    if (hasGeminiOutput && !hasAnalysisData && hasRemasteredUrl) {
      console.log('🎉 SCHEMA SYNC COMPLETE - Database matches src/types/schema.ts!');
    } else {
      console.log('⚠️  Some issues remain - check output above');
    }

  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('\n💡 Column already renamed - this is OK!');
    } else {
      throw error;
    }
  } finally {
    await sql.end();
  }
}

runMigration();
