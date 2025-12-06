import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function verifySchema() {
  const cleanUrl = process.env.DATABASE_URL?.replace(/\?pgbouncer=true/g, '') || '';
  const sql = postgres(cleanUrl, { prepare: false });

  try {
    console.log('🔍 Verifying Vision Jobs Table Schema...\n');

    // Check vision_jobs table columns
    const visionJobsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'vision_jobs'
      ORDER BY ordinal_position;
    `;

    console.log('Vision Jobs Table Columns:');
    visionJobsColumns.forEach((col: any) => {
      const check = col.column_name === 'gemini_output' ? '✅' :
                   col.column_name === 'style_reference_url' ? '✅' :
                   col.column_name === 'brand_essence_prompt' ? '✅' : '  ';
      console.log(`  ${check} ${col.column_name} (${col.data_type})`);
    });

    console.log('\n🔍 Verifying Video Prompts Table Schema...\n');

    // Check vision_job_video_prompts table columns
    const videoPromptsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'vision_job_video_prompts'
      ORDER BY ordinal_position;
    `;

    console.log('Video Prompts Table Columns:');
    videoPromptsColumns.forEach((col: any) => {
      const check = col.column_name === 'remastered_image_url' ? '✅' :
                   col.column_name === 'scenes_data' ? '✅' :
                   col.column_name === 'conversation_history' ? '✅' : '  ';
      console.log(`  ${check} ${col.column_name} (${col.data_type})`);
    });

    // Verify critical fields
    const hasGeminiOutput = visionJobsColumns.some((c: any) => c.column_name === 'gemini_output');
    const hasStyleRef = visionJobsColumns.some((c: any) => c.column_name === 'style_reference_url');
    const hasRemasteredUrl = videoPromptsColumns.some((c: any) => c.column_name === 'remastered_image_url');

    console.log('\n📊 Critical Fields Check:');
    console.log(`  ${hasGeminiOutput ? '✅' : '❌'} vision_jobs.gemini_output`);
    console.log(`  ${hasStyleRef ? '✅' : '❌'} vision_jobs.style_reference_url`);
    console.log(`  ${hasRemasteredUrl ? '✅' : '❌'} vision_job_video_prompts.remastered_image_url`);

    if (hasGeminiOutput && hasStyleRef && hasRemasteredUrl) {
      console.log('\n✅ SCHEMA SYNC VERIFIED - All critical fields present!');
    } else {
      console.log('\n❌ SCHEMA SYNC FAILED - Missing critical fields!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

verifySchema();
