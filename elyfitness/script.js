const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');
const navLinks = document.querySelectorAll('.nav a');
const revealEls = document.querySelectorAll('.reveal');
const yearEl = document.getElementById('year');
const galleryImages = document.querySelectorAll('.gallery-item img');
const galleryModal = document.getElementById('galleryModal');
const galleryModalImage = document.querySelector('.gallery-modal-image');
const galleryModalClose = document.querySelector('.gallery-modal-close');
const galleryModalPrev = document.querySelector('.gallery-modal-nav.prev');
const galleryModalNext = document.querySelector('.gallery-modal-nav.next');
const heroSlides = document.querySelectorAll('.hero-slide');
const heroDots = document.querySelector('.hero-dots');
const prevSlideButton = document.querySelector('.hero-control.prev');
const nextSlideButton = document.querySelector('.hero-control.next');

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );
  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('show'));
}

galleryImages.forEach((img, index) => {
  img.addEventListener('error', () => {
    const wrapper = img.closest('.gallery-item');
    if (!wrapper) return;
    wrapper.classList.add('gallery-missing');
    wrapper.innerHTML = `<p>Adicione a foto estrutura-${index + 1}.jpg em assets/fotos</p>`;
  });
});

if (galleryModal && galleryModalImage && galleryImages.length) {
  let activeGalleryIndex = 0;

  const showGalleryImage = (index) => {
    activeGalleryIndex = (index + galleryImages.length) % galleryImages.length;
    const target = galleryImages[activeGalleryIndex];
    galleryModalImage.src = target.src;
    galleryModalImage.alt = target.alt || 'Imagem da galeria EliFitness';
  };

  const openGalleryModal = (index) => {
    showGalleryImage(index);
    galleryModal.hidden = false;
    document.body.classList.add('modal-open');
  };

  const closeGalleryModal = () => {
    galleryModal.hidden = true;
    document.body.classList.remove('modal-open');
    galleryModalImage.src = '';
  };

  galleryImages.forEach((img, index) => {
    img.addEventListener('click', () => openGalleryModal(index));
  });

  galleryModalClose?.addEventListener('click', closeGalleryModal);
  galleryModalPrev?.addEventListener('click', () => showGalleryImage(activeGalleryIndex - 1));
  galleryModalNext?.addEventListener('click', () => showGalleryImage(activeGalleryIndex + 1));

  galleryModal.addEventListener('click', (event) => {
    if (event.target === galleryModal) closeGalleryModal();
  });

  document.addEventListener('keydown', (event) => {
    if (galleryModal.hidden) return;
    if (event.key === 'Escape') closeGalleryModal();
    if (event.key === 'ArrowLeft') showGalleryImage(activeGalleryIndex - 1);
    if (event.key === 'ArrowRight') showGalleryImage(activeGalleryIndex + 1);
  });
}

if (heroSlides.length && heroDots) {
  let currentSlide = 0;
  let autoplayId = null;

  const dots = Array.from(heroSlides).map((_, index) => {
    const dot = document.createElement('button');
    dot.className = 'hero-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `Ir para slide ${index + 1}`);
    dot.addEventListener('click', () => setSlide(index));
    heroDots.appendChild(dot);
    return dot;
  });

  const setSlide = (index) => {
    currentSlide = (index + heroSlides.length) % heroSlides.length;
    heroSlides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === currentSlide);
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('active', dotIndex === currentSlide);
    });
  };

  const startAutoplay = () => {
    if (autoplayId) clearInterval(autoplayId);
    autoplayId = setInterval(() => setSlide(currentSlide + 1), 5000);
  };

  const stopAutoplay = () => {
    if (!autoplayId) return;
    clearInterval(autoplayId);
    autoplayId = null;
  };

  prevSlideButton?.addEventListener('click', () => {
    setSlide(currentSlide - 1);
    startAutoplay();
  });

  nextSlideButton?.addEventListener('click', () => {
    setSlide(currentSlide + 1);
    startAutoplay();
  });

  heroSlides.forEach((slide) => {
    const img = slide.querySelector('img');
    if (!img) return;
    img.addEventListener('error', () => {
      slide.classList.add('hero-slide-missing');
      slide.innerHTML = '<p>Adicione esta foto em assets/fotos para exibir no slideshow inicial.</p>';
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });

  setSlide(0);
  startAutoplay();
}
