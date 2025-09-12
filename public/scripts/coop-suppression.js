// Simple COOP error suppression
(function() {
  const originalError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('Cross-Origin-Opener-Policy') || 
        message.includes('postMessage call') ||
        message.includes('window.closed call') ||
        message.includes('Google Sign In does not support web view')) {
      return; // Suppress COOP and GSI warnings
    }
    originalError.apply(console, args);
  };

  const originalWarn = console.warn;
  console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('Cross-Origin-Opener-Policy') || 
        message.includes('postMessage call') ||
        message.includes('window.closed call') ||
        message.includes('Google Sign In does not support web view')) {
      return; // Suppress COOP and GSI warnings
    }
    originalWarn.apply(console, args);
  };

  console.log('🔧 COOP and GSI error suppression initialized');
})();
