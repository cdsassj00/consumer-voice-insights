/**
 * Generate a consistent cache key from search result IDs
 */
export const generateCacheKey = (resultIds: string[]): string => {
  // Sort IDs to ensure consistent key generation regardless of order
  const sortedIds = [...resultIds].sort();
  
  // Create a simple hash from the sorted IDs
  const idsString = sortedIds.join(',');
  
  // Simple hash function (you could use crypto.subtle.digest for better hashing)
  let hash = 0;
  for (let i = 0; i < idsString.length; i++) {
    const char = idsString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `cache_${Math.abs(hash).toString(36)}`;
};
