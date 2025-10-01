#!/usr/bin/env node

/**
 * Media Files Cleanup Script
 * 
 * This script can be run manually or scheduled as a cron job
 * to automatically clean up old media files after transcription completion.
 * 
 * Usage:
 * node scripts/cleanup-media-files.js
 * 
 * Environment Variables Required:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function cleanupMediaFiles() {
  console.log('🧹 Starting media files cleanup...');
  
  // Initialize Supabase client with service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Find files that are ready for cleanup (30 days after transcript completion)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    console.log(`📅 Looking for files completed before: ${thirtyDaysAgo.toISOString()}`);
    
    const { data: filesToCleanup, error: fetchError } = await supabase
      .from('media_files')
      .select('id, supabase_file_path, original_filename, custom_filename')
      .eq('transcription_status', 'completed')
      .not('transcript_completed_at', 'is', null)
      .lte('transcript_completed_at', thirtyDaysAgo.toISOString())
      .eq('media_file_deleted', false);
    
    if (fetchError) {
      throw new Error(`Failed to fetch files for cleanup: ${fetchError.message}`);
    }
    
    if (!filesToCleanup || filesToCleanup.length === 0) {
      console.log('✅ No files ready for cleanup');
      return;
    }
    
    console.log(`📁 Found ${filesToCleanup.length} files ready for cleanup`);
    
    let cleanedUpCount = 0;
    let errors = [];
    
    // Process each file for cleanup
    for (const file of filesToCleanup) {
      try {
        const displayName = file.custom_filename || file.original_filename;
        console.log(`🗑️  Cleaning up: ${displayName}`);
        
        // Delete the file from Supabase Storage
        const { error: storageError } = await supabase.storage
          .from('media-files')
          .remove([file.supabase_file_path]);
        
        if (storageError) {
          throw new Error(`Storage deletion failed: ${storageError.message}`);
        }
        
        // Update the database record to mark the file as deleted
        const { error: updateError } = await supabase
          .from('media_files')
          .update({ 
            media_file_deleted: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', file.id);
        
        if (updateError) {
          throw new Error(`Database update failed: ${updateError.message}`);
        }
        
        cleanedUpCount++;
        console.log(`✅ Successfully cleaned up: ${displayName}`);
        
      } catch (error) {
        console.error(`❌ Error cleaning up ${file.original_filename}:`, error.message);
        errors.push(`${file.original_filename}: ${error.message}`);
      }
    }
    
    // Summary
    console.log('\n📊 Cleanup Summary:');
    console.log(`✅ Successfully cleaned up: ${cleanedUpCount} files`);
    console.log(`❌ Errors: ${errors.length} files`);
    console.log(`📁 Total processed: ${filesToCleanup.length} files`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n🎉 Cleanup completed!');
    
  } catch (error) {
    console.error('💥 Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
cleanupMediaFiles()
  .then(() => {
    console.log('✨ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
