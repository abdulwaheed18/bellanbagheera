// GSAP Animations
document.addEventListener('DOMContentLoaded', () => {
  // Hero Section Animation
  const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
  heroTimeline
    .from('.hero__title', { opacity: 0, y: 30, duration: 0.8, delay: 0.2 })
    .from('.hero__subtitle', { opacity: 0, y: 20, duration: 0.6 }, '-=0.4');

  // Product Card Animation
  const animateCards = () => {
    gsap.from('.product-card', {
      opacity: 0,
      y: 30,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.product-grid',
        start: 'top 80%',
      },
    });
  };

  // Product Card Hover Animation
  const handleCardHover = () => {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
      const actions = card.querySelector('.product-card__actions');
      const timeline = gsap.timeline({ paused: true });

      timeline.to(actions, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: 'power2.out',
      });

      card.addEventListener('mouseenter', () => timeline.play());
      card.addEventListener('mouseleave', () => timeline.reverse());
    });
  };

  // Use a MutationObserver to re-apply animations when the product grid changes
  const gridObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        animateCards();
        handleCardHover(); // Re-apply hover listeners
        break;
      }
    }
  });

  const productGrid = document.getElementById('product-grid');
  if (productGrid) {
    gridObserver.observe(productGrid, { childList: true });
    animateCards(); // Initial animation
    handleCardHover(); // Initial hover listeners
  }
});
