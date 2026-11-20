const address = document.querySelector('#visit dd').textContent.trim();
const copyAddress = document.querySelector('#copy-address');
const addressStatus = document.querySelector('#address-status');
const shareButton = document.querySelector('#share');
const shareUrl = document.querySelector('#share-url');
const shareStatus = document.querySelector('#share-status');

if (navigator.clipboard?.writeText) {
  copyAddress.hidden = false;
  copyAddress.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(address);
      addressStatus.textContent = 'Адрес скопирован.';
    } catch {
      addressStatus.textContent = 'Адрес можно выделить и скопировать вручную.';
    }
  });
}

document.querySelector('#share-actions').hidden = false;
shareButton.addEventListener('click', async () => {
  const canonicalUrl = new URL(location.href);
  canonicalUrl.hash = '';
  canonicalUrl.search = '';
  const url = canonicalUrl.href;
  shareStatus.textContent = '';

  if (navigator.share) {
    try {
      await navigator.share({ title: 'Круассан не булка', url });
      return;
    } catch (error) {
      if (error.name === 'AbortError') return;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    shareStatus.textContent = 'Ссылка скопирована.';
  } catch {
    shareUrl.value = url;
    shareUrl.hidden = false;
    shareUrl.focus();
    shareUrl.select();
    shareStatus.textContent = 'Ссылка выделена. Скопируйте её из поля.';
  }
});

if ('IntersectionObserver' in window && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.setAttribute('data-visible', '');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.15 });

  document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
}
