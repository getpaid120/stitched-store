// Stitched v2 — Dropshipping Storefront with 3D aesthetic
const DATA_URL = 'products.json';

async function loadJSON(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : null; }
  catch { return null; }
}

const DEFAULT_PRODUCTS = [
  { id:'p1',name:'Wireless Earbuds Pro',supplierPrice:12.50,yourPrice:29.99,description:'Premium ANC earbuds with 24hr battery life. Crystal-clear calls.',category:'Electronics',supplier:'AliExpress',emoji:'🎧',gradient:'#1a1a3e,#0d0d1e' },
  { id:'p2',name:'LED Desk Lamp',supplierPrice:8.75,yourPrice:24.99,description:'Touch control lamp with 3 brightness levels and USB charging port.',category:'Home',supplier:'AliExpress',emoji:'💡',gradient:'#1a3a1a,#0d1e0d' },
  { id:'p3',name:'Organic Cotton Hoodie',supplierPrice:15.00,yourPrice:39.99,description:'Sustainable fleece hoodie — soft, warm, and ethically made.',category:'Clothing',supplier:'Printful',emoji:'🧥',gradient:'#3a2a1a,#1e150d' },
  { id:'p4',name:'Smart Water Bottle',supplierPrice:6.30,yourPrice:19.99,description:'Hydration tracker with LED reminder. BPA-free 500ml.',category:'Accessories',supplier:'AliExpress',emoji:'💧',gradient:'#1a2a3e,#0d1520' },
  { id:'p5',name:'Bluetooth Speaker',supplierPrice:10.00,yourPrice:34.99,description:'Waterproof portable speaker with rich 360° sound. 12hr playtime.',category:'Electronics',supplier:'AliExpress',emoji:'🔊',gradient:'#2a1a3e,#150d20' },
  { id:'p6',name:'Bamboo Phone Stand',supplierPrice:2.50,yourPrice:9.99,description:'Eco-friendly bamboo stand with adjustable viewing angle.',category:'Accessories',supplier:'AliExpress',emoji:'🎋',gradient:'#2a3a1a,#15200d' },
];
let products = [];
let orders = [];
let cart = [];
let currentPage = 'store';
let lastSync = null;

function loadLocal(key, fallback) {
  try { const d = localStorage.getItem('st2_'+key); return d ? JSON.parse(d) : fallback; }
  catch { return fallback; }
}
function saveLocal(key, data) { localStorage.setItem('st2_'+key, JSON.stringify(data)); }

function notify(msg) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className='toast'; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

async function init() {
  products = loadLocal('products', DEFAULT_PRODUCTS);
  orders = loadLocal('orders', []);
  cart = loadLocal('cart', []);
  lastSync = loadLocal('lastSync', null);
  
  // Try to load from remote products.json (GitHub Actions pushes this)
  const remote = await loadJSON(DATA_URL);
  if (remote && Array.isArray(remote) && remote.length > 0) {
    products = remote;
    saveLocal('products', products);
    lastSync = new Date().toISOString();
    saveLocal('lastSync', lastSync);
  }
  
  render();
}

function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(renderTopbar());
  
  const page = document.createElement('div');
  page.className = 'page';
  
  if (currentPage === 'store') page.appendChild(renderStore());
  else if (currentPage === 'admin') page.appendChild(renderDashboard());
  else if (currentPage === 'checkout') page.appendChild(renderCheckout());
  else if (currentPage === 'confirmed') page.appendChild(renderConfirmed());
  
  app.appendChild(page);
  
  // Update cart badge
  const badge = document.getElementById('cartBadge');
  if (badge) {
    const c = cart.reduce((s,i) => s + i.qty, 0);
    badge.textContent = c;
    badge.classList.toggle('hidden', c === 0);
  }
}

function renderTopbar() {
  const h = document.createElement('header');
  h.className = 'topbar';
  h.innerHTML = `<div class="topbar-inner">
    <button class="logo" onclick="navigate('store')">
      <span class="logo-icon">🧵</span>
      <span>Stitched<span class="logo-dot"></span></span>
    </button>
    <nav class="nav">
      <button class="nav-btn ${currentPage==='store'?'active':''}" onclick="navigate('store')">Store</button>
      <button class="nav-btn ${currentPage==='admin'?'active':''}" onclick="navigate('admin')">Dashboard</button>
    </nav>
    <button class="cart-btn" onclick="toggleCart()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      Cart
      <span class="cart-badge ${cart.reduce((s,i)=>s+i.qty,0)===0?'hidden':''}" id="cartBadge">${cart.reduce((s,i)=>s+i.qty,0)}</span>
    </button>
  </div>`;
  return h;
}

// --- STORE PAGE ---
function renderStore() {
  const page = document.createElement('div');
  let search = '', category = 'all';
  const cats = ['all', ...new Set(products.map(p => p.category))];
  
  function renderGrid() {
    const grid = page.querySelector('.product-grid');
    if (!grid) return;
    const filtered = products.filter(p => {
      if (category !== 'all' && p.category !== category) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    
    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state"><span class="empty-state-icon">📦</span><p>No products found</p></div>`;
    } else {
      grid.innerHTML = filtered.map(p => {
        const emoji = p.emoji || '📦';
        const grad = p.gradient || '#1a1a2e,#0a0a14';
        return `<div class="product-card">
          <div class="product-image" style="background:linear-gradient(135deg,${grad})">
            <span class="product-emoji">${emoji}</span>
            <span class="product-supplier">${p.supplier}</span>
          </div>
          <div class="product-info">
            <div class="product-category-row">
              <span class="product-category">${p.category}</span>
            </div>
            <h3 class="product-name">${p.name}</h3>
            <p class="product-desc">${p.description}</p>
            <div class="product-price-row">
              <span class="product-price">$${p.yourPrice.toFixed(2)}</span>
              <span class="product-supplier-price">$${p.supplierPrice.toFixed(2)}</span>
            </div>
            <button class="add-cart-btn btn-primary" style="width:100%;margin-top:12px;padding:12px;font-size:13px" onclick="event.stopPropagation();addToCart('${p.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              Add to Cart
            </button>
          </div>
        </div>`;
      }).join('');
    }
  }
  
  page.innerHTML = `
    <section class="hero">
      <div class="hero-badge"><span class="hero-badge-dot"></span> D2C Marketplace</div>
      <h1>Curated products.<br>Your markup.</h1>
      <p class="hero-sub">Add any product with your price — when customers buy, you fulfill directly with the supplier.</p>
      <div class="hero-actions">
        <button class="btn-primary" onclick="navigate('admin')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          Add Products
        </button>
        <button class="btn-secondary" onclick="document.querySelector('.products-section')?.scrollIntoView({behavior:'smooth'})">
          Browse Store
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
      <div class="hero-stats">
        <div class="hero-stat"><div class="hero-stat-num">${products.length}</div><div class="hero-stat-label">Products</div></div>
        <div class="hero-stat"><div class="hero-stat-num">${orders.length}</div><div class="hero-stat-label">Orders</div></div>
        <div class="hero-stat"><div class="hero-stat-num">${lastSync ? new Date(lastSync).toLocaleDateString() : 'Live'}</div><div class="hero-stat-label">Last Sync</div></div>
      </div>
    </section>
    <section class="products-section">
      <div class="section-header">
        <div class="section-header-left">
          <div class="section-label">Products</div>
          <h2 class="section-title">Browse Collection</h2>
        </div>
        <div class="section-controls" id="sectionControls">
          <div class="search-wrap">
            <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input class="search-input" type="text" placeholder="Search products..." id="storeSearch">
          </div>
          <div class="cat-filters" id="catFilters">
            ${cats.map(c => `<button class="cat-btn ${c===category?'active':''}" data-cat="${c}">${c==='all'?'All':c}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="product-grid"></div>
    </section>
  `;
  
  renderGrid();
  
  setTimeout(() => {
    const inp = page.querySelector('#storeSearch');
    if (inp) inp.addEventListener('input', function() { search = this.value; renderGrid(); });
    page.querySelectorAll('#catFilters .cat-btn').forEach(b => {
      b.addEventListener('click', function() {
        page.querySelectorAll('#catFilters .cat-btn').forEach(x => x.classList.remove('active'));
        this.classList.add('active');
        category = this.dataset.cat;
        renderGrid();
      });
    });
  }, 0);
  
  return page;
}

// --- DASHBOARD ---
function renderDashboard() {
  const page = document.createElement('div');
  page.className = 'dashboard';
  let tab = 'orders';
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const totalRev = orders.reduce((s,o) => s + o.total, 0);
  
  function renderContent() {
    const content = page.querySelector('.db-content');
    if (!content) return;
    
    if (tab === 'orders') {
      content.innerHTML = orders.length === 0
        ? `<div class="empty-state"><span class="empty-state-icon">📋</span><p>No orders yet</p></div>`
        : `<div class="orders-list">${orders.map(o => `
          <div class="order-card ${o.status}">
            <div class="order-header">
              <div><span class="order-id">#${o.id.slice(0,8)}</span> <span class="order-status ${o.status}">${o.status}</span></div>
              <span class="order-date">${new Date(o.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="order-customer">${o.customerName} · ${o.customerEmail}</div>
            <div class="order-ship">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${o.shippingAddress}
            </div>
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px">${o.items.map(i => `${i.name} × ${i.qty}`).join(', ')}</div>
            <div class="order-footer">
              <span class="order-total">$${o.total.toFixed(2)}</span>
              ${o.status === 'pending' ? `<button class="fulfill-btn" onclick="fulfillOrder('${o.id}')">Mark Fulfilled</button>` : ''}
            </div>
          </div>
        `).join('')}</div>`;
    } else {
      content.innerHTML = `
        <div class="products-toolbar">
          <span style="font-size:13px;color:var(--text-secondary)">${products.length} products · ${lastSync ? 'Last sync: '+new Date(lastSync).toLocaleString() : 'Local only'}</span>
          <button class="btn-primary" style="padding:8px 18px;font-size:12px" onclick="showProductForm()">+ Add Product</button>
        </div>
        <div id="productForm" class="product-form hidden">
          <h4>New Product</h4>
          <div class="form-grid">
            <div class="form-field"><label>Name</label><input type="text" id="pfName" placeholder="Product name"></div>
            <div class="form-field"><label>Category</label><select id="pfCat"><option>Electronics</option><option>Clothing</option><option>Home</option><option>Accessories</option><option>Other</option></select></div>
            <div class="form-field" style="grid-column:1/-1"><label>Description</label><input type="text" id="pfDesc" placeholder="Short description"></div>
            <div class="form-field"><label>Supplier</label><input type="text" id="pfSup" placeholder="AliExpress, Printful..." value="AliExpress"></div>
            <div class="form-field"><label>Supplier Price ($)</label><input type="number" step="0.01" id="pfSupPrice"></div>
            <div class="form-field"><label>Your Price ($)</label><input type="number" step="0.01" id="pfYourPrice"></div>
            <div class="form-field"><label>Emoji</label><input type="text" id="pfEmoji" placeholder="🎧" maxlength="2"></div>
          </div>
          <button class="submit-btn" onclick="submitProduct()">Add to Store</button>
        </div>
        <div class="product-table-wrap">
          <table class="product-table">
            <thead><tr><th>Product</th><th>Cost</th><th>Sell</th><th>Profit</th><th>Margin</th><th></th></tr></thead>
            <tbody>${products.map(p => {
              const profit = p.yourPrice - p.supplierPrice;
              const margin = p.yourPrice > 0 ? ((profit / p.yourPrice) * 100).toFixed(0) : '0';
              return `<tr><td><strong>${p.name}</strong><br><span style="font-size:11px;color:var(--text-muted)">${p.category}</span></td>
                <td>$${p.supplierPrice.toFixed(2)}</td>
                <td>$${p.yourPrice.toFixed(2)}</td>
                <td class="profit">+$${profit.toFixed(2)}</td>
                <td>${margin}%</td>
                <td class="delete-cell"><button class="delete-btn" onclick="deleteProduct('${p.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></td></tr>`;
            }).join('')}</tbody>
          </table>
        </div>
      `;
    }
  }
  
  page.innerHTML = `
    <div class="dashboard-header">
      <h2>Dashboard</h2>
      <div class="dashboard-stats">
        <div class="stat-card"><div class="stat-card-label">Products</div><div class="stat-card-value">${products.length}</div></div>
        <div class="stat-card accent"><div class="stat-card-label">Revenue</div><div class="stat-card-value">$${totalRev.toFixed(2)}</div></div>
        <div class="stat-card"><div class="stat-card-label">Orders</div><div class="stat-card-value">${orders.length}</div></div>
        <div class="stat-card"><div class="stat-card-label">To Fulfill</div><div class="stat-card-value">${pendingCount}</div></div>
      </div>
      <div class="dashboard-tabs">
        <button class="db-tab ${tab==='orders'?'active':''}" onclick="switchTab('orders')">Orders</button>
        <button class="db-tab ${tab==='products'?'active':''}" onclick="switchTab('products')">Products</button>
      </div>
    </div>
    <div class="db-content"></div>
  `;
  
  renderContent();
  return page;
}

// --- CHECKOUT ---
function renderCheckout() {
  if (cart.length === 0) {
    return makePage(`<div class="empty-state"><span class="empty-state-icon">🛒</span><h3 style="margin:8px 0;font-family:var(--font-display);font-weight:600">Cart is empty</h3><button class="btn-primary" style="margin:12px auto" onclick="navigate('store')">Browse Store</button></div>`);
  }
  const ct = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const page = document.createElement('div');
  page.className = 'checkout-page';
  page.innerHTML = `
    <div class="checkout-layout">
      <div class="checkout-form-section">
        <h2>Checkout</h2>
        <div class="section-block">
          <h4>Shipping Details</h4>
          <div class="form-field"><label>Full Name</label><input type="text" id="chName" placeholder="John Doe"></div>
          <div class="form-field"><label>Email</label><input type="email" id="chEmail" placeholder="john@example.com"></div>
          <div class="form-field"><label>Address</label><textarea id="chAddr" placeholder="123 Main St, City, Country" rows="3"></textarea></div>
        </div>
        <div class="section-block">
          <h4>Payment</h4>
          <p class="payment-note">🔒 Secured — test mode (no real charge)</p>
          <div class="form-field"><label>Card Number</label><input type="text" inputmode="numeric" id="chCard" placeholder="4242 4242 4242 4242" maxlength="19"></div>
          <div class="card-row">
            <div class="form-field"><label>Expiry</label><input type="text" inputmode="numeric" id="chExp" placeholder="MM/YY" maxlength="5"></div>
            <div class="form-field"><label>CVC</label><input type="text" inputmode="numeric" id="chCvc" placeholder="123" maxlength="4"></div>
          </div>
        </div>
        <button class="place-order-btn" onclick="placeOrder()" id="placeBtn">Pay $${ct.toFixed(2)}</button>
      </div>
      <div class="checkout-summary">
        <h4>Order Summary</h4>
        ${cart.map(i => `<div class="summary-item"><span>${i.name} × ${i.qty}</span><span>$${(i.price*i.qty).toFixed(2)}</span></div>`).join('')}
        <div class="summary-total"><span>Total</span><span>$${ct.toFixed(2)}</span></div>
        <p style="font-size:11px;color:var(--text-muted);margin-top:12px">You fulfill orders with your supplier</p>
      </div>
    </div>
  `;
  return page;
}

function renderConfirmed() {
  const page = document.createElement('div');
  page.className = 'confirmed-page';
  page.innerHTML = `<div class="confirmed-card">
    <span class="confirmed-icon">✅</span>
    <h2>Order Placed!</h2>
    <p>Check the Dashboard to fulfill it.</p>
    <button class="btn-primary" style="margin:20px auto 0" onclick="navigate('store')">Continue Shopping</button>
  </div>`;
  return page;
}

function makePage(html) {
  const d = document.createElement('div');
  d.className = 'page';
  d.innerHTML = html;
  return d;
}

// --- GLOBALS ---
window.navigate = function(p) { currentPage = p; render(); };

window.addToCart = function(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const ex = cart.find(i => i.productId === id);
  if (ex) ex.qty++;
  else cart.push({ productId: id, name: p.name, price: p.yourPrice, qty: 1, emoji: p.emoji || '📦' });
  saveLocal('cart', cart);
  render();
  notify('Added ✓');
};

window.toggleCart = function() {
  const ov = document.querySelector('.cart-overlay');
  if (ov) { ov.classList.toggle('open'); return; }
  const e = document.createElement('div');
  e.className = 'cart-overlay open';
  const ct = cart.reduce((s,i) => s + i.price * i.qty, 0);
  e.innerHTML = `<div class="cart-panel">
    <div class="cart-panel-header"><h3>Cart</h3><button class="close-btn" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:20px" onclick="toggleCart()">✕</button></div>
    ${cart.length === 0 ? '<div class="empty-state">Empty</div>' : `
      <div class="cart-items">${cart.map(i => `
        <div class="cart-item">
          <div class="cart-item-info"><span class="cart-item-name">${i.emoji || ''} ${i.name}</span><span class="cart-item-price">$${i.price.toFixed(2)}</span></div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="cartQty('${i.productId}',-1)">−</button>
            <span style="font-size:14px;font-weight:500;min-width:16px;text-align:center">${i.qty}</span>
            <button class="qty-btn" onclick="cartQty('${i.productId}',1)">+</button>
          </div>
        </div>`).join('')}</div>
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:700;padding-top:8px;border-top:1px solid var(--surface-border)"><span>Total</span><span style="color:var(--accent)">$${ct.toFixed(2)}</span></div>
      <button class="checkout-btn" style="width:100%;background:var(--gradient-1);color:#fff;border:none;padding:14px;border-radius:var(--radius-lg);font-size:14px;font-weight:600;cursor:pointer;margin-top:12px" onclick="goCheckout()">Checkout</button>
    `}
  </div>`;
  e.addEventListener('click', function(ev) { if (ev.target === this) this.classList.remove('open'); });
  document.body.appendChild(e);
};

window.cartQty = function(id, d) {
  cart = cart.map(i => i.productId === id ? {...i, qty: Math.max(0, i.qty + d)} : i).filter(i => i.qty > 0);
  saveLocal('cart', cart);
  document.querySelector('.cart-overlay.open')?.remove();
  window.toggleCart();
  render();
};

window.goCheckout = function() {
  document.querySelector('.cart-overlay')?.classList.remove('open');
  navigate('checkout');
};

window.fulfillOrder = function(id) {
  const o = orders.find(x => x.id === id);
  if (o) { o.status = 'fulfilled'; saveLocal('orders', orders); notify('Fulfilled ✓'); render(); }
};

window.switchTab = function(t) {
  const cont = document.querySelector('.dashboard');
  if (!cont) return;
  cont.querySelectorAll('.db-tab').forEach(b => b.classList.toggle('active', b.textContent.toLowerCase().includes(t)));
  // Re-render
  const oldPage = currentPage;
  currentPage = 'admin';
  render();
  currentPage = oldPage;
};

window.showProductForm = function() {
  document.getElementById('productForm')?.classList.toggle('hidden');
};

window.submitProduct = function() {
  const name = document.getElementById('pfName')?.value;
  const price = parseFloat(document.getElementById('pfYourPrice')?.value);
  if (!name || !price) return notify('Name and price required');
  products.push({
    id: crypto.randomUUID(),
    name, description: document.getElementById('pfDesc')?.value || '',
    category: document.getElementById('pfCat')?.value || 'Other',
    supplier: document.getElementById('pfSup')?.value || 'AliExpress',
    supplierPrice: parseFloat(document.getElementById('pfSupPrice')?.value) || 0,
    yourPrice: price,
    emoji: document.getElementById('pfEmoji')?.value || '📦',
    gradient: '#1a1a2e,#0a0a14',
  });
  saveLocal('products', products);
  notify('Product added!');
  render();
};

window.deleteProduct = function(id) {
  products = products.filter(p => p.id !== id);
  saveLocal('products', products);
  notify('Deleted');
  render();
};

window.placeOrder = function() {
  const name = document.getElementById('chName')?.value;
  const email = document.getElementById('chEmail')?.value;
  const addr = document.getElementById('chAddr')?.value;
  if (!name || !email || !addr) return notify('Please fill in all details');
  
  const btn = document.getElementById('placeBtn');
  btn.disabled = true; btn.textContent = '⏳ Processing...';
  
  setTimeout(() => {
    const ct = cart.reduce((s,i) => s + i.price * i.qty, 0);
    orders.unshift({
      id: crypto.randomUUID(), customerName: name, customerEmail: email,
      shippingAddress: addr, items: [...cart], total: ct,
      status: 'pending', createdAt: new Date().toISOString(),
    });
    saveLocal('orders', orders);
    cart = []; saveLocal('cart', cart);
    navigate('confirmed');
    notify('Order placed ✓');
  }, 1200);
};

// Boot
init();
