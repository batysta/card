(() => {
  'use strict';

  // Configure aqui o ID da planilha publicada.
  const SHEET_ID = '1MpMjaGeDdPsR5n8NmzeJowPy_0NcVwQy_xJYYQQnqQI';
  const SHEET_TAB = 'Produtos';
  const API_URL = `https://opensheet.elk.sh/${SHEET_ID}/${encodeURIComponent(SHEET_TAB)}`;
  const DEFAULT_WHATSAPP = '5598999999999';
  const PLACEHOLDER_IMAGE = 'assets/produtos/placeholder.svg';

  const fallbackProducts = [
    {
      id: '1',
      nome: 'Whey Protein 1kg',
      descricao: 'Proteina concentrada premium para suporte no pos-treino.',
      preco: 149.9,
      categoria: 'Suplementos',
      imagem: 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=900',
      whatsapp: DEFAULT_WHATSAPP,
      promocao: true,
      precoPromocional: 129.9,
      destaque: true,
      ordem: 1
    },
    {
      id: '2',
      nome: 'Creatina Monohidratada 300g',
      descricao: 'Creatina pura para ganho de forca e performance.',
      preco: 119.9,
      categoria: 'Suplementos',
      imagem: 'https://images.pexels.com/photos/6550906/pexels-photo-6550906.jpeg?auto=compress&cs=tinysrgb&w=900',
      whatsapp: DEFAULT_WHATSAPP,
      promocao: false,
      precoPromocional: null,
      destaque: false,
      ordem: 2
    },
    {
      id: '3',
      nome: 'Luva de Treino Premium',
      descricao: 'Conforto e firmeza para treinos de musculacao.',
      preco: 59.9,
      categoria: 'Acessorios',
      imagem: 'https://images.pexels.com/photos/4167544/pexels-photo-4167544.jpeg?auto=compress&cs=tinysrgb&w=900',
      whatsapp: DEFAULT_WHATSAPP,
      promocao: true,
      precoPromocional: 49.9,
      destaque: false,
      ordem: 3
    },
    {
      id: '4',
      nome: 'Coqueteleira 700ml',
      descricao: 'Mistura facil para suplementos do dia a dia.',
      preco: 39.9,
      categoria: 'Acessorios',
      imagem: 'https://images.pexels.com/photos/6551144/pexels-photo-6551144.jpeg?auto=compress&cs=tinysrgb&w=900',
      whatsapp: DEFAULT_WHATSAPP,
      promocao: false,
      precoPromocional: null,
      destaque: false,
      ordem: 4
    }
  ];

  const els = {
    searchInput: document.getElementById('searchInput'),
    sortSelect: document.getElementById('sortSelect'),
    perPageSelect: document.getElementById('perPageSelect'),
    categorySelect: document.getElementById('categorySelect'),
    grid: document.getElementById('productsGrid'),
    loading: document.getElementById('loadingState'),
    error: document.getElementById('errorState'),
    empty: document.getElementById('emptyState'),
    listSection: document.querySelector('.products-list-section'),
    productModal: document.getElementById('productModal'),
    productModalImage: document.getElementById('productModalImage'),
    productModalClose: document.getElementById('productModalClose'),
    productModalPrev: document.getElementById('productModalPrev'),
    productModalNext: document.getElementById('productModalNext'),
    productModalCounter: document.getElementById('productModalCounter'),
    pagination: document.getElementById('pagination'),
    pagePrev: document.getElementById('pagePrev'),
    pageNext: document.getElementById('pageNext'),
    pageNumbers: document.getElementById('pageNumbers')
  };

  const state = {
    products: [],
    category: 'Todos',
    search: '',
    sort: 'custom',
    currentPage: 1,
    perPage: 9,
    modalImages: [],
    modalIndex: 0,
    modalProductName: ''
  };

  function sanitizeText(value) {
    return String(value ?? '')
      .replace(/[<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function sanitizePhone(value) {
    const digits = String(value ?? '').replace(/\D/g, '');
    return digits || DEFAULT_WHATSAPP;
  }

  function truncateText(value, maxLength) {
    const text = sanitizeText(value);
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trimEnd()}...`;
  }

  function sanitizeUrl(value) {
    const raw = sanitizeText(value);
    if (!raw) return PLACEHOLDER_IMAGE;
    try {
      const parsed = new URL(raw, window.location.origin);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return parsed.href;
      return PLACEHOLDER_IMAGE;
    } catch {
      return PLACEHOLDER_IMAGE;
    }
  }

  function parseImageList(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return [PLACEHOLDER_IMAGE];

    const separators = /[\n|;,]+/g;
    const items = raw
      .split(separators)
      .map((item) => sanitizeUrl(item))
      .filter((item) => item && item !== PLACEHOLDER_IMAGE);

    if (!items.length) return [PLACEHOLDER_IMAGE];
    return [...new Set(items)];
  }

  function toNumber(value) {
    const raw = String(value ?? '').replace(/[R$\s]/g, '').trim();
    if (!raw) return NaN;

    let normalized = raw;
    const hasComma = normalized.includes(',');
    const hasDot = normalized.includes('.');

    if (hasComma && hasDot) {
      const lastComma = normalized.lastIndexOf(',');
      const lastDot = normalized.lastIndexOf('.');
      if (lastComma > lastDot) {
        normalized = normalized.replace(/\./g, '').replace(',', '.');
      } else {
        normalized = normalized.replace(/,/g, '');
      }
    } else if (hasComma) {
      normalized = normalized.replace(',', '.');
    }

    normalized = normalized.replace(/[^0-9.-]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function isSim(value) {
    const normalized = sanitizeText(value).toLowerCase();
    return normalized === 'sim' || normalized === 'true' || normalized === '1';
  }

  function getField(row, key) {
    if (!row || typeof row !== 'object') return '';
    if (Object.prototype.hasOwnProperty.call(row, key)) return row[key];
    const normalizedKey = key.toLowerCase();
    const found = Object.keys(row).find((k) => sanitizeText(k).toLowerCase() === normalizedKey);
    return found ? row[found] : '';
  }

  function mapRow(row, index) {
    const nome = sanitizeText(getField(row, 'nome'));
    if (!nome) return null;

    const preco = toNumber(getField(row, 'preco'));
    const precoPromocional = toNumber(getField(row, 'preco_promocional'));
    const promocao = isSim(getField(row, 'promocao')) && Number.isFinite(precoPromocional) && precoPromocional > 0;
    const ordem = Number.parseInt(String(getField(row, 'ordem') || ''), 10);
    const imagens = parseImageList(getField(row, 'imagem'));

    return {
      id: sanitizeText(getField(row, 'id')) || String(index + 1),
      nome,
      descricao: truncateText(getField(row, 'descricao'), 300) || 'Produto sem descricao cadastrada.',
      preco: Number.isFinite(preco) && preco > 0 ? preco : 0,
      categoria: sanitizeText(getField(row, 'categoria')) || 'Outros',
      imagens,
      imagem: imagens[0],
      whatsapp: sanitizePhone(getField(row, 'whatsapp')),
      promocao,
      precoPromocional: promocao ? precoPromocional : null,
      destaque: isSim(getField(row, 'destaque')),
      ordem: Number.isFinite(ordem) ? ordem : 9999
    };
  }

  function formatBRL(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  function getDisplayPrice(product) {
    if (product.promocao && Number.isFinite(product.precoPromocional)) return product.precoPromocional;
    return product.preco;
  }

  function compareFeatured(a, b) {
    return Number(b.destaque) - Number(a.destaque);
  }

  function sortProducts(items, sortType) {
    const sorted = [...items];
    sorted.sort((a, b) => {
      // Produtos em destaque sempre priorizados no topo.
      const featuredDiff = compareFeatured(a, b);
      if (featuredDiff !== 0) return featuredDiff;

      if (sortType === 'price-asc') return getDisplayPrice(a) - getDisplayPrice(b);
      if (sortType === 'price-desc') return getDisplayPrice(b) - getDisplayPrice(a);
      if (sortType === 'name-asc') return a.nome.localeCompare(b.nome, 'pt-BR');

      const ordemDiff = a.ordem - b.ordem;
      if (ordemDiff !== 0) return ordemDiff;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
    return sorted;
  }

  function filterProducts() {
    const q = state.search.toLowerCase();
    const bySearch = state.products.filter((product) => {
      if (!q) return true;
      return product.nome.toLowerCase().includes(q) || product.descricao.toLowerCase().includes(q);
    });

    const byCategory = bySearch.filter((product) => {
      if (state.category === 'Todos') return true;
      return product.categoria === state.category;
    });

    return sortProducts(byCategory, state.sort);
  }

  function createBadge(text, className) {
    const badge = document.createElement('span');
    badge.className = `badge-chip ${className}`;
    badge.textContent = text;
    return badge;
  }

  function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'product-card';
    if (product.destaque) card.classList.add('is-featured');

    const media = document.createElement('figure');
    media.className = 'product-media';

    const image = document.createElement('img');
    image.src = product.imagem;
    image.alt = `Imagem do produto ${product.nome}`;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.width = 900;
    image.height = 675;
    image.addEventListener('error', () => {
      image.src = PLACEHOLDER_IMAGE;
    });
    image.addEventListener('click', () => openProductModal(product.imagens, 0, product.nome));

    media.appendChild(image);

    const badges = document.createElement('div');
    badges.className = 'badges';

    if (product.promocao) badges.appendChild(createBadge('Promocao', 'promo'));
    if (product.destaque) badges.appendChild(createBadge('Destaque', 'featured'));
    if (badges.childElementCount) media.appendChild(badges);

    const content = document.createElement('div');
    content.className = 'product-content';

    const category = document.createElement('p');
    category.className = 'product-category';
    category.textContent = product.categoria;

    const title = document.createElement('h3');
    title.textContent = product.nome;

    const desc = document.createElement('p');
    desc.className = 'product-description';
    desc.textContent = product.descricao;

    const priceBox = document.createElement('div');
    priceBox.className = 'price-box';

    if (product.promocao && Number.isFinite(product.precoPromocional) && product.preco > product.precoPromocional) {
      const original = document.createElement('span');
      original.className = 'price-original';
      original.textContent = formatBRL(product.preco);
      priceBox.appendChild(original);

      const current = document.createElement('span');
      current.className = 'price-current';
      current.textContent = formatBRL(product.precoPromocional);
      priceBox.appendChild(current);

      const economy = document.createElement('span');
      economy.className = 'price-economy';
      const percent = Math.round(((product.preco - product.precoPromocional) / product.preco) * 100);
      economy.textContent = `${percent}% OFF`;
      priceBox.appendChild(economy);
    } else {
      const current = document.createElement('span');
      current.className = 'price-current';
      current.textContent = formatBRL(product.preco);
      priceBox.appendChild(current);
    }

    const buyButton = document.createElement('a');
    buyButton.className = 'btn btn-primary buy-btn';
    buyButton.target = '_blank';
    buyButton.rel = 'noopener noreferrer';
    buyButton.textContent = 'Comprar no WhatsApp';
    buyButton.setAttribute('aria-label', `Comprar ${product.nome} no WhatsApp`);

    const message = `Olá, tenho interesse no produto ${product.nome} anunciado no site.`;
    buyButton.href = `https://wa.me/${product.whatsapp}?text=${encodeURIComponent(message)}`;

    content.append(category, title, desc, priceBox, buyButton);
    card.append(media, content);
    return card;
  }

  function updateModalImage() {
    if (!els.productModalImage || !state.modalImages.length) return;
    const current = state.modalImages[state.modalIndex] || PLACEHOLDER_IMAGE;
    els.productModalImage.src = current;
    els.productModalImage.alt = `Imagem ampliada do produto ${state.modalProductName}`;

    const showNav = state.modalImages.length > 1;
    if (els.productModalPrev) els.productModalPrev.hidden = !showNav;
    if (els.productModalNext) els.productModalNext.hidden = !showNav;
    if (els.productModalCounter) {
      els.productModalCounter.textContent = showNav ? `${state.modalIndex + 1}/${state.modalImages.length}` : '1/1';
    }
  }

  function openProductModal(images, startIndex, productName) {
    if (!els.productModal || !els.productModalImage) return;
    state.modalImages = Array.isArray(images) && images.length ? images : [PLACEHOLDER_IMAGE];
    state.modalIndex = Math.max(0, Math.min(startIndex || 0, state.modalImages.length - 1));
    state.modalProductName = productName || 'Produto';
    updateModalImage();
    els.productModal.hidden = false;
    document.body.classList.add('modal-open');
  }

  function showPrevModalImage() {
    if (!state.modalImages.length) return;
    state.modalIndex = (state.modalIndex - 1 + state.modalImages.length) % state.modalImages.length;
    updateModalImage();
  }

  function showNextModalImage() {
    if (!state.modalImages.length) return;
    state.modalIndex = (state.modalIndex + 1) % state.modalImages.length;
    updateModalImage();
  }

  function closeProductModal() {
    if (!els.productModal || !els.productModalImage) return;
    els.productModal.hidden = true;
    els.productModalImage.src = '';
    state.modalImages = [];
    state.modalIndex = 0;
    state.modalProductName = '';
    document.body.classList.remove('modal-open');
  }

  function setStatus({ loading = false, error = false, empty = false, showGrid = false } = {}) {
    els.loading.hidden = !loading;
    els.error.hidden = !error;
    els.empty.hidden = !empty;
    els.grid.hidden = !showGrid;
    if (!showGrid && els.pagination) els.pagination.hidden = true;
    if (els.listSection) {
      els.listSection.setAttribute('aria-busy', String(loading));
    }
  }

  function renderProducts() {
    const items = filterProducts();
    els.grid.replaceChildren();
    if (els.pageNumbers) els.pageNumbers.replaceChildren();

    if (!items.length) {
      setStatus({ empty: true, error: !els.error.hidden });
      return;
    }

    const totalPages = Math.max(1, Math.ceil(items.length / state.perPage));
    if (state.currentPage > totalPages) state.currentPage = totalPages;

    const start = (state.currentPage - 1) * state.perPage;
    const end = start + state.perPage;
    const pagedItems = items.slice(start, end);

    const fragment = document.createDocumentFragment();
    pagedItems.forEach((product) => fragment.appendChild(createProductCard(product)));
    els.grid.appendChild(fragment);
    setStatus({ showGrid: true, error: !els.error.hidden });
    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    if (!els.pagination || !els.pagePrev || !els.pageNext || !els.pageNumbers) return;

    els.pageNumbers.replaceChildren();
    if (totalPages <= 1) {
      els.pagination.hidden = true;
      return;
    }

    els.pagination.hidden = false;
    els.pagePrev.disabled = state.currentPage === 1;
    els.pageNext.disabled = state.currentPage === totalPages;

    for (let page = 1; page <= totalPages; page += 1) {
      const pageButton = document.createElement('button');
      pageButton.type = 'button';
      pageButton.className = 'page-number';
      if (page === state.currentPage) pageButton.classList.add('active');
      pageButton.textContent = String(page);
      pageButton.setAttribute('aria-label', `Ir para página ${page}`);
      pageButton.addEventListener('click', () => {
        state.currentPage = page;
        renderProducts();
      });
      els.pageNumbers.appendChild(pageButton);
    }
  }

  function renderCategories() {
    const unique = [...new Set(state.products.map((p) => p.categoria))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const categories = ['Todos', ...unique];

    els.categorySelect.replaceChildren();

    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      option.selected = category === state.category;
      els.categorySelect.appendChild(option);
    });
  }

  function setupControls() {
    let searchTimer = null;

    els.searchInput.addEventListener('input', (event) => {
      clearTimeout(searchTimer);
      const value = sanitizeText(event.target.value);
      searchTimer = setTimeout(() => {
        state.search = value;
        state.currentPage = 1;
        renderProducts();
      }, 120);
    });

    els.sortSelect.addEventListener('change', (event) => {
      state.sort = event.target.value;
      state.currentPage = 1;
      renderProducts();
    });

    els.categorySelect.addEventListener('change', (event) => {
      state.category = event.target.value;
      state.currentPage = 1;
      renderProducts();
    });

    els.perPageSelect.addEventListener('change', (event) => {
      const parsed = Number.parseInt(event.target.value, 10);
      state.perPage = Number.isFinite(parsed) && parsed > 0 ? parsed : 9;
      state.currentPage = 1;
      renderProducts();
    });

    els.pagePrev?.addEventListener('click', () => {
      state.currentPage = Math.max(1, state.currentPage - 1);
      renderProducts();
    });

    els.pageNext?.addEventListener('click', () => {
      const totalPages = Math.max(1, Math.ceil(filterProducts().length / state.perPage));
      state.currentPage = Math.min(totalPages, state.currentPage + 1);
      renderProducts();
    });

    els.productModalClose?.addEventListener('click', closeProductModal);
    els.productModalPrev?.addEventListener('click', showPrevModalImage);
    els.productModalNext?.addEventListener('click', showNextModalImage);
    els.productModal?.addEventListener('click', (event) => {
      if (event.target === els.productModal) closeProductModal();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && els.productModal && !els.productModal.hidden) {
        closeProductModal();
      }
      if (event.key === 'ArrowLeft' && els.productModal && !els.productModal.hidden) {
        showPrevModalImage();
      }
      if (event.key === 'ArrowRight' && els.productModal && !els.productModal.hidden) {
        showNextModalImage();
      }
    });
  }

  async function loadProducts() {
    setStatus({ loading: true });
    console.info('[EliFitness Produtos] Iniciando carregamento da planilha...');

    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        cache: 'no-store'
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const rows = await response.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('Planilha vazia ou formato invalido.');
      }

      const mapped = rows.map(mapRow).filter(Boolean);
      if (!mapped.length) throw new Error('Nenhum produto valido encontrado na planilha.');

      state.products = mapped;
      setStatus({ error: false });
      console.info(`[EliFitness Produtos] ${mapped.length} produtos carregados com sucesso.`);
    } catch (error) {
      state.products = fallbackProducts;
      setStatus({ error: true });
      console.warn('[EliFitness Produtos] Falha ao carregar planilha. Usando fallback local.', error);
    }

    renderCategories();
    renderProducts();
  }

  function init() {
    if (
      !els.grid ||
      !els.searchInput ||
      !els.sortSelect ||
      !els.perPageSelect ||
      !els.categorySelect ||
      !els.loading ||
      !els.error ||
      !els.empty
    ) {
      console.error('[EliFitness Produtos] Elementos essenciais da pagina nao encontrados.');
      return;
    }

    setupControls();
    loadProducts();
  }

  init();
})();
