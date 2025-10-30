// Simple health check endpoint for Vercel debugging
export default function handler(req, res) {
  try {
    res.status(200).json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      env: {
        nodeVersion: process.version,
        platform: process.platform,
        vercel: process.env.VERCEL === '1',
        hasMongoUri: !!process.env.MONGODB_URI,
        hasCloudinary: !!process.env.CLOUDINARY_CLOUD_NAME
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
