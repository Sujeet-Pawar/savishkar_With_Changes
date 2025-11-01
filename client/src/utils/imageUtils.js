/**
 * Get the full image URL for display
 * Handles both Cloudinary URLs and local storage paths
 * @param {string} imageUrl - The image URL from the database
 * @param {Object} options - Optimization options
 * @param {boolean} options.optimize - Apply Cloudinary optimizations (default: true)
 * @param {number} options.width - Max width for image
 * @param {number} options.height - Max height for image
 * @param {string} options.quality - Image quality (auto, best, good, eco, low)
 * @returns {string} - Full URL for the image
 */
export const getImageUrl = (imageUrl, options = {}) => {
  if (!imageUrl) return null;
  
  const {
    optimize = true,
    width = 1200,
    height = null,
    quality = 'auto'
  } = options;
  
  // If it's already a full URL (Cloudinary or external), return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    // For Cloudinary URLs, ensure they use HTTPS and add optimizations
    if (imageUrl.includes('cloudinary.com')) {
      // Replace http with https for Cloudinary
      let url = imageUrl.replace('http://', 'https://');
      
      // Add transformations for better performance if optimize is true
      if (optimize && url.includes('/upload/')) {
        // Build transformation string
        const transformations = [];
        transformations.push('f_auto'); // Auto format (WebP for supported browsers)
        transformations.push(`q_${quality}`); // Quality
        if (width) transformations.push(`w_${width}`);
        if (height) transformations.push(`h_${height}`);
        transformations.push('c_limit'); // Don't upscale
        
        const transformStr = transformations.join(',');
        
        // Insert transformations before /upload/ if not already present
        if (!url.includes(transformStr)) {
          url = url.replace('/upload/', `/upload/${transformStr}/`);
        }
      }
      
      return url;
    }
    return imageUrl;
  }
  
  // For local storage paths, prepend the API base URL
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  // Remove '/api' from the end to get the server URL
  const serverUrl = apiUrl.replace(/\/api$/, '');
  
  // Ensure the path starts with /
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  
  return `${serverUrl}${path}`;
};

/**
 * Get optimized thumbnail URL
 * @param {string} imageUrl - The image URL from the database
 * @returns {string} - Optimized thumbnail URL
 */
export const getThumbnailUrl = (imageUrl) => {
  return getImageUrl(imageUrl, {
    optimize: true,
    width: 400,
    height: 300,
    quality: 'auto'
  });
};

/**
 * Preload image to improve perceived performance
 * @param {string} imageUrl - The image URL to preload
 * @returns {Promise} - Resolves when image is loaded
 */
export const preloadImage = (imageUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageUrl;
  });
};
