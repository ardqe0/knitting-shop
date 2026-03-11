(() => {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const storageKey = 'orguButikCart';
  const fallbackImage = 'img/urun-1.jpg';

  const toPositiveInt = (value) => {
    const number = Number.parseInt(String(value ?? 0), 10);
    return Number.isNaN(number) || number < 0 ? 0 : number;
  };

  const normalizeCartItem = (item) => {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const name = typeof item.name === 'string' && item.name.trim() ? item.name.trim() : 'Urun';
    const price = toPositiveInt(item.price);
    const quantity = Math.max(1, toPositiveInt(item.quantity));
    const image = typeof item.image === 'string' && item.image.trim() ? item.image : fallbackImage;

    return { name, price, quantity, image };
  };

  const readCart = () => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map(normalizeCartItem).filter(Boolean);
    } catch {
      return [];
    }
  };

  const writeCart = (cart) => {
    localStorage.setItem(storageKey, JSON.stringify(cart));
  };

  const setActiveNav = () => {
    document.querySelectorAll('[data-nav]').forEach((link) => {
      if (link.getAttribute('href') === page) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  };

  const renderYear = () => {
    const year = new Date().getFullYear();
    document.querySelectorAll('[data-year]').forEach((el) => {
      el.textContent = String(year);
    });
  };

  const getItemCount = (cart) => cart.reduce((sum, item) => sum + item.quantity, 0);

  const renderCartCount = () => {
    const totalItems = getItemCount(readCart());
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = String(totalItems);
    });
  };

  const parsePrice = (text) => {
    const onlyDigits = String(text || '').replace(/[^0-9]/g, '');
    return toPositiveInt(onlyDigits);
  };

  const addToCart = (name, price, image) => {
    const cart = readCart();
    const itemName = (name || 'Urun').trim();
    const itemPrice = toPositiveInt(price);
    const itemImage = image || fallbackImage;

    const existing = cart.find((item) => item.name === itemName);

    if (existing) {
      existing.quantity += 1;
      existing.price = itemPrice || existing.price;
      existing.image = existing.image || itemImage;
    } else {
      cart.push({
        name: itemName,
        price: itemPrice,
        quantity: 1,
        image: itemImage
      });
    }

    writeCart(cart);
    renderCartCount();
    renderCartPage();
  };

  const bindProductFilter = () => {
    const productSearch = document.getElementById('productSearch');
    const categoryFilter = document.getElementById('categoryFilter');

    if (!productSearch && !categoryFilter) {
      return;
    }

    const filterProducts = () => {
      const searchText = (productSearch?.value || '').trim().toLowerCase();
      const category = categoryFilter?.value || 'all';

      document.querySelectorAll('.product-card').forEach((card) => {
        const name = (card.getAttribute('data-name') || '').toLowerCase();
        const cardCategory = card.getAttribute('data-category') || '';

        const nameMatch = name.includes(searchText);
        const categoryMatch = category === 'all' || cardCategory === category;

        card.classList.toggle('d-none', !(nameMatch && categoryMatch));
      });
    };

    productSearch?.addEventListener('input', filterProducts);
    categoryFilter?.addEventListener('change', filterProducts);
    filterProducts();
  };

  
  const bindColorOptions = () => {
    document.querySelectorAll('.color-option').forEach((button) => {
      button.addEventListener('click', () => {
        const card = button.closest('.product-card');
        if (!card) {
          return;
        }

        const selectedImage = button.getAttribute('data-color-image');
        if (!selectedImage) {
          return;
        }

        const productImage = card.querySelector('[data-product-image]') || card.querySelector('img.product-image');
        if (productImage) {
          productImage.setAttribute('src', selectedImage);
        }

        card.setAttribute('data-image', selectedImage);

        card.querySelectorAll('.color-option').forEach((opt) => {
          opt.classList.remove('active');
        });
        button.classList.add('active');
      });
    });
  };
  const bindAddToCartButtons = () => {
    document.querySelectorAll('.add-to-cart').forEach((button) => {
      button.addEventListener('click', () => {
        const card = button.closest('.product-card');
        if (!card) {
          return;
        }

        const name = card.getAttribute('data-name') || card.querySelector('h2')?.textContent || 'Urun';
        const priceText = card.querySelector('.fw-semibold')?.textContent || '0';
        const image = card.getAttribute('data-image') || card.querySelector('img')?.getAttribute('src') || fallbackImage;

        addToCart(name, parsePrice(priceText), image);

        const original = button.textContent;
        button.textContent = 'Eklendi';
        button.classList.remove('btn-success');
        button.classList.add('btn-outline-success');

        setTimeout(() => {
          button.textContent = original;
          button.classList.add('btn-success');
          button.classList.remove('btn-outline-success');
        }, 900);
      });
    });
  };

  const ensureCartContainers = () => {
    const cardBody = document.querySelector('.card .card-body');
    if (!cardBody || document.getElementById('cartItems')) {
      return;
    }

    const itemsTitle = document.createElement('h2');
    itemsTitle.className = 'h5 mt-4';
    itemsTitle.textContent = 'Sepetteki Urunler';

    const itemsList = document.createElement('div');
    itemsList.id = 'cartItems';
    itemsList.className = 'mt-3';

    const total = document.createElement('p');
    total.id = 'cartTotal';
    total.className = 'fw-semibold mt-3 mb-0';

    cardBody.appendChild(itemsTitle);
    cardBody.appendChild(itemsList);
    cardBody.appendChild(total);
  };

  const renderCartPage = () => {
    if (!page.includes('cart.html')) {
      return;
    }

    ensureCartContainers();

    const cartItemsEl = document.getElementById('cartItems');
    const cartTotalEl = document.getElementById('cartTotal');

    if (!cartItemsEl || !cartTotalEl) {
      return;
    }

    const cart = readCart();
    cartItemsEl.innerHTML = '';

    if (cart.length === 0) {
      cartItemsEl.innerHTML = '<p class="text-secondary mb-0">Sepet bos.</p>';
      cartTotalEl.textContent = 'Toplam Tutar: 0 TL';
      return;
    }

    let totalPrice = 0;

    cart.forEach((item) => {
      const lineTotal = item.price * item.quantity;
      totalPrice += lineTotal;

      const row = document.createElement('div');
      row.className = 'd-flex justify-content-between align-items-center border rounded-3 p-2 mb-2 bg-light gap-3';

      const left = document.createElement('div');
      left.className = 'd-flex align-items-center gap-3';

      const image = document.createElement('img');
      image.src = item.image || fallbackImage;
      image.className = 'cart-item-image';
      image.alt = item.name;

      const detail = document.createElement('div');

      const title = document.createElement('strong');
      title.textContent = item.name;

      const br = document.createElement('br');

      const qtyText = document.createElement('small');
      qtyText.className = 'text-secondary';
      qtyText.textContent = `${item.quantity} adet x ${item.price} TL`;

      detail.appendChild(title);
      detail.appendChild(br);
      detail.appendChild(qtyText);

      left.appendChild(image);
      left.appendChild(detail);

      const right = document.createElement('span');
      right.textContent = `${lineTotal} TL`;

      row.appendChild(left);
      row.appendChild(right);
      cartItemsEl.appendChild(row);
    });

    cartTotalEl.textContent = `Toplam Tutar: ${totalPrice} TL`;
  };

  const bindClearCart = () => {
    const clearCartButton = document.getElementById('clearCart');
    const cartStatus = document.getElementById('cartStatus');

    if (!clearCartButton) {
      return;
    }

    clearCartButton.addEventListener('click', () => {
      writeCart([]);
      renderCartCount();
      renderCartPage();

      if (cartStatus) {
        cartStatus.hidden = false;
        cartStatus.className = 'alert alert-info mt-3';
        cartStatus.textContent = 'Sepet temizlendi.';
      }
    });
  };

  const bindContactForm = () => {
    const contactForm = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');

    if (!contactForm || !formStatus) {
      return;
    }

    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      formStatus.hidden = false;
      formStatus.className = 'alert alert-success mt-3';
      formStatus.textContent = 'Mesajiniz alindi. En kisa surede donus yapacagiz.';
      contactForm.reset();
    });
  };

  const renderAuthNav = () => {
    const loggedIn = JSON.parse(localStorage.getItem('orgu_loggedIn') || 'null');
    const nav = document.querySelector('#mainNav ul.navbar-nav');
    if (!nav) return;


    const registerItem = [...nav.querySelectorAll('a[data-nav]')]
      .find(a => a.getAttribute('href') === 'register.html')?.closest('li');
    const loginItem = [...nav.querySelectorAll('a[data-nav]')]
      .find(a => a.getAttribute('href') === 'login.html')?.closest('li');

    if (loggedIn) {

      if (registerItem) registerItem.style.display = 'none';
      if (loginItem) loginItem.style.display = 'none';


      if (!nav.querySelector('[data-nav-account]')) {
        const li = document.createElement('li');
        li.className = 'nav-item';
        const page = window.location.pathname.split('/').pop() || 'index.html';
        li.innerHTML = `<a class="nav-link${page === 'dashboard.html' ? ' active' : ''}" data-nav data-nav-account href="dashboard.html">Hesabım</a>`;
        nav.appendChild(li);
      }
    } else {

      if (registerItem) registerItem.style.display = '';
      if (loginItem) loginItem.style.display = '';
      nav.querySelector('[data-nav-account]')?.closest('li')?.remove();
    }
  };

  setActiveNav();
  renderYear();
  renderAuthNav();
  bindProductFilter();
  bindColorOptions();
  bindAddToCartButtons();
  bindClearCart();
  bindContactForm();
  renderCartCount();
  renderCartPage();
})();
