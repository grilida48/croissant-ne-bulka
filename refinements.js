(() => {
  const root = document.getElementById('root');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!root || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (!reducedMotion.matches) entry.target.classList.add('detail-reveal');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.15 });

  function attach() {
    const details = root.querySelectorAll('.visit-list > div, .phone-list > a, footer > div');
    if (!details.length) return false;
    details.forEach((element, index) => {
      element.style.setProperty('--reveal-delay', `${(index % 2) * 100}ms`);
      observer.observe(element);
    });
    return true;
  }

  // React mounts asynchronously from the embedded module.
  if (!attach()) {
    const mountObserver = new MutationObserver(() => {
      if (attach()) mountObserver.disconnect();
    });
    mountObserver.observe(root, { childList: true, subtree: true });
  }
})();
