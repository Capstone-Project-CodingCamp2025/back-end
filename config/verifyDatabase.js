// scripts/verifyDatabase.js - Run this to check your database
const pool = require('../config/db'); // Adjust path to your db config

async function verifyDatabase() {
  try {
    console.log('=== DATABASE VERIFICATION ===');
    
    // 1. Check connection
    console.log('1. Testing database connection...');
    await pool.query('SELECT 1 as test');
    console.log('✅ Database connection OK');
    
    // 2. Check places table
    console.log('\n2. Checking places table...');
    const [placesCount] = await pool.query('SELECT COUNT(*) as count FROM places');
    console.log(`📊 Places table has ${placesCount[0].count} records`);
    
    if (placesCount[0].count > 0) {
      const [samplePlaces] = await pool.query('SELECT id, nama_tempat, rating_avg, kategori FROM places LIMIT 5');
      console.log('Sample places:', JSON.stringify(samplePlaces, null, 2));
    }
    
    // 3. Check user_ratings table structure
    console.log('\n3. Checking user_ratings table...');
    try {
      const [ratingsCount] = await pool.query('SELECT COUNT(*) as count FROM user_ratings');
      console.log(`📊 User_ratings table has ${ratingsCount[0].count} records`);
      
      if (ratingsCount[0].count > 0) {
        const [sampleRatings] = await pool.query('SELECT user_id, place_id, rating FROM user_ratings LIMIT 5');
        console.log('Sample ratings:', JSON.stringify(sampleRatings, null, 2));
      }
    } catch (error) {
      console.log('❌ user_ratings table issue:', error.message);
      
      // Try to create the table
      console.log('Attempting to create user_ratings table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_ratings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          place_id INT NOT NULL,
          rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
          visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_place (user_id, place_id),
          FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ user_ratings table created');
    }
    
    // 4. Test a specific user's ratings (replace with your test user ID)
    const testUserId = 1; // Change this to your test user ID
    console.log(`\n4. Checking ratings for user ${testUserId}...`);
    const [userRatings] = await pool.query(
      'SELECT place_id, rating FROM user_ratings WHERE user_id = ?', 
      [testUserId]
    );
    console.log(`User ${testUserId} has ${userRatings.length} ratings`);
    if (userRatings.length > 0) {
      console.log('User ratings:', JSON.stringify(userRatings, null, 2));
    }
    
    console.log('\n✅ Database verification completed');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run verification
verifyDatabase();

// Export for use in other scripts
module.exports = { verifyDatabase };