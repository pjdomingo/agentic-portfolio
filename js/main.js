document.addEventListener('DOMContentLoaded', () => {
  const revealElements = document.querySelectorAll('.reveal-up');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // Dynamic workflow hover logic
  const workflowCards = document.querySelectorAll('.workflow-card');
  workflowCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      workflowCards.forEach(c => {
         if(c !== card) c.style.opacity = '0.5';
      });
    });
    card.addEventListener('mouseleave', () => {
      workflowCards.forEach(c => c.style.opacity = '1');
    });
  });
});
