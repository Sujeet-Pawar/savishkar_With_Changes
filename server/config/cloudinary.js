import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for payment screenshots
export const paymentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'savishkar/payments',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      // Don't force format conversion - let Cloudinary serve optimal format via f_auto
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto:good' }
      ],
      public_id: `payment-${Date.now()}-${Math.round(Math.random() * 1E9)}`
    };
  }
});

// Storage for event images
export const eventStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'savishkar/events',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      // Don't force format conversion - let Cloudinary serve optimal format via f_auto
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto:best' }
      ],
      public_id: `event-${Date.now()}-${Math.round(Math.random() * 1E9)}`
    };
  }
});

// Storage for user avatars
export const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'savishkar/avatars',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      // Don't force format conversion - let Cloudinary serve optimal format via f_auto
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' }
      ],
      public_id: `avatar-${Date.now()}-${Math.round(Math.random() * 1E9)}`
    };
  }
});

export default cloudinary;
