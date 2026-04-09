/* ── Translations ── */
var translations = {
    'pt': {
        'role': 'Professor de Matemática | Web Design',
        'bio': 'Atuando na educação pública desde 2005, dei início à minha trajetória profissional aos 19 anos. Minha formação acadêmica abrange graduações em <strong>Matemática e Ciências Contábeis</strong>, complementadas por uma <strong>Pós-Graduação em Docência e Práticas Pedagógicas</strong>. Para além do contexto acadêmico, possuo base técnica em <strong>Tecnologia da Informação, com expertise em montagem, manutenção e redes de computadores</strong>. Ademais, exploro o campo tecnológico por meio do <strong>Web Design</strong> e, mais recentemente, tenho me aventurado no campo do <strong>Desenvolvimento Mobile</strong>, refletindo um compromisso permanente com a aprendizagem contínua.',
        'skills-title': 'Habilidades & Interesses',
        'skill-math': '📐 Matemática',
        'skill-web': '💻 Web Design',
        'skill-mobile': '📱 Desenvolvimento Mobile',
        'skill-teach': '🎓 Docência',
        'skill-tech': '🔧 Hardware & Redes',
        'skill-acc': '⚡ Tecnologia',
        'skill-eng': '🇬🇧 Inglês',
        'btn-projects': '<span class="icon">🌐</span> Meus Projetos Web',
        'page-title': 'Portfólio e Projetos',
        'page-subtitle': 'Uma seleção dos meus últimos trabalhos em Web Design e desenvolvimento web.',
        'btn-back': '⬅ Voltar para o Início',
        'error-msg': 'A página que você procura não existe ou foi movida.',
        'error-link': 'Voltar para o Início',
        'demo-label': 'Visualizar',
        'visit-label': 'Visitar site',
        'modal-aria': 'Visualização ampliada do projeto',
        'close-modal-aria': 'Fechar imagem',
        'modal-alt': 'Imagem ampliada do projeto',
        'lang-btn-pt-aria': 'Mudar idioma para Português',
        'lang-btn-en-aria': 'Mudar idioma para Inglês',
        'lang-btn-pt-title': 'Português',
        'lang-btn-en-title': 'Inglês'
    },
    'en': {
        'role': 'Mathematics Teacher | Web Design',
        'bio': 'With a tenure in public education beginning in 2005, I launched my professional trajectory at the age of 19. My credentials include undergraduate degrees in <strong>Mathematics and Accounting</strong>, alongside a <strong>Postgraduate Specialization in Teaching and Pedagogical Practices</strong>. Extending my scope beyond the academic setting, I possess a technical background in <strong>Information Technology, with expertise in computer assembly, maintenance, and networking</strong>. Furthermore, I delve into technology via <strong>Web Design</strong> and, more recently, I have been venturing into the field of <strong>Mobile Development</strong>, reflecting an enduring dedication to lifelong learning.',
        'skills-title': 'Skills & Interests',
        'skill-math': '📐 Mathematics',
        'skill-web': '💻 Web Design',
        'skill-mobile': '📱 Mobile Development',
        'skill-teach': '🎓 Teaching',
        'skill-tech': '🔧 Hardware & Networking',
        'skill-acc': '⚡ Technology',
        'skill-eng': '🇬🇧 English / 🇧🇷 Portuguese',
        'btn-projects': '<span class="icon">🌐</span> My Web Projects',
        'page-title': 'Portfolio and Projects',
        'page-subtitle': 'A selection of my latest work in Web Design and web development.',
        'btn-back': '⬅ Back to Home',
        'error-msg': 'The page you are looking for does not exist or has been moved.',
        'error-link': 'Back to Home',
        'demo-label': 'View',
        'visit-label': 'Visit Site',
        'modal-aria': 'Enlarged project preview',
        'close-modal-aria': 'Close image',
        'modal-alt': 'Enlarged project image',
        'lang-btn-pt-aria': 'Switch language to Portuguese',
        'lang-btn-en-aria': 'Switch language to English',
        'lang-btn-pt-title': 'Portuguese',
        'lang-btn-en-title': 'English'
    }
};

/* ── Projects data (loaded from projects.json, cached after first fetch) ── */
var projectsData = null;

function fetchProjects(lang) {
    var grid = document.getElementById('projects-grid');
    if (!grid) return; /* Not on portfolio page */

    /* If already cached, render immediately */
    if (projectsData) {
        renderProjects(lang);
        return;
    }

    /* Show loading state */
    grid.innerHTML = '';
    var loader = document.createElement('div');
    loader.className = 'projects-loading';
    loader.setAttribute('role', 'status');
    loader.textContent = lang === 'pt' ? 'Carregando projetos…' : 'Loading projects…';
    grid.appendChild(loader);

    fetch('projects.json')
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(function (data) {
            projectsData = data;
            renderProjects(lang);
        })
        .catch(function () {
            grid.innerHTML = '';
            var err = document.createElement('p');
            err.className = 'projects-error';
            err.setAttribute('role', 'alert');
            err.textContent = lang === 'pt'
                ? 'Não foi possível carregar os projetos. Tente recarregar a página.'
                : 'Could not load projects. Please try reloading the page.';
            grid.appendChild(err);
        });
}

/* ── Language switcher ── */
function setLanguage(lang) {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
    var t = translations[lang];

    /* Persist choice */
    try { localStorage.setItem('lang', lang); } catch (e) { /* private browsing */ }

    /* Update simple text/html elements by id */
    Object.keys(t).forEach(function (id) {
        if (id === 'demo-label' || id === 'visit-label' ||
            id === 'modal-aria' || id === 'close-modal-aria' || id === 'modal-alt' ||
            id === 'lang-btn-pt-aria' || id === 'lang-btn-en-aria' ||
            id === 'lang-btn-pt-title' || id === 'lang-btn-en-title') return;
        var el = document.getElementById(id);
        if (!el) return;
        if (id === 'bio' || id === 'btn-projects') {
            el.innerHTML = t[id];
        } else {
            el.textContent = t[id];
        }
    });

    /* Update language button states + translated aria-labels */
    var buttons = document.querySelectorAll('.lang-btn');
    buttons.forEach(function (btn) { btn.classList.remove('active'); });
    if (lang === 'pt') {
        buttons[0].classList.add('active');
        buttons[0].setAttribute('aria-pressed', 'true');
        buttons[1].setAttribute('aria-pressed', 'false');
    } else {
        buttons[1].classList.add('active');
        buttons[1].setAttribute('aria-pressed', 'true');
        buttons[0].setAttribute('aria-pressed', 'false');
    }
    buttons[0].setAttribute('aria-label', t['lang-btn-pt-aria']);
    buttons[0].setAttribute('title', t['lang-btn-pt-title']);
    buttons[1].setAttribute('aria-label', t['lang-btn-en-aria']);
    buttons[1].setAttribute('title', t['lang-btn-en-title']);

    /* Update modal aria-labels if present */
    var imageModal = document.getElementById('image-modal');
    if (imageModal) {
        imageModal.setAttribute('aria-label', t['modal-aria']);
        document.getElementById('close-modal').setAttribute('aria-label', t['close-modal-aria']);
        var modalImg = document.getElementById('modal-image');
        if (!modalImg.src || modalImg.src === window.location.href) {
            modalImg.setAttribute('alt', t['modal-alt']);
        }
    }

    /* Update portfolio link href to carry language */
    var projectsLink = document.getElementById('btn-projects');
    if (projectsLink && projectsLink.tagName === 'A') {
        projectsLink.href = './portfolio.html' + (lang !== 'pt' ? '?lang=' + lang : '');
    }

    /* Load and render project cards if on portfolio page */
    fetchProjects(lang);
}

/* ── Dynamic project rendering (safe DOM construction) ── */
function renderProjects(lang) {
    var grid = document.getElementById('projects-grid');
    var t = translations[lang];
    var projects = projectsData ? projectsData[lang] : null;

    grid.innerHTML = '';

    if (!projects || projects.length === 0) {
        var empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = lang === 'pt' ? 'Nenhum projeto encontrado.' : 'No projects found.';
        grid.appendChild(empty);
        return;
    }

    projects.forEach(function (p) {
        var card = document.createElement('article');
        card.className = 'project-card';

        var tag = document.createElement('span');
        tag.className = 'project-tag';
        tag.textContent = p.tag;

        var title = document.createElement('h2');
        title.textContent = p.title;

        var desc = document.createElement('p');
        desc.textContent = p.desc;

        var thumbLink = document.createElement('a');
        thumbLink.className = 'project-thumb';
        thumbLink.href = p.img;
        thumbLink.setAttribute('role', 'button');
        thumbLink.setAttribute('aria-label',
            (lang === 'pt' ? 'Ampliar imagem: ' : 'Enlarge image: ') + p.title);

        var img = document.createElement('img');
        img.src = p.img;
        img.alt = p.alt;
        img.width = 600;
        img.height = 210;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.onerror = function () {
            this.style.display = 'none';
            var fallback = document.createElement('div');
            fallback.className = 'img-fallback';
            fallback.textContent = lang === 'pt' ? 'Imagem indisponível' : 'Image unavailable';
            this.parentNode.appendChild(fallback);
        };
        thumbLink.appendChild(img);

        var links = document.createElement('div');
        links.className = 'project-links';

        var demoLink = document.createElement('a');
        demoLink.className = 'demo';
        demoLink.href = p.img;
        demoLink.setAttribute('role', 'button');
        demoLink.textContent = t['demo-label'];
        demoLink.setAttribute('aria-label', t['demo-label'] + ' — ' + p.title);

        var visitLink = document.createElement('a');
        visitLink.className = 'visit';
        visitLink.href = p.visit;
        visitLink.target = '_blank';
        visitLink.rel = 'noopener noreferrer';
        visitLink.textContent = t['visit-label'];
        visitLink.setAttribute('aria-label', t['visit-label'] + ' — ' + p.title);

        links.appendChild(demoLink);
        links.appendChild(visitLink);

        card.appendChild(tag);
        card.appendChild(title);
        card.appendChild(desc);
        card.appendChild(thumbLink);
        card.appendChild(links);
        grid.appendChild(card);
    });
}

/* ── Image modal (event delegation + focus trap) ── */
function initModal() {
    var imageModal = document.getElementById('image-modal');
    if (!imageModal) return;

    var modalImage = document.getElementById('modal-image');
    var closeModalButton = document.getElementById('close-modal');
    var lastFocusedElement = null;

    function getFocusableElements() {
        return imageModal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
    }

    function openImageModal(url, altText) {
        lastFocusedElement = document.activeElement;
        modalImage.src = url;
        if (altText) {
            modalImage.alt = altText;
        }
        imageModal.classList.add('open');
        imageModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        closeModalButton.focus();
    }

    function closeImageModal() {
        imageModal.classList.remove('open');
        imageModal.setAttribute('aria-hidden', 'true');
        modalImage.src = '';
        document.body.style.overflow = '';
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus();
        }
    }

    /* Focus trap: Tab/Shift+Tab cycle within modal */
    imageModal.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        var focusable = getFocusableElements();
        if (focusable.length === 0) return;

        var first = focusable[0];
        var last = focusable[focusable.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });

    /* Event delegation: catches clicks on .project-thumb and .demo */
    document.addEventListener('click', function (e) {
        var target = e.target.closest('.project-thumb, .demo');
        if (target) {
            e.preventDefault();
            var imgEl = target.closest('.project-card') ?
                target.closest('.project-card').querySelector('.project-thumb img') : null;
            var alt = imgEl ? imgEl.alt : '';
            openImageModal(target.getAttribute('href'), alt);
        }
    });

    closeModalButton.addEventListener('click', closeImageModal);

    imageModal.addEventListener('click', function (e) {
        if (e.target === imageModal) closeImageModal();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && imageModal.classList.contains('open')) {
            closeImageModal();
        }
    });
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', function () {
    /* Determine initial language: URL param > localStorage > default pt */
    var params = new URLSearchParams(window.location.search);
    var savedLang = params.get('lang');
    if (!savedLang) {
        try { savedLang = localStorage.getItem('lang'); } catch (e) { /* noop */ }
    }
    var lang = (savedLang === 'en') ? 'en' : 'pt';

    setLanguage(lang);
    initModal();

    /* Dynamic copyright year */
    var currentYear = new Date().getFullYear();
    var yearSpans = document.querySelectorAll('[id^="year-"]');
    yearSpans.forEach(function (span) { span.textContent = currentYear; });

    /* Language button listeners */
    document.querySelectorAll('.lang-btn').forEach(function (btn, idx) {
        btn.addEventListener('click', function () {
            setLanguage(idx === 0 ? 'pt' : 'en');
        });
    });
});
