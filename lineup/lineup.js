(() => {
  document.querySelectorAll('.lu-evidence').forEach(section => {
    const track = section.querySelector('.lu-article-track');
    const prev = section.querySelector('.lu-slide-prev');
    const next = section.querySelector('.lu-slide-next');
    const status = section.querySelector('.lu-slide-status');
    if (!track || !prev || !next || !status) return;
    const cards = [...track.querySelectorAll('.lu-article-card')];
    const refresh = () => {
      const end = Math.max(0, track.scrollWidth - track.clientWidth);
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= end - 2;
      const bounds = track.getBoundingClientRect();
      const visible = cards.map((card, index) => ({ index: index + 1, bounds: card.getBoundingClientRect() }))
        .filter(card => card.bounds.left < bounds.right - 8 && card.bounds.right > bounds.left + 8);
      status.textContent = visible.length ? `${visible[0].index}–${visible[visible.length - 1].index} / ${cards.length}記事` : `${cards.length}記事`;
    };
    const move = direction => {
      const step = (cards[0]?.getBoundingClientRect().width || track.clientWidth) + parseFloat(getComputedStyle(track).gap || 0);
      track.scrollBy({ left: direction * step, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    };
    prev.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('scroll', refresh, { passive: true });
    track.addEventListener('keydown', event => {
      if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    });
    window.addEventListener('resize', refresh);
    refresh();
  });
})();
