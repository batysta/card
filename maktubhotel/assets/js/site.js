const toggle = document.querySelector('.menu-toggle');
const links = document.querySelector('.nav-links');
const header = document.querySelector('.site-header');

if (toggle && links) {
  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });

  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => links.classList.remove('open'));
  });
}

window.addEventListener('scroll', () => {
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 8);
});

const yearNode = document.querySelector('[data-year]');
if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

const reservationForm = document.querySelector('#reservation-form');
if (reservationForm) {
  reservationForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData(reservationForm);
    const message = [
      'Olá, gostaria de solicitar uma reserva no Maktub Hotel.',
      `Nome: ${form.get('nome') || ''}`,
      `Telefone: ${form.get('telefone') || ''}`,
      `Check-in: ${form.get('checkin') || ''}`,
      `Check-out: ${form.get('checkout') || ''}`,
      `Hóspedes: ${form.get('hospedes') || ''}`,
      `Detalhes: ${form.get('detalhes') || ''}`,
    ].join('\n');

    window.open(`https://wa.me/5598984279164?text=${encodeURIComponent(message)}`, '_blank');
  });
}

const revealTargets = document.querySelectorAll(
  '.section-head, .card, .gallery-item, .banner .inner, .page-hero .container'
);

if ('IntersectionObserver' in window && revealTargets.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealTargets.forEach((el, idx) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${Math.min(idx * 35, 260)}ms`;
    observer.observe(el);
  });
}

const galleryItems = document.querySelectorAll('.gallery-item');
const galleryModal = document.querySelector('#gallery-modal');
const galleryModalImage = document.querySelector('#gallery-modal-image');
const closeModalNodes = document.querySelectorAll('[data-close-modal]');
const galleryPrev = document.querySelector('[data-gallery-prev]');
const galleryNext = document.querySelector('[data-gallery-next]');

if (galleryItems.length && galleryModal && galleryModalImage) {
  const galleryImages = Array.from(galleryItems)
    .map((item) => item.querySelector('img'))
    .filter(Boolean);
  let currentIndex = 0;

  const showImage = (index) => {
    if (!galleryImages.length) return;
    currentIndex = (index + galleryImages.length) % galleryImages.length;
    const image = galleryImages[currentIndex];
    galleryModalImage.src = image.src;
    galleryModalImage.alt = image.alt || 'Imagem ampliada';
  };

  const openModal = (index) => {
    showImage(index);
    galleryModal.classList.add('is-open');
    galleryModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  };

  const closeModal = () => {
    galleryModal.classList.remove('is-open');
    galleryModal.setAttribute('aria-hidden', 'true');
    galleryModalImage.src = '';
    galleryModalImage.alt = '';
    document.body.classList.remove('modal-open');
  };

  galleryItems.forEach((item, index) => {
    const image = item.querySelector('img');
    if (!image) return;

    item.addEventListener('click', () => openModal(index));
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModal(index);
      }
    });
  });

  closeModalNodes.forEach((node) => {
    node.addEventListener('click', closeModal);
  });

  if (galleryPrev) {
    galleryPrev.addEventListener('click', () => showImage(currentIndex - 1));
  }

  if (galleryNext) {
    galleryNext.addEventListener('click', () => showImage(currentIndex + 1));
  }

  document.addEventListener('keydown', (event) => {
    if (!galleryModal.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      closeModal();
    }
    if (event.key === 'ArrowLeft') {
      showImage(currentIndex - 1);
    }
    if (event.key === 'ArrowRight') {
      showImage(currentIndex + 1);
    }
  });
}
