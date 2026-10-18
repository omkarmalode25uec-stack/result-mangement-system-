import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 * Designed to handle both local and cloud MongoDB URIs.
 * If MongoDB is not yet running locally, it logs an informative message
 * without crashing the development server.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sanjivani_rms';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000, // Quick timeout for local dev if MongoDB daemon isn't running
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${uri}.`);
    console.warn(`[MongoDB Note] Backend server is still running in mock/offline mode for UI preview.`);
    console.warn(`[MongoDB Tip] To connect to MongoDB, ensure MongoDB service is started (mongod) or update MONGODB_URI in backend/.env`);
  }
};
