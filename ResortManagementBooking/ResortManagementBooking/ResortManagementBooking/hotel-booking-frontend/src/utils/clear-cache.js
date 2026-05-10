// Clear all user-related cache and localStorage
export const clearUserCache = () => {
  console.log('🧹 Clearing user cache...');
  
  // Clear localStorage
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_name');
  localStorage.removeItem('user_image');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_token');
  localStorage.removeItem('user_id');
  
  // Clear session storage
  sessionStorage.clear();
  
  console.log('✅ User cache cleared');
  
  // Force page reload
  setTimeout(() => {
    window.location.reload();
  }, 100);
};

// Run this function in browser console to clear cache
console.log('🔧 To clear user cache, run: clearUserCache()');
