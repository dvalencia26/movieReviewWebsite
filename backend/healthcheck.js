import mongoose from 'mongoose';

const healthCheck = async () => {
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }

    // Simple database query test
    await mongoose.connection.db.admin().ping();

    console.log('Health check passed');
    process.exit(0);
  } catch (error) {
    console.error('Health check failed:', error.message);
    process.exit(1);
  }
};

// Run health check
healthCheck();