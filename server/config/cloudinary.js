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
    // Extract filename without extension
    const originalName = file.originalname.replace(/\.[^/.]+$/, '');
    // Sanitize filename: remove special chars, replace spaces with hyphens
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    
    return {
      folder: 'savishkar/payments',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      // Don't force format conversion - let Cloudinary serve optimal format via f_auto
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto:good' }
      ],
      // Use original filename with timestamp to avoid conflicts
      public_id: `${sanitizedName}-${Date.now()}`
    };
  }
});

// Storage for event images
export const eventStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Extract filename without extension
    const originalName = file.originalname.replace(/\.[^/.]+$/, '');
    // Sanitize filename: remove special chars, replace spaces with hyphens
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    
    return {
      folder: 'savishkar/events',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      // Don't force format conversion - let Cloudinary serve optimal format via f_auto
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto:best' }
      ],
      // Use original filename with timestamp to avoid conflicts
      public_id: `${sanitizedName}-${Date.now()}`
    };
  }
});

// Storage for user avatars
export const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Extract filename without extension
    const originalName = file.originalname.replace(/\.[^/.]+$/, '');
    // Sanitize filename: remove special chars, replace spaces with hyphens
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    
    return {
      folder: 'savishkar/avatars',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      // Don't force format conversion - let Cloudinary serve optimal format via f_auto
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' }
      ],
      // Use original filename with timestamp to avoid conflicts
      public_id: `${sanitizedName}-${Date.now()}`
    };
  }
});

// Storage for QR codes (separate folder for event QR codes)
export const qrCodeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Extract filename without extension
    const originalName = file.originalname.replace(/\.[^/.]+$/, '');
    // Sanitize filename: remove special chars, replace spaces with hyphens
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    
    return {
      folder: 'savishkar/qrcodes',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      // Don't force format conversion - let Cloudinary serve optimal format via f_auto
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto:best' }
      ],
      // Use original filename with timestamp to avoid conflicts
      public_id: `${sanitizedName}-${Date.now()}`
    };
  }
});

export default cloudinary;
