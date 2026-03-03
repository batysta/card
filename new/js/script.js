const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

document.querySelectorAll('.to-top').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

const WHATSAPP_NUMBER = '5598984842330';

function setupContactWhatsAppForm() {
  const form = document.getElementById('contact-whatsapp-form');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const nome = form.querySelector('#nome')?.value.trim() || '';
    const email = form.querySelector('#email')?.value.trim() || '';
    const mensagem = form.querySelector('#mensagem')?.value.trim() || '';

    const text = [
      'Contato pelo site do SINPROESEMMA',
      `Nome: ${nome}`,
      `E-mail: ${email}`,
      `Mensagem: ${mensagem}`,
    ].join('\n');

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  });
}

function setupImageModal() {
  const modal = document.getElementById('image-modal');
  const modalTarget = document.getElementById('image-modal-target');
  const modalContent = modal?.querySelector('.image-modal-content');
  const zoomInButton = document.getElementById('zoom-in');
  const zoomOutButton = document.getElementById('zoom-out');
  const zoomResetButton = document.getElementById('zoom-reset');
  if (!modal || !modalTarget) return;
  let zoomScale = 1;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let scrollLeftStart = 0;
  let scrollTopStart = 0;

  const applyZoom = () => {
    modalTarget.style.width = `${zoomScale * 100}%`;
    if (modalContent) {
      modalContent.classList.toggle('is-draggable', zoomScale > 1);
    }
  };

  const openModal = (imageElement) => {
    const fullSrc = imageElement.getAttribute('data-fullsrc') || imageElement.getAttribute('src') || '';
    modalTarget.src = fullSrc;
    modalTarget.alt = imageElement.alt || 'Imagem ampliada';
    zoomScale = 1;
    applyZoom();
    if (modalContent) {
      modalContent.scrollTop = 0;
      modalContent.scrollLeft = 0;
    }
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    modalTarget.src = '';
    zoomScale = 1;
    applyZoom();
    if (modalContent) {
      modalContent.scrollTop = 0;
      modalContent.scrollLeft = 0;
    }
    document.body.style.overflow = '';
  };

  document.querySelectorAll('.zoomable-image').forEach((image) => {
    image.addEventListener('click', () => openModal(image));
    image.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModal(image);
      }
    });
  });

  modal.querySelectorAll('[data-close-modal]').forEach((element) => {
    element.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) closeModal();
  });

  zoomInButton?.addEventListener('click', () => {
    zoomScale = Math.min(zoomScale + 0.2, 3);
    applyZoom();
  });

  zoomOutButton?.addEventListener('click', () => {
    zoomScale = Math.max(zoomScale - 0.2, 0.6);
    applyZoom();
  });

  zoomResetButton?.addEventListener('click', () => {
    zoomScale = 1;
    applyZoom();
  });

  if (modalContent) {
    modalContent.addEventListener('mousedown', (event) => {
      if (zoomScale <= 1) return;
      isDragging = true;
      modalContent.classList.add('is-dragging');
      startX = event.clientX;
      startY = event.clientY;
      scrollLeftStart = modalContent.scrollLeft;
      scrollTopStart = modalContent.scrollTop;
      event.preventDefault();
    });

    window.addEventListener('mousemove', (event) => {
      if (!isDragging) return;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      modalContent.scrollLeft = scrollLeftStart - deltaX;
      modalContent.scrollTop = scrollTopStart - deltaY;
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      modalContent.classList.remove('is-dragging');
    });

    modalContent.addEventListener('mouseleave', () => {
      if (!isDragging) return;
      isDragging = false;
      modalContent.classList.remove('is-dragging');
    });
  }
}

const fallbackNews = [
  {
    title: 'Assembleia Geral Extraordinária',
    date: '25/02/2026',
    summary:
      'Debate sobre reajuste salarial, calendário letivo e encaminhamentos da pauta municipal.',
    content:
      'A assembleia discutirá os encaminhamentos sobre reajuste salarial e calendário de mobilizações para o semestre.',
    imageUrl: '',
    link: '',
  },
  {
    title: 'Plantão Jurídico Semanal',
    date: '20/02/2026',
    summary:
      'Atendimento jurídico para dúvidas sobre progressões, direitos e orientações processuais.',
    content:
      'O plantão jurídico atende os filiados mediante agendamento prévio na secretaria do núcleo.',
    imageUrl: '',
    link: '',
  },
  {
    title: 'Convocação para Formação Sindical',
    date: '17/02/2026',
    summary:
      'Capacitação para representantes de base com foco em organização e mobilização da categoria.',
    content:
      'A formação abordará organização sindical, comunicação com a base e encaminhamentos por unidade escolar.',
    imageUrl: '',
    link: '',
  },
];

// Substituído Sheets pelo Firebase para Notícias, Agenda e Convênios
const STATE_NEWS_API_URL =
  'https://www.sinproesemma.org.br/wp-json/wp/v2/posts?per_page=6&_embed=wp:featuredmedia';
const LOCAL_NEWS_PAGE_SIZE = 3;

import { db, collection, getDocs, query, orderBy } from './firebase-config.js';

let localNewsItems = [];
let localNewsCurrentPage = 1;
let conveniosItems = [];
let conveniosCurrentPage = 1;
let conveniosPerPage = 9;

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function withShareKeys(items) {
  const used = new Set();
  return items.map((item, index) => {
    const baseKey = slugify(item.id || item.title) || `noticia-${index + 1}`;
    let key = baseKey;
    let counter = 2;
    while (used.has(key)) {
      key = `${baseKey}-${counter}`;
      counter += 1;
    }
    used.add(key);
    return { ...item, shareKey: key };
  });
}

const fallbackAgenda = [
  {
    title: 'Assembleia Geral da Categoria',
    date: '08/03/2026',
    time: '09:00',
    location: 'Sede do Núcleo - Alto Alegre do Pindaré/MA',
    summary: 'Discussão da pauta salarial e encaminhamentos do semestre.',
  },
  {
    title: 'Reunião de Representantes de Base',
    date: '15/03/2026',
    time: '15:00',
    location: 'Auditório Municipal',
    summary: 'Alinhamento das demandas por escola e planejamento de mobilização.',
  },
];

const fallbackConvenios = [
  {
    id: '1',
    nome: 'Clínica Parceira - Saúde',
    desconto: '10%',
    imagem: 'https://picsum.photos/seed/convenio-saude/800/450',
  },
  {
    id: '2',
    nome: 'Faculdade Conveniada - Educação',
    desconto: '20%',
    imagem: 'https://picsum.photos/seed/convenio-faculdade/800/450',
  },
  {
    id: '3',
    nome: 'Farmácia Parceira - Descontos',
    desconto: '12%',
    imagem: 'https://picsum.photos/seed/convenio-farmacia/800/450',
  },
];

function renderNews(newsItems, containerId = 'news-list', maxItems = newsItems.length) {
  const newsContainer = document.getElementById(containerId);
  if (!newsContainer) return;
  const canExpandWide = containerId === 'news-list' || containerId === 'home-news-list';
  const isLocalNewsList = containerId === 'news-list';

  newsContainer.innerHTML = '';

  newsItems.slice(0, maxItems).forEach((item) => {
    const card = document.createElement('article');
    card.className = 'news-card';
    if (isLocalNewsList && item.shareKey) {
      card.id = `noticia-${item.shareKey}`;
    }
    if (item.imageUrl) {
      const image = document.createElement('img');
      image.className = 'news-image';
      image.src = item.imageUrl;
      image.alt = `Imagem da notícia: ${item.title}`;
      image.loading = 'lazy';
      card.appendChild(image);
    }

    const title = document.createElement('h3');
    title.textContent = item.title;
    card.appendChild(title);

    const date = document.createElement('span');
    date.className = 'news-date';
    date.textContent = item.date;
    card.appendChild(date);

    const summary = document.createElement('p');
    const limitedSummary =
      item.summary && item.summary.length > 250
        ? `${item.summary.slice(0, 250).trimEnd()}...`
        : item.summary;
    summary.textContent = limitedSummary;
    card.appendChild(summary);

    const actions = document.createElement('div');
    actions.className = 'news-actions';

    const detailsButton = document.createElement('button');
    detailsButton.type = 'button';
    detailsButton.className = 'btn btn-outline btn-small';
    detailsButton.classList.add('news-toggle-content');
    detailsButton.textContent = 'Ler conteúdo';

    const detailsText = document.createElement('div');
    detailsText.className = 'news-content blog-content';
    detailsText.hidden = true;
    // Rendering HTML from Quill.js securely
    detailsText.innerHTML = item.content || '<p>Conteúdo completo será publicado em breve.</p>';

    detailsButton.addEventListener('click', () => {
      const isHidden = detailsText.hidden;
      detailsText.hidden = !isHidden;
      detailsButton.textContent = isHidden ? 'Ocultar conteúdo' : 'Ler conteúdo';

      if (canExpandWide) {
        card.classList.toggle('news-card-expanded', isHidden);
      }
    });

    actions.appendChild(detailsButton);

    if (item.link) {
      const sourceButton = document.createElement('a');
      sourceButton.className = 'btn btn-secondary btn-small';
      sourceButton.href = item.link;
      sourceButton.target = '_blank';
      sourceButton.rel = 'noopener noreferrer';
      sourceButton.textContent = 'Fonte da notícia';
      actions.appendChild(sourceButton);
    }

    if (isLocalNewsList && item.shareKey) {
      const shareButton = document.createElement('button');
      shareButton.type = 'button';
      shareButton.className = 'btn btn-outline btn-small';
      shareButton.textContent = 'Compartilhar';
      shareButton.addEventListener('click', async () => {
        const shareUrlObject = new URL(window.location.href);
        shareUrlObject.hash = `noticia-${item.shareKey}`;
        const shareUrl = shareUrlObject.toString();
        try {
          await navigator.clipboard.writeText(shareUrl);
          const oldLabel = shareButton.textContent;
          shareButton.textContent = 'Link copiado';
          setTimeout(() => {
            shareButton.textContent = oldLabel;
          }, 1400);
        } catch (error) {
          window.prompt('Copie o link da notícia:', shareUrl);
        }
      });
      actions.appendChild(shareButton);
    }

    card.appendChild(detailsText);

    card.appendChild(actions);

    newsContainer.appendChild(card);
  });
}

function openLocalNewsFromHash() {
  const hashValue = decodeURIComponent(window.location.hash || '');
  if (!hashValue.startsWith('#noticia-') || !localNewsItems.length) return;

  const key = hashValue.replace('#noticia-', '');
  const itemIndex = localNewsItems.findIndex((item) => item.shareKey === key);
  if (itemIndex === -1) return;

  const targetPage = Math.floor(itemIndex / LOCAL_NEWS_PAGE_SIZE) + 1;
  if (targetPage !== localNewsCurrentPage) {
    renderLocalNewsPage(targetPage);
  }

  requestAnimationFrame(() => {
    const targetCard = document.getElementById(`noticia-${key}`);
    if (!targetCard) return;

    const toggleButton = targetCard.querySelector('.news-toggle-content');
    if (toggleButton && toggleButton.textContent === 'Ler conteúdo') {
      toggleButton.click();
    }

    targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function parseBrDate(dateString) {
  if (!dateString || typeof dateString !== 'string') return 0;
  const [day, month, year] = dateString.split('/').map(Number);
  if (!day || !month || !year) return 0;
  return new Date(year, month - 1, day).getTime();
}

function stripHtml(htmlString) {
  if (!htmlString) return '';
  const div = document.createElement('div');
  div.innerHTML = htmlString;
  return div.textContent?.trim() || '';
}

function formatIsoDateToBr(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

function normalizeRow(row) {
  return {
    id: row.id ?? '',
    title: row.titulo ?? row.title ?? '',
    date: row.data ?? row.date ?? '',
    summary: row.resumo ?? row.summary ?? '',
    content: row.conteudo ?? '',
    imageUrl: row.imagem_url ?? '',
    link: row.link ?? '',
    destaque: String(row.destaque ?? 'NAO').toUpperCase(),
    status: String(row.status ?? 'PUBLICADO').toUpperCase(),
  };
}

function normalizeStateNewsRow(row) {
  const title = stripHtml(row?.title?.rendered || '');
  const summary = stripHtml(row?.excerpt?.rendered || '');
  const date = formatIsoDateToBr(row?.date || '');
  const link = row?.link || '#';
  const imageUrl =
    row?._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
    row?._embedded?.['wp:featuredmedia']?.[0]?.media_details?.sizes?.medium?.source_url ||
    '';

  return {
    title,
    summary,
    date,
    link,
    imageUrl,
  };
}

function renderStateNews(newsItems) {
  const container = document.getElementById('state-news-list');
  if (!container) return;

  container.innerHTML = '';

  if (!newsItems.length) {
    container.innerHTML =
      '<article class="card"><p>Não foi possível carregar as notícias estaduais no momento.</p></article>';
    return;
  }

  newsItems.slice(0, 6).forEach((item) => {
    const card = document.createElement('article');
    card.className = 'news-card';

    if (item.imageUrl) {
      const image = document.createElement('img');
      image.className = 'news-image';
      image.src = item.imageUrl;
      image.alt = `Imagem da notícia estadual: ${item.title}`;
      image.loading = 'lazy';
      card.appendChild(image);
    }

    const title = document.createElement('h3');
    title.textContent = item.title;
    card.appendChild(title);

    const date = document.createElement('span');
    date.className = 'news-date';
    date.textContent = item.date;
    card.appendChild(date);

    const summary = document.createElement('p');
    summary.textContent =
      item.summary.length > 250 ? `${item.summary.slice(0, 250).trimEnd()}...` : item.summary;
    card.appendChild(summary);

    const actions = document.createElement('div');
    actions.className = 'news-actions';
    const linkButton = document.createElement('a');
    linkButton.className = 'btn btn-secondary btn-small';
    linkButton.href = item.link;
    linkButton.target = '_blank';
    linkButton.rel = 'noopener noreferrer';
    linkButton.textContent = 'Ler no site estadual';
    actions.appendChild(linkButton);
    card.appendChild(actions);

    container.appendChild(card);
  });
}

function renderLocalNewsPage(pageNumber) {
  const paginationContainer = document.getElementById('news-pagination');
  if (!paginationContainer) return;

  const totalPages = Math.max(1, Math.ceil(localNewsItems.length / LOCAL_NEWS_PAGE_SIZE));
  localNewsCurrentPage = Math.min(Math.max(1, pageNumber), totalPages);

  const startIndex = (localNewsCurrentPage - 1) * LOCAL_NEWS_PAGE_SIZE;
  const pageItems = localNewsItems.slice(startIndex, startIndex + LOCAL_NEWS_PAGE_SIZE);
  renderNews(pageItems, 'news-list');

  paginationContainer.innerHTML = '';
  if (totalPages <= 1) return;

  const previousButton = document.createElement('button');
  previousButton.type = 'button';
  previousButton.className = 'btn btn-outline btn-small';
  previousButton.textContent = 'Anterior';
  previousButton.disabled = localNewsCurrentPage === 1;
  previousButton.addEventListener('click', () => renderLocalNewsPage(localNewsCurrentPage - 1));

  const pageInfo = document.createElement('span');
  pageInfo.className = 'news-page-info';
  pageInfo.textContent = `Página ${localNewsCurrentPage} de ${totalPages}`;

  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'btn btn-outline btn-small';
  nextButton.textContent = 'Próxima';
  nextButton.disabled = localNewsCurrentPage === totalPages;
  nextButton.addEventListener('click', () => renderLocalNewsPage(localNewsCurrentPage + 1));

  paginationContainer.append(previousButton, pageInfo, nextButton);
}

async function loadStateNews() {
  const container = document.getElementById('state-news-list');
  if (!container) return;

  try {
    const response = await fetch(STATE_NEWS_API_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Falha HTTP ${response.status}`);

    const rawData = await response.json();
    const newsItems = Array.isArray(rawData) ? rawData.map(normalizeStateNewsRow) : [];
    renderStateNews(newsItems);
  } catch (error) {
    console.error('Erro ao carregar notícias estaduais:', error);
    renderStateNews([]);
  }
}

function prepareNewsRows(rows) {
  return rows
    .map(normalizeRow)
    .filter((item) => item.status === 'PUBLICADO' && item.title && item.summary)
    .sort((a, b) => parseBrDate(b.date) - parseBrDate(a.date));
}

function normalizeAgendaRow(row) {
  return {
    title: row.titulo ?? row.title ?? '',
    date: row.data ?? row.date ?? '',
    time: row.horario ?? row.time ?? '',
    location: row.local ?? row.location ?? '',
    summary: row.descricao ?? row.summary ?? '',
    status: String(row.status ?? 'PUBLICADO').toUpperCase(),
  };
}

function normalizeConvenioRow(row) {
  return {
    id: row.id ?? '',
    nome: row.nome ?? '',
    desconto: String(row.desconto ?? '').trim(),
    imagem: row.imagem ?? '',
  };
}

function prepareConveniosRows(rows) {
  return rows
    .map(normalizeConvenioRow)
    .filter((item) => item.nome);
}

function formatDiscount(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.includes('%') ? text : `${text}%`;
}

function parseDiscountNumber(value) {
  const normalized = String(value || '')
    .replace('%', '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function renderConvenios(items) {
  const container = document.getElementById('convenios-list');
  if (!container) return;

  container.innerHTML = '';

  items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'partner-item';

    const title = document.createElement('h3');
    title.textContent = item.nome;
    card.appendChild(title);

    const discountText = formatDiscount(item.desconto);
    if (discountText) {
      const discount = document.createElement('p');
      discount.className = 'partner-discount';
      discount.textContent = `Desconto: ${discountText}`;
      card.appendChild(discount);
    }

    if (item.imagem) {
      const image = document.createElement('img');
      image.src = item.imagem;
      image.alt = `Imagem do convênio ${item.nome}`;
      image.className = 'partner-image';
      image.loading = 'lazy';
      card.appendChild(image);
    }

    container.appendChild(card);
  });
}

function getConveniosViewItems() {
  const searchInput = document.getElementById('convenios-search');
  const sortSelect = document.getElementById('convenios-sort');
  const searchValue = (searchInput?.value || '').trim().toLowerCase();
  const sortValue = sortSelect?.value || 'alphabetical';

  const filtered = conveniosItems.filter((item) =>
    item.nome.toLowerCase().includes(searchValue)
  );

  if (sortValue === 'discount_desc') {
    filtered.sort((a, b) => parseDiscountNumber(b.desconto) - parseDiscountNumber(a.desconto));
  } else if (sortValue === 'discount_asc') {
    filtered.sort((a, b) => parseDiscountNumber(a.desconto) - parseDiscountNumber(b.desconto));
  } else {
    filtered.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  return filtered;
}

function renderConveniosPagination(totalItems) {
  const paginationContainer = document.getElementById('convenios-pagination');
  if (!paginationContainer) return;

  const totalPages = Math.max(1, Math.ceil(totalItems / conveniosPerPage));
  conveniosCurrentPage = Math.min(Math.max(1, conveniosCurrentPage), totalPages);

  paginationContainer.innerHTML = '';
  if (totalPages <= 1) return;

  const prevButton = document.createElement('button');
  prevButton.type = 'button';
  prevButton.className = 'btn btn-outline btn-small';
  prevButton.textContent = 'Anterior';
  prevButton.disabled = conveniosCurrentPage === 1;
  prevButton.addEventListener('click', () => {
    conveniosCurrentPage -= 1;
    applyConveniosFiltersAndPagination();
  });

  const pageInfo = document.createElement('span');
  pageInfo.className = 'news-page-info';
  pageInfo.textContent = `Página ${conveniosCurrentPage} de ${totalPages}`;

  const nextButton = document.createElement('button');
  nextButton.type = 'button';
  nextButton.className = 'btn btn-outline btn-small';
  nextButton.textContent = 'Próxima';
  nextButton.disabled = conveniosCurrentPage === totalPages;
  nextButton.addEventListener('click', () => {
    conveniosCurrentPage += 1;
    applyConveniosFiltersAndPagination();
  });

  paginationContainer.append(prevButton, pageInfo, nextButton);
}

function applyConveniosFiltersAndPagination() {
  const viewItems = getConveniosViewItems();
  const startIndex = (conveniosCurrentPage - 1) * conveniosPerPage;
  const pageItems = viewItems.slice(startIndex, startIndex + conveniosPerPage);
  renderConvenios(pageItems);
  renderConveniosPagination(viewItems.length);
}

function setupConveniosControls() {
  const searchInput = document.getElementById('convenios-search');
  const sortSelect = document.getElementById('convenios-sort');
  const pageSizeSelect = document.getElementById('convenios-page-size');
  if (!searchInput || !sortSelect || !pageSizeSelect) return;

  searchInput.addEventListener('input', () => {
    conveniosCurrentPage = 1;
    applyConveniosFiltersAndPagination();
  });

  sortSelect.addEventListener('change', () => {
    conveniosCurrentPage = 1;
    applyConveniosFiltersAndPagination();
  });

  pageSizeSelect.addEventListener('change', () => {
    conveniosPerPage = Number(pageSizeSelect.value) || 9;
    conveniosCurrentPage = 1;
    applyConveniosFiltersAndPagination();
  });
}

function prepareAgendaRows(rows) {
  return rows
    .map(normalizeAgendaRow)
    .filter((item) => item.status === 'PUBLICADO' && item.title && item.date)
    .sort((a, b) => parseBrDate(b.date) - parseBrDate(a.date));
}

function renderAgenda(events, maxItems = events.length) {
  const agendaContainer = document.getElementById('agenda-list');
  if (!agendaContainer) return;

  agendaContainer.innerHTML = '';

  events.slice(0, maxItems).forEach((event) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${event.title}</h3>
      <p><strong>Data:</strong> ${event.date}${event.time ? ` às ${event.time}` : ''}</p>
      <p><strong>Local:</strong> ${event.location || 'A definir'}</p>
      <p>${event.summary || 'Mais informações em breve.'}</p>
    `;
    agendaContainer.appendChild(card);
  });
}

async function loadAgenda() {
  try {
    const q = query(collection(db, "agenda"), orderBy("isoDate", "desc"));
    const querySnapshot = await getDocs(q);

    const dbItems = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status === 'PUBLICADO') {
        dbItems.push({
          title: data.titulo || '',
          date: data.data || '',
          time: data.horario || '',
          location: data.local || '',
          summary: data.descricao || ''
        });
      }
    });

    renderAgenda(dbItems.length ? dbItems : fallbackAgenda, 3);
  } catch (error) {
    console.error('Erro ao carregar agenda estática pelo Firebase:', error);
    renderAgenda(fallbackAgenda, 3);
  }
}

async function loadConvenios() {
  const container = document.getElementById('convenios-list');
  if (!container) return;

  try {
    setupConveniosControls();

    const q = query(collection(db, "convenios"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    const dbItems = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      dbItems.push({
        id: docSnap.id,
        nome: data.nome || '',
        desconto: data.desconto || '',
        imagem: data.imagem || ''
      });
    });

    conveniosItems = dbItems.length ? dbItems : fallbackConvenios;
    conveniosPerPage = Number(document.getElementById('convenios-page-size')?.value || 9);
    conveniosCurrentPage = 1;
    applyConveniosFiltersAndPagination();
  } catch (error) {
    console.error('Erro ao carregar convênios do Firebase:', error);
    conveniosItems = fallbackConvenios;
    conveniosPerPage = Number(document.getElementById('convenios-page-size')?.value || 9);
    conveniosCurrentPage = 1;
    applyConveniosFiltersAndPagination();
  }
}

async function loadNews() {
  try {
    const q = query(collection(db, "noticias"), orderBy("isoDate", "desc"));
    const querySnapshot = await getDocs(q);

    const dbItems = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status === 'PUBLICADO') {
        dbItems.push({
          id: docSnap.id,
          title: data.titulo || '',
          date: data.data || '',
          summary: data.resumo || '',
          content: data.conteudo || '',
          imageUrl: data.imagem_url || '',
          link: data.link || '',
          destaque: data.destaque || 'NAO'
        });
      }
    });

    const safeNews = dbItems.length ? dbItems : fallbackNews;
    const safeNewsWithKeys = withShareKeys(safeNews);

    localNewsItems = safeNewsWithKeys;
    renderLocalNewsPage(1);

    const homeContainer = document.getElementById('home-news-list');
    if (homeContainer) {
      renderNews(safeNewsWithKeys, 'home-news-list', 3);
    }

    const highlighted = safeNewsWithKeys.find((item) => item.destaque === 'SIM') || safeNewsWithKeys[0];
    updateHighlight(highlighted);
    openLocalNewsFromHash();

  } catch (error) {
    console.error('Erro ao carregar notícias do Firebase:', error);
    localNewsItems = withShareKeys(fallbackNews);
    renderLocalNewsPage(1);

    const homeContainer = document.getElementById('home-news-list');
    if (homeContainer) {
      renderNews(localNewsItems, 'home-news-list', 3);
    }

    updateHighlight(localNewsItems[0]);
    openLocalNewsFromHash();
  }
}

function updateHighlight(newsItem) {
  if (!newsItem) return;

  const title = document.getElementById('highlight-title');
  const date = document.getElementById('highlight-date');
  const summary = document.getElementById('highlight-summary');

  if (title) title.textContent = newsItem.title;
  if (date) date.textContent = `Atualizado em: ${newsItem.date}`;
  if (summary) summary.textContent = newsItem.summary;
}

loadNews();
loadAgenda();
loadConvenios();
loadStateNews();
setupContactWhatsAppForm();
setupImageModal();
window.addEventListener('hashchange', openLocalNewsFromHash);
