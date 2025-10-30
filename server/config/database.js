import mongoose from 'mongoose';

const connectDB = async () => {
  // Skip if already connected (important for serverless)
  if (mongoose.connection.readyState === 1) {
    console.log('✅ MongoDB already connected');
    return;
  }

  console.log('\n🗄️  Connecting to MongoDB...');
  console.log('─'.repeat(50));
  
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });

    console.log('✅ MongoDB Connected Successfully!');
    console.log(`🌐 Host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔌 Port: ${conn.connection.port}`);
    console.log(`📡 Ready State: ${conn.connection.readyState === 1 ? 'Connected' : 'Unknown'}`);
    console.log('─'.repeat(50));
  } catch (error) {
    console.log('❌ MongoDB Connection FAILED!');
    console.log(`📛 Error: ${error.message}`);
    console.log('\n💡 TROUBLESHOOTING:');
    console.log('   1. Check MONGODB_URI is correct');
    console.log('   2. Verify MongoDB Atlas IP whitelist (0.0.0.0/0 for all)');
    console.log('   3. Check database user credentials');
    console.log('   4. Ensure network access is configured');
    console.log('─'.repeat(50));
    
    // Don't exit in serverless environment
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    } else {
      throw error; // Let the serverless function handle the error
    }
  }
};

export default connectDB;
