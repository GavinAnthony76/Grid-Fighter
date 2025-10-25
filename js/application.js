// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use relative path for GitHub Pages compatibility
    const swPath = window.location.pathname.endsWith('/')
      ? window.location.pathname + 'sw.js'
      : window.location.pathname.replace(/\/[^/]*$/, '/sw.js');

    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('ServiceWorker registered:', registration.scope);
      })
      .catch((error) => {
        console.log('ServiceWorker registration failed:', error);
      });
  });
}

// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(() => {
  new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager);
});
