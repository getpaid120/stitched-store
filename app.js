// Stitched — Dropshipping Storefront (Static / GitHub Pages)
// All data persisted in localStorage

const DEFAULT_PRODUCTS = [
  { id:'p1', name:'Wireless Earbuds Pro', supplierPrice:12.50, yourPrice:29.99, description:'Premium sound quality with noise cancellation', category:'Electronics', supplier:'AliExpress' },
  { id:'p2', name:'Minimalist LED Desk Lamp', supplierPrice:8.75, yourPrice:24.99, description:'Touch control, 3 brightness levels, USB charging', category:'Home', supplier:'AliExpress' },
  { id:'p3', name:'Organic Cotton Hoodie', supplierPrice:15.00, yourPrice:39.99, description:'Sustainable, soft-touch fleece, unisex fit', category:'Clothing', supplier:'Printful' },
  { id:'p4', name:'Smart Water Bottle', supplierPrice:6.30, yourPrice:19.99, description:'Tracks hydration, LED reminder, 500ml BPA-free', category:'Accessories', supplier:'AliExpress' },
  { id:'p5', name:'Portable Bluetooth Speaker', supplierPrice:10.00, yourPrice:34.99, description:'Waterproof, 12hr battery, rich bass', category:'Electronics', supplier:'AliExpress' },
  { id:'p6', name:'Bamboo Phone Stand', supplierPrice:2.50, yourPrice:9.99, description:'Eco-friendly bamboo, adjustable viewing angle', category:'Accessories', supplier:'AliExpress' },
];

function loadData(key, fallback) {
  try { const d = localStorage.getItem('stitched_'+key); return d ? JSON.parse(d) : fallback; }
  catch { return fallback; }
}
function saveData(key, data) { localStorage.setItem('stitched_'+key, JSON.stringify(data)); }

let products = loadData('products', DEFAULT_PRODUCTS);
let orders = loadData('orders', []);
let cart = [];
let currentPage = 'store';

function saveProducts() { saveData('products', products); }
function saveOrders() { saveData('orders', orders); }

function notify(msg) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className='toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(renderTopbar());
  app.appendChild(renderPage());
}

function renderTopbar() {
  const header = document.createElement('header');
  header.className = 'topbar';
  header.innerHTML = `<div class="topbar-inner">
    <button class="logo-btn" onclick="navigate('store')">
      <span class="logo-icon">🧵</span>
      <span class="logo-text">Stitched</span>
    </button>
    <nav class="top-nav">
      <button class="nav-btn ${currentPage==='store'?'active':''}" onclick="navigate('store')">Store</button>
      <button class="nav-btn ${currentPage==='admin'?'active':''}" onclick="navigate('admin')">Dashboard</button>
    </nav>
    <button class="cart-btn" onclick="toggleCart()">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      <span class="cart-badge ${cart.length===0?'hidden':''}" id="cartBadge">${cart.reduce((s,i)=>s+i.qty,0)}</span>
    </button>
  </div>`;
  return header;
}

function renderPage() {
  if (currentPage === 'store') return renderStore();
  if (currentPage === 'admin') return renderAdmin();
  if (currentPage === 'checkout') return renderCheckout();
  if (currentPage === 'confirmed') return renderConfirmed();
  return renderStore();
}

// --- STORE PAGE ---
function renderStore() {
  const container = document.createElement('div');
  container.className = 'store-page';
  
  let search = '';
  let category = 'all';
  const categories = ['all', ...new Set(products.map(p => p.category))];
  
  function renderProducts() {
    const filtered = products.filter(p => {
      if (category !== 'all' && p.category !== category) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    
    const grid = container.querySelector('.product-grid') || document.createElement('div');
    grid.className = 'product-grid';
    
    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state"><span class="empty-state-icon">📦</span><p>No products found. Add some in the Dashboard!</p></div>`;
    } else {
      grid.innerHTML = filtered.map(p => {
        const gradient = p.category === 'Electronics' ? '#1a3a5c,#0d2137' :
                         p.category === 'Home' ? '#2d4a2d,#1a2e1a' :
                         p.category === 'Clothing' ? '#5c3a1a,#37200e' : '#3a2d5c,#1f1737';
        const emoji = { Electronics:'📱', Home:'🏠', Clothing:'👕', Accessories:'⌚' }[p.category] || '📦';
        return `<div class="product-card">
          <div class="product-image" style="background:linear-gradient(135deg,${gradient})">
            <span class="product-emoji">${emoji}</span>
            <span class="supplier-tag">${p.supplier}</span>
          </div>
          <div class="product-info">
            <span class="product-category">${p.category}</span>
            <h3 class="product-name">${p.name}</h3>
            <p class="product-desc">${p.description}</p>
            <div class="price-row">
              <span class="product-price">$${p.yourPrice.toFixed(2)}</span>
              <span class="supplier-price">Supplier: $${p.supplierPrice.toFixed(2)}</span>
            </div>
            <button class="add-cart-btn" onclick="addToCart('${p.id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              Add to Cart
            </button>
          </div>
        </div>`;
      }).join('');
    }
    
    const existing = container.querySelector('.product-grid');
    if (existing) existing.replaceWith(grid);
    else container.appendChild(grid);
  }
  
  container.innerHTML = `
    <div class="store-header">
      <h1 class="store-title">Curated Goods</h1>
      <p class="store-subtitle">Hand-picked products at honest prices</p>
      <div class="store-controls">
        <div class="search-wrap">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input class="search-input" type="text" placeholder="Search products..." id="searchInput">
        </div>
        <div class="category-filters" id="catFilters">
          ${categories.map(c => `<button class="cat-btn ${c===category?'active':''}" data-cat="${c}">${c==='all'?'All':c}</button>`).join('')}
        </div>
      </div>
    </div>
    <div class="product-grid"></div>
  `;
  
  const grid = container.querySelector('.product-grid');
  const filtered = products.filter(p => {
    if (category !== 'all' && p.category !== category) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state"><span class="empty-state-icon">📦</span><p>No products found. Add some in the Dashboard!</p></div>`;
  } else {
    grid.innerHTML = filtered.map(p => {
      const gradient = p.category === 'Electronics' ? '#1a3a5c,#0d2137' :
                       p.category === 'Home' ? '#2d4a2d,#1a2e1a' :
                       p.category === 'Clothing' ? '#5c3a1a,#37200e' : '#3a2d5c,#1f1737';
      const emoji = { Electronics:'📱', Home:'🏠', Clothing:'👕', Accessories:'⌚' }[p.category] || '📦';
      return `<div class="product-card">
        <div class="product-image" style="background:linear-gradient(135deg,${gradient})">
          <span class="product-emoji">${emoji}</span>
          <span class="supplier-tag">${p.supplier}</span>
        </div>
        <div class="product-info">
          <span class="product-category">${p.category}</span>
          <h3 class="product-name">${p.name}</h3>
          <p class="product-desc">${p.description}</p>
          <div class="price-row">
            <span class="product-price">$${p.yourPrice.toFixed(2)}</span>
            <span class="supplier-price">Supplier: $${p.supplierPrice.toFixed(2)}</span>
          </div>
          <button class="add-cart-btn" onclick="addToCart('${p.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            Add to Cart
          </button>
        </div>
      </div>`;
    }).join('');
  }
  
  // Wire up search
  setTimeout(() => {
    const inp = container.querySelector('#searchInput');
    if (inp) inp.addEventListener('input', function() {
      search = this.value;
      renderProducts();
    });
    
    container.querySelectorAll('#catFilters .cat-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        container.querySelectorAll('#catFilters .cat-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        category = this.dataset.cat;
        renderProducts();
      });
    });
  }, 0);
  
  return container;
}

// --- ADMIN DASHBOARD ---
function renderAdmin() {
  const container = document.createElement('div');
  container.className = 'admin-page';
  
  let tab = 'orders';
  const totalRev = orders.reduce((s,o) => s + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  
  function renderOrders() {
    const section = container.querySelector('.orders-section');
    if (!section) return;
    section.innerHTML = orders.length === 0
      ? `<div class="empty-state"><span class="empty-state-icon">📋</span><p>No orders yet. Share your store link!</p></div>`
      : orders.map(o => `
        <div class="order-card ${o.status}">
          <div class="order-header-row">
            <div class="order-meta">
              <span class="order-id">#${o.id.slice(0,8)}</span>
              <span class="order-status-badge ${o.status}">${o.status}</span>
            </div>
            <span class="order-date">${new Date(o.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="order-customer">${o.customerName} — ${o.customerEmail}</div>
          <div class="order-ship">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${o.shippingAddress}
          </div>
          <div style="border-top:1px solid var(--border);padding-top:8px">
            ${o.items.map(i => `<div class="summary-item"><span>${i.name} × ${i.qty}</span><span>$${(i.price*i.qty).toFixed(2)}</span></div>`).join('')}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px">
            <span class="order-total">Total: $${o.total.toFixed(2)}</span>
            ${o.status === 'pending' ? `<button class="fulfill-btn" onclick="fulfillOrder('${o.id}')">Mark Fulfilled</button>` : ''}
          </div>
        </div>
      `).join('');
  }
  
  function renderProductsTable() {
    const section = container.querySelector('.products-section-content');
    if (!section) return;
    section.innerHTML = `
      <div class="products-toolbar">
        <span class="products-count">${products.length} products</span>
        <button class="add-product-btn" onclick="showAddProduct()">+ Add Product</button>
      </div>
      <div id="productForm" class="product-form hidden">
        <h4>New Product</h4>
        <div class="form-grid">
          <div class="form-field"><label>Product Name</label><input type="text" id="pfName" placeholder="e.g. Wireless Mouse"></div>
          <div class="form-field"><label>Description</label><input type="text" id="pfDesc" placeholder="Short description"></div>
          <div class="form-field"><label>Category</label><select id="pfCat"><option>Electronics</option><option>Clothing</option><option>Home</option><option>Accessories</option><option>Other</option></select></div>
          <div class="form-field"><label>Supplier</label><select id="pfSup"><option>AliExpress</option><option>Printful</option><option>Spocket</option><option>Other</option></select></div>
          <div class="form-field"><label>Supplier Price ($)</label><input type="number" step="0.01" id="pfSupPrice" placeholder="0.00"></div>
          <div class="form-field"><label>Your Price ($)</label><input type="number" step="0.01" id="pfYourPrice" placeholder="0.00"></div>
        </div>
        <button class="add-product-btn" style="margin-top:12px" onclick="submitProduct()">Add to Store</button>
      </div>
      <div class="product-table">
        <div class="table-header">
          <span>Product</span><span>Cost</span><span>Sell</span><span>Profit</span><span>Margin</span><span></span>
        </div>
        ${products.map(p => {
          const profit = p.yourPrice - p.supplierPrice;
          const margin = p.yourPrice > 0 ? ((profit / p.yourPrice) * 100).toFixed(0) : '0';
          return `<div class="table-row">
            <div><div class="table-name">${p.name}</div><div class="table-category">${p.category}</div></div>
            <span>$${p.supplierPrice.toFixed(2)}</span>
            <span>$${p.yourPrice.toFixed(2)}</span>
            <span class="profit-pos">$${profit.toFixed(2)}</span>
            <span>${margin}%</span>
            <button class="delete-btn" onclick="deleteProduct('${p.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>`;
        }).join('')}
      </div>
    `;
  }
  
  container.innerHTML = `
    <div class="admin-header">
      <h2>Dashboard</h2>
      <div class="admin-stats">
        <div class="stat-card"><span class="stat-label">Products</span><span class="stat-value">${products.length}</span></div>
        <div class="stat-card"><span class="stat-label">Orders</span><span class="stat-value">${orders.length}</span></div>
        <div class="stat-card"><span class="stat-label">Revenue</span><span class="stat-value">$${totalRev.toFixed(2)}</span></div>
        <div class="stat-card warning"><span class="stat-label">To Fulfill</span><span class="stat-value">${pendingOrders.length}</span></div>
      </div>
      <div class="admin-tabs">
        <button class="tab-btn ${tab==='orders'?'active':''}" onclick="switchAdminTab('orders')">Orders (${orders.length})</button>
        <button class="tab-btn ${tab==='products'?'active':''}" onclick="switchAdminTab('products')">Products (${products.length})</button>
      </div>
    </div>
    <div class="orders-section"></div>
    <div class="products-section-content"></div>
  `;
  
  renderOrders();
  renderProductsTable();
  
  return container;
}

// --- CHECKOUT ---
function renderCheckout() {
  if (cart.length === 0) {
    const page = document.createElement('div');
    page.className = 'store-page';
    page.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🛒</span><h3 style="margin:8px 0">Your cart is empty</h3><p style="color:var(--text-secondary)">Add some products first!</p><button class="back-store-btn" onclick="navigate('store')">Browse Store</button></div>`;
    return page;
  }
  
  const container = document.createElement('div');
  container.className = 'checkout-page';
  const ct = cart.reduce((s,i) => s + i.price * i.qty, 0);
  
  container.innerHTML = `
    <div class="checkout-layout">
      <div class="checkout-form-section">
        <h2>Checkout</h2>
        <div class="section-block">
          <h4>Shipping Details</h4>
          <div class="form-field"><label>Full Name</label><input type="text" id="chName" placeholder="John Doe"></div>
          <div class="form-field"><label>Email</label><input type="email" id="chEmail" placeholder="john@example.com"></div>
          <div class="form-field"><label>Shipping Address</label><textarea id="chAddr" placeholder="123 Main St, City, Country" rows="3"></textarea></div>
        </div>
        <div class="section-block">
          <h4>Payment</h4>
          <p class="payment-note">🔒 Secure payment processing. Your card is charged on order.</p>
          <div class="form-field"><label>Card Number</label><input type="text" inputmode="numeric" id="chCard" placeholder="4242 4242 4242 4242" maxlength="19"></div>
          <div class="card-row">
            <div class="form-field"><label>Expiry</label><input type="text" inputmode="numeric" id="chExp" placeholder="MM/YY" maxlength="5"></div>
            <div class="form-field"><label>CVC</label><input type="text" inputmode="numeric" id="chCvc" placeholder="123" maxlength="4"></div>
          </div>
        </div>
        <button class="place-order-btn" onclick="placeOrder()" id="placeOrderBtn">Pay $${ct.toFixed(2)}</button>
      </div>
      <div class="checkout-summary">
        <h4>Order Summary</h4>
        <div class="summary-items">
          ${cart.map(i => `<div class="summary-item"><span>${i.name} × ${i.qty}</span><span>$${(i.price*i.qty).toFixed(2)}</span></div>`).join('')}
        </div>
        <div class="summary-total"><span>Total</span><span>$${ct.toFixed(2)}</span></div>
        <p style="font-size:11px;color:var(--text-muted);margin-top:12px">You will fulfill this order with your supplier</p>
      </div>
    </div>
  `;
  
  return container;
}

function renderConfirmed() {
  const container = document.createElement('div');
  container.className = 'confirmed-page';
  container.innerHTML = `
    <div class="confirmed-card">
      <span class="confirmed-icon">✅</span>
      <h2>Order Placed!</h2>
      <p>We've received your order. You'll get a confirmation email shortly.</p>
      <p style="margin-top:6px;color:var(--text-secondary)">The store owner will fulfill your order soon.</p>
      <button class="back-store-btn" onclick="navigate('store')">Continue Shopping</button>
    </div>
  `;
  return container;
}

// --- GLOBAL FUNCTIONS ---
window.navigate = function(page) { currentPage = page; render(); };
window.toggleCart = function() {
  const overlay = document.querySelector('.cart-overlay');
  if (overlay) { overlay.classList.toggle('open'); return; }
  
  const ct = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const overlayEl = document.createElement('div');
  overlayEl.className = 'cart-overlay open';
  overlayEl.innerHTML = `<div class="cart-panel">
    <div class="cart-panel-header"><h3>Your Cart</h3><button class="close-btn" onclick="toggleCart()">✕</button></div>
    ${cart.length === 0 ? '<p class="empty-state">Your cart is empty</p>' : `
      <div class="cart-items">
        ${cart.map(i => `
          <div class="cart-item">
            <div class="cart-item-info">
              <span class="cart-item-name">${i.name}</span>
              <span class="cart-item-price-text">$${i.price.toFixed(2)}</span>
            </div>
            <div class="cart-item-qty">
              <button class="qty-btn" onclick="cartQty('${i.productId}',-1)">−</button>
              <span class="qty-num">${i.qty}</span>
              <button class="qty-btn" onclick="cartQty('${i.productId}',1)">+</button>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="cart-total"><span>Total</span><span class="cart-total-amount">$${ct.toFixed(2)}</span></div>
      <button class="checkout-btn" onclick="goCheckout()">Proceed to Checkout</button>
    `}
  </div>`;
  
  overlayEl.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('open'); });
  document.body.appendChild(overlayEl);
};

window.cartQty = function(id, delta) {
  cart = cart.map(i => i.productId === id ? {...i, qty: Math.max(0, i.qty + delta)} : i).filter(i => i.qty > 0);
  updateCartUI();
};
window.goCheckout = function() {
  document.querySelector('.cart-overlay')?.classList.remove('open');
  navigate('checkout');
};
window.addToCart = function(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const existing = cart.find(i => i.productId === id);
  if (existing) existing.qty++;
  else cart.push({ productId: id, name: p.name, price: p.yourPrice, qty: 1 });
  updateCartUI();
  notify('Added to cart');
};
window.fulfillOrder = function(id) {
  const o = orders.find(x => x.id === id);
  if (o) { o.status = 'fulfilled'; saveOrders(); notify('Order marked as fulfilled!'); render(); }
};
window.switchAdminTab = function(tab) {
  const container = document.querySelector('.admin-page');
  if (!container) return;
  const ordersSec = container.querySelector('.orders-section');
  const prodsSec = container.querySelector('.products-section-content');
  const tabs = container.querySelectorAll('.tab-btn');
  tabs.forEach(t => t.classList.toggle('active', t.textContent.toLowerCase().includes(tab)));
  
  if (ordersSec) ordersSec.style.display = tab === 'orders' ? '' : 'none';
  if (prodsSec) prodsSec.style.display = tab === 'products' ? '' : 'none';
};
window.showAddProduct = function() {
  document.getElementById('productForm')?.classList.toggle('hidden');
};
window.submitProduct = function() {
  const name = document.getElementById('pfName')?.value;
  const yourPrice = parseFloat(document.getElementById('pfYourPrice')?.value);
  if (!name || !yourPrice) return notify('Name and your price required');
  
  products.push({
    id: crypto.randomUUID(),
    name,
    description: document.getElementById('pfDesc')?.value || '',
    category: document.getElementById('pfCat')?.value || 'Other',
    supplier: document.getElementById('pfSup')?.value || 'AliExpress',
    supplierPrice: parseFloat(document.getElementById('pfSupPrice')?.value) || 0,
    yourPrice,
  });
  saveProducts();
  notify('Product added!');
  render();
};
window.deleteProduct = function(id) {
  products = products.filter(p => p.id !== id);
  saveProducts();
  notify('Product deleted');
  render();
};
window.placeOrder = function() {
  const name = document.getElementById('chName')?.value;
  const email = document.getElementById('chEmail')?.value;
  const addr = document.getElementById('chAddr')?.value;
  if (!name || !email || !addr) return notify('Please fill in all details');
  
  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-loading">⏳ Processing...</span>';
  
  setTimeout(() => {
    const ct = cart.reduce((s,i) => s + i.price * i.qty, 0);
    orders.unshift({
      id: crypto.randomUUID(),
      customerName: name,
      customerEmail: email,
      shippingAddress: addr,
      items: [...cart],
      total: ct,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    saveOrders();
    cart = [];
    updateCartUI();
    navigate('confirmed');
    notify('Order placed! Check the Dashboard.');
  }, 1500);
};

function updateCartUI() {
  const badge = document.getElementById('cartBadge');
  if (badge) {
    const count = cart.reduce((s,i) => s + i.qty, 0);
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
  }
  // Re-render cart overlay if open
  const overlay = document.querySelector('.cart-overlay.open');
  if (overlay) { overlay.remove(); window.toggleCart(); }
}

// Init
render();
