/**
 * Cloudinary URL Optimization Utilities
 * Automatically serves WebP to modern browsers and optimizes quality
 */

/**
 * Optimize Cloudinary URL for WebP and automatic quality
 * @param {string} url - Original Cloudinary URL
 * @returns {string} - Optimized URL with f_auto,q_auto
 */
export const getOptimizedUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('cloudinary.com')) return url;
  if (url.includes('/f_auto')) return url; // Already optimized
  
  // Check if it's an image URL (not raw/video)
  if (url.includes('/image/upload/')) {
    // Add automatic format and quality optimization for images
    return url.replace(
      '/image/upload/',
      '/image/upload/f_auto,q_auto/'
    );
  } else if (url.includes('/upload/')) {
    // Handle generic upload URLs
    return url.replace(
      '/upload/',
      '/upload/f_auto,q_auto/'
    );
  }
  
  return url;
};

/**
 * Get responsive image URL with custom dimensions
 * @param {string} url - Original Cloudinary URL
 * @param {object} options - Transformation options
 * @param {number} options.width - Target width
 * @param {number} options.height - Target height
 * @param {string} options.crop - Crop mode (limit, fill, scale, fit, etc.)
 * @param {number} options.quality - Quality (1-100) or 'auto'
 * @returns {string} - Transformed URL
 */
export const getResponsiveUrl = (url, options = {}) => {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('cloudinary.com')) return url;
  
  const {
    width,
    height,
    crop = 'limit',
    quality = 'auto'
  } = options;
  
  let transformation = 'f_auto';
  
  // Add quality
  transformation += quality === 'auto' ? ',q_auto' : `,q_${quality}`;
  
  // Add dimensions
  if (width) transformation += `,w_${width}`;
  if (height) transformation += `,h_${height}`;
  if (crop && (width || height)) transformation += `,c_${crop}`;
  
  return url.replace('/upload/', `/upload/${transformation}/`);
};

/**
 * Get thumbnail URL
 * @param {string} url - Original Cloudinary URL
 * @param {number} size - Thumbnail size (default: 150)
 * @returns {string} - Thumbnail URL
 */
export const getThumbnailUrl = (url, size = 150) => {
  return getResponsiveUrl(url, {
    width: size,
    height: size,
    crop: 'fill'
  });
};

/**
 * Optimize multiple URLs in an object
 * @param {object} obj - Object containing Cloudinary URLs
 * @param {array} fields - Field names to optimize (default: ['image', 'avatar', 'screenshotUrl'])
 * @returns {object} - Object with optimized URLs
 */
export const optimizeObjectUrls = (obj, fields = ['image', 'avatar', 'screenshotUrl']) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const optimized = { ...obj };
  
  fields.forEach(field => {
    if (optimized[field]) {
      optimized[field] = getOptimizedUrl(optimized[field]);
    }
  });
  
  return optimized;
};

/**
 * Optimize URLs in an array of objects
 * @param {array} arr - Array of objects containing Cloudinary URLs
 * @param {array} fields - Field names to optimize
 * @returns {array} - Array with optimized URLs
 */
export const optimizeArrayUrls = (arr, fields = ['image', 'avatar', 'screenshotUrl']) => {
  if (!Array.isArray(arr)) return arr;
  
  return arr.map(item => optimizeObjectUrls(item, fields));
};

export default {
  getOptimizedUrl,
  getResponsiveUrl,
  getThumbnailUrl,
  optimizeObjectUrls,
  optimizeArrayUrls
};
