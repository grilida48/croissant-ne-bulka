const root = document.querySelector('#croissant-3d-root');

if (root) {
  const loadViewer = () => import('./croissant-island.js?v=1').catch(() => {
    const fallback = root.querySelector('.croissant-loading');
    if (fallback) fallback.textContent = 'Интерактивная модель сейчас недоступна. Фото круассанов можно посмотреть рядом.';
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      loadViewer();
    }, { rootMargin: '320px 0px' });

    observer.observe(root);
  } else {
    loadViewer();
  }
}
