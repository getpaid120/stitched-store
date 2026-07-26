// Stitched v3 — Full storefront with auth, categories, info pages
// Architecture: loads products from products.json (fetched at run time),
// falls back to embedded data. Cart/orders/users in localStorage.

const DATA_URL = 'products.json';

// ─── Data ─────────────────────────────────────────────────────────────
let products = [];
let orders = [];
let cart = [];
let currentPage = 'store';
let lastSync = null;
let currentUser = null;

// Simple user auth helpers (localStorage-based)
function getUsers() { return lsj('users', []); }
function saveUsers(u) { lssj('users', u); }
function getUser(email) { return getUsers().find(u => u.email === email); }
function isLoggedIn() { const u = lsj('currentUser', null); currentUser = u; return !!u; }
function login(email, password) {
  const u = getUser(email);
  if (!u || u.password !== password) return false;
  currentUser = u; lssj('currentUser', { email: u.email, name: u.name });
  return true;
}
function signup(name, email, password) {
  if (getUser(email)) return false;
  const users = getUsers();
  users.push({ name, email, password, created: new Date().toISOString() });
  saveUsers(users);
  return login(email, password);
}
function logout() { currentUser = null; localStorage.removeItem('st_currentUser'); }



// ─── Translation System ─────────────────────────────────────────────
const LANGUAGES = {
  en: { name: 'English', native: 'English' },
  es: { name: 'Spanish', native: 'Español' },
  fr: { name: 'French', native: 'Français' },
  de: { name: 'German', native: 'Deutsch' },
  pt: { name: 'Portuguese', native: 'Português' },
  it: { name: 'Italian', native: 'Italiano' },
  zh: { name: 'Chinese', native: '中文' },
  ja: { name: 'Japanese', native: '日本語' },
  ko: { name: 'Korean', native: '한국어' },
  ar: { name: 'Arabic', native: 'العربية' },
  hi: { name: 'Hindi', native: 'हिन्दी' },
  ru: { name: 'Russian', native: 'Русский' },
  nl: { name: 'Dutch', native: 'Nederlands' },
  pl: { name: 'Polish', native: 'Polski' },
  tr: { name: 'Turkish', native: 'Türkçe' },
  sv: { name: 'Swedish', native: 'Svenska' },
  da: { name: 'Danish', native: 'Dansk' },
  fi: { name: 'Finnish', native: 'Suomi' },
  no: { name: 'Norwegian', native: 'Norsk' },
  cs: { name: 'Czech', native: 'Čeština' },
  ro: { name: 'Romanian', native: 'Română' },
  th: { name: 'Thai', native: 'ไทย' },
  vi: { name: 'Vietnamese', native: 'Tiếng Việt' },
  el: { name: 'Greek', native: 'Ελληνικά' },
  he: { name: 'Hebrew', native: 'עברית' },
};

function getLang() { return localStorage.getItem('st_lang') || 'en'; }
function setLang(l) { localStorage.setItem('st_lang', l); render(); }

function __(key) {
  const lang = getLang();
  const t = translations[lang];
  if (t && t[key] !== undefined) return t[key];
  // Fallback to English
  return translations.en[key] !== undefined ? translations.en[key] : key;
}

// Global UI labels (not info page content — those stay English as-is for now)
const translations = {
  en: {
    store: 'Store', dashboard: 'Dashboard', account: 'Account', logout: 'Logout',
    signIn: 'Sign In', signUp: 'Sign Up', cart: 'Cart', total: 'Total', checkout: 'Checkout',
    search: 'Search...', all: 'All', noProducts: 'No products', emptyCart: 'Empty',
    welcomeBack: 'Welcome back', signInTo: 'Sign in to your Stitched account',
    email: 'Email', password: 'Password', dontHaveAccount: "Don't have an account?",
    createAccount: 'Create account', joinStitched: 'Join Stitched for faster checkout',
    fullName: 'Full Name', alreadyHaveAccount: 'Already have an account?',
    yourOrders: 'Your Orders', noOrdersYet: 'No orders yet', startShopping: 'Start Shopping',
    orders: 'Orders', totalSpent: 'Total Spent', memberSince: 'Member Since',
    explore: 'Explore →', dashboardBtn: 'Dashboard',
    products: 'Products', featuredProducts: 'Featured Products',
    curatedCollection: 'Curated Collection',
    heroTitle: 'Products worth<br>sharing.',
    heroSub: 'A curated marketplace...',
    shipping: 'Shipping', payment: 'Payment', testMode: '🔒 Test mode — no real charges',
    card: 'Card', expiry: 'Expiry', address: 'Address',
    orderSummary: 'Order Summary', placeOrder: 'Pay',
    orderPlaced: 'Order Placed!', checkDashboard: 'Check Dashboard to fulfill.',
    continue: 'Continue', back: '← Back', empty: 'Empty',
    about: 'About', shippingReturns: 'Shipping & Returns', terms: 'Terms & Conditions',
    privacy: 'Privacy Policy', support: 'Support', allProducts: 'All Products',
    addToCart: 'Add to Cart', hi: 'Hi', productsLabel: 'Products',
    toFulfill: 'To Fulfill', noOrders: 'No orders yet',
    fillAllFields: 'Fill in all fields', invalidEmail: 'Invalid email or password',
    accountExists: 'An account with this email already exists',
    passwordMin: 'Password must be at least 6 characters',
    signedIn: 'Signed in ✓', accountCreated: 'Account created ✓',
    loggedOut: 'Logged out', added: 'Added ✓', deleted: 'Deleted',
    fulfilled: 'Fulfilled ✓', orderPlacedNotif: 'Order placed ✓',
    name: 'Name', price: 'Price', profit: 'Profit',
    addProduct: 'Add Product', newProduct: 'New Product',
    product: 'Product', cost: 'Cost', sell: 'Sell',
    imageUrl: 'Image URL', description: 'Description',
    supplierPrice: 'Supplier Price ($)', yourPrice: 'Your Price ($)',
    markFulfilled: 'Mark Fulfilled', revenue: 'Revenue',
    fillDetails: "Fill in all details",
    cartEmpty: 'Cart empty',
    browse: 'Browse',
    madeWithCare: 'Made with care.',
    rightsReserved: '© 2026 Stitched. All rights reserved.',
    contactEmail: 'contact@stitched.store',
    hours: 'Mon–Fri, 9AM–6PM',
  },
  es: {
    store: 'Tienda', dashboard: 'Panel', account: 'Cuenta', logout: 'Cerrar sesión',
    signIn: 'Iniciar sesión', signUp: 'Registrarse', cart: 'Carrito', total: 'Total', checkout: 'Pagar',
    search: 'Buscar...', all: 'Todo', noProducts: 'Sin productos', emptyCart: 'Vacío',
    welcomeBack: 'Bienvenido de nuevo', signInTo: 'Inicia sesión en tu cuenta Stitched',
    email: 'Correo', password: 'Contraseña', dontHaveAccount: '¿No tienes cuenta?',
    createAccount: 'Crear cuenta', joinStitched: 'Únete a Stitched para compras más rápidas',
    fullName: 'Nombre completo', alreadyHaveAccount: '¿Ya tienes cuenta?',
    yourOrders: 'Tus pedidos', noOrdersYet: 'Aún sin pedidos', startShopping: 'Empezar a comprar',
    orders: 'Pedidos', totalSpent: 'Gastado', memberSince: 'Miembro desde',
    explore: 'Explorar →', dashboardBtn: 'Panel',
    products: 'Productos', featuredProducts: 'Productos Destacados',
    curatedCollection: 'Colección Curada',
    heroTitle: 'Productos que<br>vale la pena compartir.',
    heroSub: 'Un mercado curado de productos auténticos. Navega, añade al carrito y gestiona todo desde un panel.',
    shipping: 'Envío', payment: 'Pago', testMode: '🔒 Modo prueba — sin cargos reales',
    card: 'Tarjeta', expiry: 'Vencimiento', address: 'Dirección',
    orderSummary: 'Resumen del pedido', placeOrder: 'Pagar',
    orderPlaced: '¡Pedido realizado!', checkDashboard: 'Revisa el Panel para gestionar.',
    continue: 'Continuar', back: '← Volver', empty: 'Vacío',
    about: 'Acerca de', shippingReturns: 'Envíos y Devoluciones', terms: 'Términos y Condiciones',
    privacy: 'Política de Privacidad', support: 'Soporte', allProducts: 'Todos los productos',
    addToCart: 'Añadir al carrito', hi: 'Hola', productsLabel: 'Productos',
    toFulfill: 'Pendientes', noOrders: 'Sin pedidos aún',
    fillAllFields: 'Completa todos los campos', invalidEmail: 'Correo o contraseña inválidos',
    accountExists: 'Ya existe una cuenta con este correo',
    passwordMin: 'La contraseña debe tener al menos 6 caracteres',
    signedIn: 'Sesión iniciada ✓', accountCreated: 'Cuenta creada ✓',
    loggedOut: 'Sesión cerrada', added: 'Añadido ✓', deleted: 'Eliminado',
    fulfilled: 'Completado ✓', orderPlacedNotif: 'Pedido realizado ✓',
    name: 'Nombre', price: 'Precio', profit: 'Ganancia',
    addProduct: '+ Añadir producto', newProduct: 'Nuevo Producto',
    product: 'Producto', cost: 'Costo', sell: 'Venta',
    imageUrl: 'URL de imagen', description: 'Descripción',
    supplierPrice: 'Precio proveedor ($)', yourPrice: 'Tu precio ($)',
    markFulfilled: 'Marcar completado', revenue: 'Ingresos',
    fillDetails: 'Completa todos los detalles',
    cartEmpty: 'Carrito vacío',
    browse: 'Explorar',
    madeWithCare: 'Hecho con cuidado.',
    rightsReserved: '© 2026 Stitched. Todos los derechos reservados.',
    contactEmail: 'contacto@stitched.store',
    hours: 'Lun–Vie, 9AM–6PM',
  },
  fr: {
    store: 'Boutique', dashboard: 'Tableau de bord', account: 'Compte', logout: 'Déconnexion',
    signIn: 'Connexion', signUp: "S'inscrire", cart: 'Panier', total: 'Total', checkout: 'Paiement',
    search: 'Rechercher...', all: 'Tout', noProducts: 'Aucun produit', emptyCart: 'Vide',
    welcomeBack: 'Bon retour', signInTo: 'Connectez-vous à votre compte Stitched',
    email: 'E-mail', password: 'Mot de passe', dontHaveAccount: 'Pas de compte ?',
    createAccount: 'Créer un compte', joinStitched: 'Rejoignez Stitched pour des achats plus rapides',
    fullName: 'Nom complet', alreadyHaveAccount: 'Déjà un compte ?',
    yourOrders: 'Vos commandes', noOrdersYet: 'Aucune commande', startShopping: 'Commencer',
    orders: 'Commandes', totalSpent: 'Dépensé', memberSince: 'Membre depuis',
    explore: 'Explorer →', dashboardBtn: 'Tableau de bord',
    products: 'Produits', featuredProducts: 'Produits vedettes',
    curatedCollection: 'Collection Curée',
    heroTitle: "Des produits qui<br>méritent d'être partagés.",
    heroSub: 'Un marché de produits authentiques. Parcourez, ajoutez au panier et gérez tout depuis un tableau de bord.',
    shipping: 'Expédition', payment: 'Paiement', testMode: '🔒 Mode test — sans frais réels',
    card: 'Carte', expiry: 'Expiration', address: 'Adresse',
    orderSummary: 'Résumé de la commande', placeOrder: 'Payer',
    orderPlaced: 'Commande passée !', checkDashboard: 'Vérifiez le tableau de bord.',
    continue: 'Continuer', back: '← Retour', empty: 'Vide',
    about: 'À propos', shippingReturns: 'Expédition & Retours', terms: 'CGV',
    privacy: 'Confidentialité', support: 'Support', allProducts: 'Tous les produits',
    addToCart: 'Ajouter au panier', hi: 'Bonjour', productsLabel: 'Produits',
    toFulfill: 'À traiter', noOrders: 'Aucune commande',
    fillAllFields: 'Remplissez tous les champs', invalidEmail: 'Email ou mot de passe invalide',
    accountExists: 'Un compte existe déjà avec cet email',
    passwordMin: 'Le mot de passe doit contenir au moins 6 caractères',
    signedIn: 'Connecté ✓', accountCreated: 'Compte créé ✓',
    loggedOut: 'Déconnecté', added: 'Ajouté ✓', deleted: 'Supprimé',
    fulfilled: 'Traité ✓', orderPlacedNotif: 'Commande passée ✓',
    name: 'Nom', price: 'Prix', profit: 'Bénéfice',
    addProduct: '+ Ajouter produit', newProduct: 'Nouveau produit',
    product: 'Produit', cost: 'Coût', sell: 'Vente',
    imageUrl: 'URL image', description: 'Description',
    supplierPrice: 'Prix fournisseur ($)', yourPrice: 'Votre prix ($)',
    markFulfilled: 'Marquer traité', revenue: 'Revenus',
    fillDetails: 'Remplissez tous les détails',
    cartEmpty: 'Panier vide',
    browse: 'Parcourir',
    madeWithCare: 'Fabriqué avec soin.',
    rightsReserved: '© 2026 Stitched. Tous droits réservés.',
    contactEmail: 'contact@stitched.store',
    hours: 'Lun–Ven, 9h–18h',
  },
  de: {
    store: 'Shop', dashboard: 'Dashboard', account: 'Konto', logout: 'Abmelden',
    signIn: 'Anmelden', signUp: 'Registrieren', cart: 'Warenkorb', total: 'Gesamt', checkout: 'Kasse',
    search: 'Suchen...', all: 'Alle', noProducts: 'Keine Produkte', emptyCart: 'Leer',
    welcomeBack: 'Willkommen zurück', signInTo: 'Melde dich bei deinem Stitched-Konto an',
    email: 'E-Mail', password: 'Passwort', dontHaveAccount: 'Noch kein Konto?',
    createAccount: 'Konto erstellen', joinStitched: 'Werde Mitglied für schnelleren Checkout',
    fullName: 'Vollständiger Name', alreadyHaveAccount: 'Bereits ein Konto?',
    yourOrders: 'Deine Bestellungen', noOrdersYet: 'Noch keine Bestellungen', startShopping: 'Einkaufen',
    orders: 'Bestellungen', totalSpent: 'Ausgegeben', memberSince: 'Mitglied seit',
    explore: 'Entdecken →', dashboardBtn: 'Dashboard',
    products: 'Produkte', featuredProducts: 'Empfohlene Produkte',
    curatedCollection: 'Kuratierte Kollektion',
    heroTitle: 'Produkte, die<br>man teilen möchte.',
    heroSub: 'Ein kuratierter Marktplatz. Stöbere, lege in den Warenkorb und verwalte alles über ein Dashboard.',
    shipping: 'Versand', payment: 'Zahlung', testMode: '🔒 Testmodus — keine echten Gebühren',
    card: 'Karte', expiry: 'Ablauf', address: 'Adresse',
    orderSummary: 'Bestellübersicht', placeOrder: 'Bezahlen',
    orderPlaced: 'Bestellung aufgegeben!', checkDashboard: 'Prüfe das Dashboard.',
    continue: 'Weiter', back: '← Zurück', empty: 'Leer',
    about: 'Über uns', shippingReturns: 'Versand & Retouren', terms: 'AGB',
    privacy: 'Datenschutz', support: 'Support', allProducts: 'Alle Produkte',
    addToCart: 'In den Warenkorb', hi: 'Hallo', productsLabel: 'Produkte',
    toFulfill: 'Ausstehend', noOrders: 'Keine Bestellungen',
    fillAllFields: 'Fülle alle Felder aus', invalidEmail: 'Ungültige E-Mail oder Passwort',
    accountExists: 'Ein Konto mit dieser E-Mail existiert bereits',
    passwordMin: 'Passwort muss mindestens 6 Zeichen haben',
    signedIn: 'Angemeldet ✓', accountCreated: 'Konto erstellt ✓',
    loggedOut: 'Abgemeldet', added: 'Hinzugefügt ✓', deleted: 'Gelöscht',
    fulfilled: 'Erledigt ✓', orderPlacedNotif: 'Bestellung aufgegeben ✓',
    name: 'Name', price: 'Preis', profit: 'Gewinn',
    addProduct: '+ Produkt hinzufügen', newProduct: 'Neues Produkt',
    product: 'Produkt', cost: 'Kosten', sell: 'Verkauf',
    imageUrl: 'Bild-URL', description: 'Beschreibung',
    supplierPrice: 'Lieferantenpreis ($)', yourPrice: 'Dein Preis ($)',
    markFulfilled: 'Als erledigt markieren', revenue: 'Einnahmen',
    fillDetails: 'Fülle alle Details aus',
    cartEmpty: 'Warenkorb leer',
    browse: 'Stöbern',
    madeWithCare: 'Mit Sorgfalt gemacht.',
    rightsReserved: '© 2026 Stitched. Alle Rechte vorbehalten.',
    contactEmail: 'contact@stitched.store',
    hours: 'Mo–Fr, 9–18 Uhr',
  },
  pt: {
    store: 'Loja', dashboard: 'Painel', account: 'Conta', logout: 'Sair',
    signIn: 'Entrar', signUp: 'Cadastrar', cart: 'Carrinho', total: 'Total', checkout: 'Finalizar',
    search: 'Buscar...', all: 'Tudo', noProducts: 'Sem produtos', emptyCart: 'Vazio',
    welcomeBack: 'Bem-vindo de volta', signInTo: 'Entre na sua conta Stitched',
    email: 'E-mail', password: 'Senha', dontHaveAccount: 'Não tem conta?',
    createAccount: 'Criar conta', joinStitched: 'Junte-se à Stitched para compras mais rápidas',
    fullName: 'Nome completo', alreadyHaveAccount: 'Já tem conta?',
    yourOrders: 'Seus pedidos', noOrdersYet: 'Nenhum pedido ainda', startShopping: 'Começar a comprar',
    orders: 'Pedidos', totalSpent: 'Total gasto', memberSince: 'Membro desde',
    explore: 'Explorar →', dashboardBtn: 'Painel',
    products: 'Produtos', featuredProducts: 'Produtos em Destaque',
    curatedCollection: 'Coleção Curada',
    heroTitle: 'Produtos que<br>vale a pena compartilhar.',
    heroSub: 'Um mercado selecionado. Navegue, adicione ao carrinho e gerencie tudo pelo painel.',
    shipping: 'Frete', payment: 'Pagamento', testMode: '🔒 Modo teste — sem cobranças reais',
    card: 'Cartão', expiry: 'Validade', address: 'Endereço',
    orderSummary: 'Resumo do pedido', placeOrder: 'Pagar',
    orderPlaced: 'Pedido realizado!', checkDashboard: 'Veja o Painel para gerenciar.',
    continue: 'Continuar', back: '← Voltar', empty: 'Vazio',
    about: 'Sobre', shippingReturns: 'Frete e Devoluções', terms: 'Termos e Condições',
    privacy: 'Privacidade', support: 'Suporte', allProducts: 'Todos os produtos',
    addToCart: 'Adicionar ao carrinho', hi: 'Olá', productsLabel: 'Produtos',
    toFulfill: 'Pendentes', noOrders: 'Nenhum pedido',
    fillAllFields: 'Preencha todos os campos', invalidEmail: 'E-mail ou senha inválidos',
    accountExists: 'Já existe uma conta com este e-mail',
    passwordMin: 'A senha deve ter pelo menos 6 caracteres',
    signedIn: 'Conectado ✓', accountCreated: 'Conta criada ✓',
    loggedOut: 'Desconectado', added: 'Adicionado ✓', deleted: 'Excluído',
    fulfilled: 'Concluído ✓', orderPlacedNotif: 'Pedido realizado ✓',
    name: 'Nome', price: 'Preço', profit: 'Lucro',
    addProduct: '+ Adicionar produto', newProduct: 'Novo Produto',
    product: 'Produto', cost: 'Custo', sell: 'Venda',
    imageUrl: 'URL da imagem', description: 'Descrição',
    supplierPrice: 'Preço fornecedor ($)', yourPrice: 'Seu preço ($)',
    markFulfilled: 'Marcar concluído', revenue: 'Receita',
    fillDetails: 'Preencha todos os detalhes',
    cartEmpty: 'Carrinho vazio',
    browse: 'Navegar',
    madeWithCare: 'Feito com cuidado.',
    rightsReserved: '© 2026 Stitched. Todos os direitos reservados.',
    contactEmail: 'contact@stitched.store',
    hours: 'Seg–Sex, 9h–18h',
  },
  zh: {
    store: '商店', dashboard: '仪表盘', account: '账户', logout: '退出登录',
    signIn: '登录', signUp: '注册', cart: '购物车', total: '总计', checkout: '结账',
    search: '搜索...', all: '全部', noProducts: '暂无商品', emptyCart: '购物车为空',
    welcomeBack: '欢迎回来', signInTo: '登录您的 Stitched 账户',
    email: '邮箱', password: '密码', dontHaveAccount: '没有账户？',
    createAccount: '创建账户', joinStitched: '加入 Stitched，享受更快的结账体验',
    fullName: '姓名', alreadyHaveAccount: '已有账户？',
    yourOrders: '我的订单', noOrdersYet: '暂无订单', startShopping: '开始购物',
    orders: '订单', totalSpent: '消费总额', memberSince: '注册时间',
    explore: '浏览 →', dashboardBtn: '仪表盘',
    products: '商品', featuredProducts: '精选商品',
    curatedCollection: '精选系列',
    heroTitle: '值得分享<br的好商品。',
    heroSub: '一个精选的正品市场。浏览、加入购物车、一切尽在仪表盘管理。',
    shipping: '配送', payment: '支付', testMode: '🔒 测试模式 — 不产生真实费用',
    card: '卡号', expiry: '有效期', address: '地址',
    orderSummary: '订单摘要', placeOrder: '付款',
    orderPlaced: '订单已提交！', checkDashboard: '查看仪表盘以管理。',
    continue: '继续', back: '← 返回', empty: '空',
    about: '关于我们', shippingReturns: '配送与退货', terms: '条款与条件',
    privacy: '隐私政策', support: '客服', allProducts: '全部商品',
    addToCart: '加入购物车', hi: '你好', productsLabel: '商品',
    toFulfill: '待处理', noOrders: '暂无订单',
    fillAllFields: '请填写所有字段', invalidEmail: '邮箱或密码错误',
    accountExists: '该邮箱已注册',
    passwordMin: '密码至少6个字符',
    signedIn: '登录成功 ✓', accountCreated: '账户创建成功 ✓',
    loggedOut: '已退出', added: '已添加 ✓', deleted: '已删除',
    fulfilled: '已完成 ✓', orderPlacedNotif: '订单已提交 ✓',
    name: '名称', price: '价格', profit: '利润',
    addProduct: '+ 添加商品', newProduct: '新商品',
    product: '商品', cost: '成本', sell: '售价',
    imageUrl: '图片链接', description: '描述',
    supplierPrice: '供货价 ($)', yourPrice: '售价 ($)',
    markFulfilled: '标记完成', revenue: '收入',
    fillDetails: '请填写所有详细信息',
    cartEmpty: '购物车为空',
    browse: '逛逛',
    madeWithCare: '用心打造。',
    rightsReserved: '© 2026 Stitched. 保留所有权利。',
    contactEmail: 'contact@stitched.store',
    hours: '周一至周五, 上午9点至下午6点',
  },
  ja: {
    store: 'ストア', dashboard: 'ダッシュボード', account: 'アカウント', logout: 'ログアウト',
    signIn: 'ログイン', signUp: '登録', cart: 'カート', total: '合計', checkout: 'チェックアウト',
    search: '検索...', all: 'すべて', noProducts: '商品がありません', emptyCart: '空',
    welcomeBack: 'おかえりなさい', signInTo: 'Stitchedアカウントにログイン',
    email: 'メール', password: 'パスワード', dontHaveAccount: 'アカウントをお持ちでない方',
    createAccount: 'アカウント作成', joinStitched: 'Stitchedでより速いチェックアウト',
    fullName: '氏名', alreadyHaveAccount: 'すでにアカウントをお持ちですか？',
    yourOrders: '注文履歴', noOrdersYet: '注文はまだありません', startShopping: '買い物を始める',
    orders: '注文', totalSpent: '支出合計', memberSince: '登録日',
    explore: '探索 →', dashboardBtn: 'ダッシュボード',
    products: '商品', featuredProducts: 'おすすめ商品',
    curatedCollection: 'キュレーションコレクション',
    heroTitle: 'シェアしたくなる<br>商品たち。',
    heroSub: '厳選された本物のマーケットプレイス。閲覧、カート、管理をすべて一つの画面で。',
    shipping: '配送', payment: '支払い', testMode: '🔒 テストモード — 実際の請求はありません',
    card: 'カード', expiry: '有効期限', address: '住所',
    orderSummary: '注文サマリー', placeOrder: '支払う',
    orderPlaced: 'ご注文完了！', checkDashboard: 'ダッシュボードでご確認ください。',
    continue: '続ける', back: '← 戻る', empty: '空',
    about: '概要', shippingReturns: '配送と返品', terms: '利用規約',
    privacy: 'プライバシーポリシー', support: 'サポート', allProducts: '全商品',
    addToCart: 'カートに入れる', hi: 'こんにちは', productsLabel: '商品',
    toFulfill: '未処理', noOrders: '注文なし',
    fillAllFields: 'すべての項目を入力してください', invalidEmail: 'メールまたはパスワードが無効です',
    accountExists: 'このメールアドレスは既に登録されています',
    passwordMin: 'パスワードは6文字以上必要です',
    signedIn: 'ログインしました ✓', accountCreated: 'アカウント作成完了 ✓',
    loggedOut: 'ログアウトしました', added: '追加しました ✓', deleted: '削除しました',
    fulfilled: '完了 ✓', orderPlacedNotif: '注文完了 ✓',
    name: '名前', price: '価格', profit: '利益',
    addProduct: '+ 商品追加', newProduct: '新規商品',
    product: '商品', cost: '原価', sell: '販売価格',
    imageUrl: '画像URL', description: '説明',
    supplierPrice: '仕入価格 ($)', yourPrice: '販売価格 ($)',
    markFulfilled: '完了にする', revenue: '売上',
    fillDetails: 'すべての詳細を入力してください',
    cartEmpty: 'カートは空です',
    browse: '見て回る',
    madeWithCare: '心を込めて。',
    rightsReserved: '© 2026 Stitched. All rights reserved.',
    contactEmail: 'contact@stitched.store',
    hours: '月–金, 9:00–18:00',
  },
};

const langArr = Object.entries(LANGUAGES);
function ls(key) { try { return localStorage.getItem('st_'+key); } catch { return null; } }
function lss(key, v) { try { localStorage.setItem('st_'+key, v); } catch {} }
function lsj(key, d) {
  try { const r = ls(key); return r ? JSON.parse(r) : d; } catch { return d; }
}
function lssj(key, v) { lss(key, JSON.stringify(v)); }

function notify(m) {
  let e = document.querySelector('.toast');
  if (!e) { e = document.createElement('div'); e.className='toast'; document.body.appendChild(e); }
  e.textContent = m; e.classList.add('show');
  setTimeout(() => e.classList.remove('show'), 3000);
}

function $(s, p) { return (p||document).querySelector(s); }
function $$(s, p) { return [...(p||document).querySelectorAll(s)]; }

// ─── API fetch helpers ────────────────────────────────────────────────
async function fetchJSON(url) {
  try { const r = await fetch(url); return r.ok ? await r.json() : null; }
  catch { return null; }
}

// Build a product from DummyJSON item with dropshipping pricing
function buildProduct(dj) {
  const catMap = {
    'beauty': 'Beauty', 'fragrances': 'Beauty',
    'furniture': 'Home', 'home-decoration': 'Home',
    'groceries': 'Groceries', 'snacks': 'Groceries',
    'electronics': 'Electronics', 'tablets': 'Electronics',
    'smartphones': 'Electronics', 'laptops': 'Electronics',
    'mobile-accessories': 'Accessories',
    'vehicle': 'Accessories', 'motorcycle': 'Accessories',
    'sports-accessories': 'Sports',
    'womens-dresses': 'Clothing', 'womens-shoes': 'Clothing',
    'mens-shirts': 'Clothing', 'mens-shoes': 'Clothing',
    'tops': 'Clothing', 'womens-bags': 'Accessories',
    'womens-watches': 'Accessories', 'mens-watches': 'Accessories',
    'sunglasses': 'Accessories', 'skin-care': 'Beauty',
  };
  const cat = catMap[dj.category] || 'Other';
  const supplierPrice = Math.round(dj.price * 0.4 * 100) / 100;
  const yourPrice = Math.round(dj.price * 1.0 * 100) / 100;
  return {
    id: 'dj_'+dj.id,
    name: dj.title.slice(0, 80),
    supplierPrice,
    yourPrice,
    description: dj.description,
    category: cat,
    supplier: 'AliExpress',
    image: dj.thumbnail,
    images: (dj.images||[dj.thumbnail]).filter(Boolean),
    rating: Math.round((dj.rating||4)*10)/10,
  };
}

// ─── Init ─────────────────────────────────────────────────────────────
async function init() {
  // Load saved state
  products = lsj('products', []);
  orders = lsj('orders', []);
  cart = lsj('cart', []);
  lastSync = ls('lastSync');

  // Try remote products.json (generated by GitHub Actions or embedded)
  let remote = await fetchJSON(DATA_URL);
  if (remote && Array.isArray(remote) && remote.length > 0) {
    products = remote;
    lssj('products', products);
    lastSync = new Date().toISOString();
    lss('lastSync', lastSync);
  }

  // If still empty, fetch from DummyJSON API directly (fallback)
  if (products.length === 0) {
    remote = await fetchJSON('https://dummyjson.com/products?limit=30');
    if (remote && remote.products) {
      products = remote.products.map(buildProduct);
      lssj('products', products);
    }
  }

  render();
}

// ─── Render ───────────────────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  app.innerHTML = '';

  // Topbar
    const h = document.createElement('header');
    h.className = 'topbar';
    const cc = cart.reduce((s,i) => s+i.qty, 0);
    const loggedIn = isLoggedIn();
    h.innerHTML = `<div class="topbar-inner">
      <button class="logo" onclick="nav('store')"><span class="logo-icon">🧵</span><span>Stitched<span class="logo-dot"></span></span></button>
      <nav class="nav">
        <button class="nav-btn ${currentPage==='store'?'active':''}" onclick="nav('store')">${__('store')}</button>
        <button class="nav-btn ${currentPage==='admin'?'active':''}" onclick="nav('admin')">${__('dashboard')}</button>
      </nav>
      <div style="display:flex;align-items:center;gap:8px">
        ${loggedIn
          ? `<button class="nav-btn" style="font-size:12px;display:flex;align-items:center;gap:4px" onclick="nav('account')">👤 ${currentUser?.name||'Account'}</button>
             <button class="nav-btn" style="font-size:12px;color:var(--text-muted)" onclick="doLogout()">${__('logout')}</button>`
          : `<button class="nav-btn" style="font-size:12px" onclick="nav('signin')">${__('signIn')}</button>
             <button class="btn-primary" style="padding:8px 18px;font-size:12px" onclick="nav('signup')">${__('signUp')}</button>`}
        <button class="cart-btn" onclick="cartOpen()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          ${__('cart')}
          <span class="cart-badge ${cc===0?'hidden':''}" id="cb">${cc}</span>
        </button>
        <select class="lang-sel" onchange="setLang(this.value)" title="Language">
          ${Object.entries(LANGUAGES).map(([k,v]) => `<option value="${k}" ${getLang()===k?'selected':''}>${v.native}</option>`).join('')}
        </select>
      </div>
    </div>`;

  // Chat bubble + panel
  const chatHTML = `
    <div id="chatBubble" class="chat-bubble" onclick="chatToggle()">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    </div>
    <div id="chatPanel" class="chat-panel">
      <div class="chat-h">
        <span>💬 AI Support</span>
        <button class="chat-close" onclick="chatToggle()">✕</button>
      </div>
      <div class="chat-msgs" id="chatMsgs"></div>
      <div class="chat-inp">
        <input type="text" id="chatInput" placeholder="Ask a question..." autocomplete="off">
        <button class="chat-send" onclick="chatSend()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>`;

  // Page
  const pg = document.createElement('div');
  pg.className = 'page';
  if (currentPage==='store') pg.appendChild(renderStore());
  else if (currentPage==='admin') pg.appendChild(renderDash());
  else if (currentPage==='checkout') pg.appendChild(renderCheckout());
  else if (currentPage==='product') pg.appendChild(renderProduct());
  else if (currentPage==='confirmed') pg.appendChild(renderConfirmed());
  else if (currentPage==='about') pg.appendChild(renderAbout());
  else if (currentPage==='terms') pg.appendChild(renderTerms());
  else if (currentPage==='privacy') pg.appendChild(renderPrivacy());
  else if (currentPage==='shipping') pg.appendChild(renderShipping());
  else if (currentPage==='signin') pg.appendChild(renderSignIn());
  else if (currentPage==='signup') pg.appendChild(renderSignUp());
  else if (currentPage==='account') pg.appendChild(renderAccount());

  // Footer
  const ft = document.createElement('footer');
  ft.style.cssText = 'background:#fff;border-top:1px solid var(--surface-border);padding:60px 24px 32px;margin-top:auto';
  ft.innerHTML = `<div style="max-width:1200px;margin:0 auto">
    <!-- Top row: brand + newsletter CTA -->
    <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:36px;border-bottom:1px solid var(--surface-border);margin-bottom:36px;flex-wrap:wrap;gap:16px">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="width:40px;height:40px;border-radius:var(--radius);background:var(--gradient-1);display:flex;align-items:center;justify-content:center;font-size:20px">🧵</span>
        <div><div style="font-family:var(--fd);font-size:18px;font-weight:700;letter-spacing:-0.02em">Stitched</div><div style="font-size:11px;color:var(--text-muted)">curated quality goods</div></div>
      </div>
      <div style="display:flex;gap:16px;align-items:center">
        <span style="font-size:12px;color:var(--text-secondary)">Free shipping on orders over $50</span>
        <div style="width:1px;height:20px;background:var(--surface-border)"></div>
        <span style="font-size:12px;color:var(--text-secondary)">30-day returns</span>
      </div>
    </div>
    <!-- Links grid -->
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1.2fr;gap:40px;margin-bottom:40px">
      <div>
        <p style="color:var(--text-secondary);font-size:13px;line-height:1.8;max-width:300px;margin-bottom:16px">${__('heroSub')}</p>
        <div style="display:flex;gap:10px">
          <span style="width:30px;height:30px;border-radius:50%;border:1px solid var(--surface-border);display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;transition:all .2s;color:var(--text-muted)" onclick="nav('about')" title="About">🛈</span>
          <span style="width:30px;height:30px;border-radius:50%;border:1px solid var(--surface-border);display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;transition:all .2s;color:var(--text-muted)" onclick="nav('shipping')" title="Shipping">📬</span>
          <span style="width:30px;height:30px;border-radius:50%;border:1px solid var(--surface-border);display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;transition:all .2s;color:var(--text-muted)" onclick="nav('terms')" title="Terms">📄</span>
        </div>
      </div>
      <div>
        <h4 style="font-family:var(--fd);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:14px">${__('store')}</h4>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="nav-btn" style="padding:4px 0;font-size:13px" onclick="nav('store')">${__('allProducts')}</button>
          <button class="nav-btn" style="padding:4px 0;font-size:13px" onclick="nav('store');setTimeout(()=>{const i=document.querySelector('#ss');if(i)i.focus()},100)">${__('search')}</button>
        </div>
      </div>
      <div>
        <h4 style="font-family:var(--fd);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:14px">Support</h4>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="nav-btn" style="padding:4px 0;font-size:13px" onclick="nav('about')">${__('about')}</button>
          <button class="nav-btn" style="padding:4px 0;font-size:13px" onclick="nav('shipping')">${__('shippingReturns')}</button>
          <button class="nav-btn" style="padding:4px 0;font-size:13px" onclick="nav('privacy')">${__('privacy')}</button>
          <button class="nav-btn" style="padding:4px 0;font-size:13px" onclick="nav('terms')">${__('terms')}</button>
        </div>
      </div>
      <div>
        <h4 style="font-family:var(--fd);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);margin-bottom:14px">Contact</h4>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-secondary)">
            <span style="font-size:14px">✉️</span>
            <a href="mailto:contact@stitched.store" style="color:var(--accent);text-decoration:none">contact@stitched.store</a>
          </div>
          <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-secondary)">
            <span style="font-size:14px">🕐</span>
            <span>${__('hours')}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-secondary)">
            <span style="font-size:14px">💬</span>
            <span style="cursor:pointer;color:var(--accent)" onclick="chatToggle()">Live chat</span>
          </div>
        </div>
      </div>
    </div>
    <!-- Bottom bar -->
    <div style="border-top:1px solid var(--surface-border);padding-top:20px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--text-muted);flex-wrap:wrap;gap:12px">
      <span>${__('rightsReserved')}</span>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--gradient-1)"></span>
        <span>${__('madeWithCare')}</span>
      </div>
    </div>
  </div>`;

  app.append(h, pg, ft);
  document.body.insertAdjacentHTML('beforeend', chatHTML);
  document.getElementById('cb') && (document.getElementById('cb').textContent=cc);
}

function nav(p) { currentPage=p; render(); }

function doLogout() { logout(); notify(__('loggedOut')); render(); }

// ─── Auth Pages ──────────────────────────────────────────────────────
function renderSignIn() {
  const p = document.createElement('div'); p.className = 'page';
  p.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:80vh;padding:24px';
  p.innerHTML = `<div style="background:#fff;border:1px solid var(--surface-border);border-radius:var(--radius-xl);padding:40px;max-width:400px;width:100%;box-shadow:var(--shadow-lg)">
    <div style="text-align:center;margin-bottom:24px">
      <span style="font-size:32px">🧵</span>
      <h2 style="font-family:var(--fd);font-size:22px;font-weight:700;margin:8px 0">${__('welcomeBack')}</h2>
      <p style="color:var(--text-secondary);font-size:13px">${__('signInTo')}</p>
    </div>
    <div class="ff"><label>${__('email')}</label><input type="email" id="siEmail" placeholder="${__('email')}"></div>
    <div class="ff"><label>Password</label><input type="password" id="siPass" placeholder="${__('password')}"></div>
    <button class="btn-primary" style="width:100%;margin-top:16px" onclick="doSignIn()">${__('signIn')}</button>
    <p style="text-align:center;font-size:12px;color:var(--text-muted);margin-top:16px">${__('dontHaveAccount')} <button class="nav-btn" style="padding:0;font-size:12px;color:var(--accent);display:inline" onclick="nav('signup')">${__('signUp')}</button></p>
  </div>`;
  return p;
}

function renderSignUp() {
  const p = document.createElement('div'); p.className = 'page';
  p.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:80vh;padding:24px';
  p.innerHTML = `<div style="background:#fff;border:1px solid var(--surface-border);border-radius:var(--radius-xl);padding:40px;max-width:400px;width:100%;box-shadow:var(--shadow-lg)">
    <div style="text-align:center;margin-bottom:24px">
      <span style="font-size:32px">🧵</span>
      <h2 style="font-family:var(--fd);font-size:22px;font-weight:700;margin:8px 0">Create account</h2>
      <p style="color:var(--text-secondary);font-size:13px">${__('joinStitched')}</p>
    </div>
    <div class="ff"><label>${__('fullName')}</label><input type="text" id="suName" placeholder="${__('fullName')}"></div>
    <div class="ff"><label>${__('email')}</label><input type="email" id="suEmail" placeholder="${__('email')}"></div>
    <div class="ff"><label>Password</label><input type="password" id="suPass" placeholder="${__('passwordMin')}"></div>
    <button class="btn-primary" style="width:100%;margin-top:16px" onclick="doSignUp()">${__('createAccount')}</button>
    <p style="text-align:center;font-size:12px;color:var(--text-muted);margin-top:16px">${__('alreadyHaveAccount')} <button class="nav-btn" style="padding:0;font-size:12px;color:var(--accent);display:inline" onclick="nav('signin')">Sign in</button></p>
  </div>`;
  return p;
}

function renderAccount() {
  if (!isLoggedIn()) { currentPage='signin'; return renderSignIn(); }
  const userOrders = orders.filter(o => o.customerEmail === currentUser.email);
  const p = document.createElement('div');
  p.style.cssText = 'padding:80px 24px;flex:1;max-width:800px;margin:0 auto;width:100%';
  p.innerHTML = `
    <div style="margin-bottom:32px">
      <h1 style="font-family:var(--fd);font-size:clamp(24px,3vw,32px);font-weight:700;letter-spacing:-0.02em">Hi, ${currentUser.name} 👋</h1>
      <p style="color:var(--text-secondary);font-size:13px;margin-top:4px">${currentUser.email}</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:32px">
      <div class="sc"><div class="scl">${__('orders')}</div><div class="scv">${userOrders.length}</div></div>
      <div class="sc"><div class="scl">${__('totalSpent')}</div><div class="scv">$${userOrders.reduce((s,o) => s+o.total, 0).toFixed(2)}</div></div>
      <div class="sc"><div class="scl">${__('memberSince')}</div><div class="scv" style="font-size:16px">${new Date(currentUser.created||Date.now()).toLocaleDateString()}</div></div>
    </div>
    <h3 style="font-family:var(--fd);font-size:16px;font-weight:600;margin-bottom:12px">${__('yourOrders')}</h3>
    ${userOrders.length === 0
      ? `<div class="empty-state" style="background:#fff;border:1px solid var(--surface-border);border-radius:var(--radius-xl);padding:40px"><span class="empty-state-icon">📋</span><p>${__('noOrders')}</p><button class="btn-primary" style="margin-top:12px" onclick="nav('store')">${__('startShopping')}</button></div>`
      : `<div class="ol">${userOrders.map(o => `
        <div class="oc ${o.status}">
          <div class="oh"><div><span class="oi">#${o.id.slice(0,8)}</span> <span class="os ${o.status}">${o.status}</span></div><span class="odate">${new Date(o.createdAt).toLocaleDateString()}</span></div>
          <div style="font-size:12px;color:var(--text-secondary);margin:6px 0">${o.items.map(i => `<div class="sum-item"><span>${i.name} × ${i.qty}</span><span>$${(i.price*i.qty).toFixed(2)}</span></div>`).join('')}</div>
          <div class="of"><span class="ot">$${o.total.toFixed(2)}</span></div>
        </div>`).join('')}</div>`}
  `;
  return p;
}

window.doSignIn = function() {
  const e = document.getElementById('siEmail')?.value;
  const p = document.getElementById('siPass')?.value;
  if (!e || !p) return notify(__('fillAllFields'));
  if (login(e, p)) { notify(__('signedIn')); render(); }
  else notify(__('invalidEmail'));
};

window.doSignUp = function() {
  const n = document.getElementById('suName')?.value;
  const e = document.getElementById('suEmail')?.value;
  const p = document.getElementById('suPass')?.value;
  if (!n || !e || !p) return notify(__('fillAllFields'));
  if (p.length < 6) return notify(__('passwordMin'));
  if (signup(n, e, p)) { notify(__('accountCreated')); render(); }
  else notify(__('accountExists'));
};

// ─── Info Pages ──────────────────────────────────────────────────────
function renderAbout() {
  const p = document.createElement('div');
  p.className = 'page';
  p.style.cssText = 'padding:80px 24px;flex:1';
  p.innerHTML = `<div style="max-width:720px;margin:0 auto">
    <button class="btn-secondary" style="margin-bottom:24px" onclick="nav('store')">${__('back')}</button>
    <h1 style="font-family:var(--fd);font-size:clamp(28px,4vw,40px);font-weight:700;letter-spacing:-0.03em;margin-bottom:24px">About Stitched</h1>
    <div style="background:#fff;border:1px solid var(--surface-border);border-radius:var(--radius-xl);padding:32px;box-shadow:var(--shadow-sm);line-height:1.8;color:var(--text-secondary)">
      <p style="margin-bottom:16px;color:var(--text);font-size:16px"><strong>Welcome to Stitched.</strong> We believe great products shouldn't be hard to find.</p>
      <p style="margin-bottom:16px">Stitched is a curated marketplace that brings together quality goods from trusted suppliers around the world. Every item in our catalog has been selected for its value, craftsmanship, and appeal — so you can shop with confidence.</p>
      <p style="margin-bottom:16px">Our model is simple: we partner with reliable suppliers, negotiate fair prices, and pass the savings on to you. No middlemen markups, no questionable listings — just products worth sharing.</p>
      <p style="margin-bottom:16px">We're a small team passionate about making online shopping straightforward and honest. If something doesn't feel right, reach out — we're here to help.</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:24px;padding-top:24px;border-top:1px solid var(--surface-border)">
        <div style="text-align:center"><div style="font-size:28px;margin-bottom:4px">🎯</div><div style="font-size:13px;font-weight:600;color:var(--text)">Curated</div><div style="font-size:12px;color:var(--text-muted)">Every product hand-picked</div></div>
        <div style="text-align:center"><div style="font-size:28px;margin-bottom:4px">🤝</div><div style="font-size:13px;font-weight:600;color:var(--text)">Trusted</div><div style="font-size:12px;color:var(--text-muted)">Reliable suppliers only</div></div>
        <div style="text-align:center"><div style="font-size:28px;margin-bottom:4px">💬</div><div style="font-size:13px;font-weight:600;color:var(--text)">${__('support')}</div><div style="font-size:12px;color:var(--text-muted)">We're here for you</div></div>
      </div>
    </div>
  </div>`;
  return p;
}

function renderTerms() {
  const p = document.createElement('div');
  p.className = 'page';
  p.style.cssText = 'padding:80px 24px;flex:1';
  p.innerHTML = `<div style="max-width:720px;margin:0 auto">
    <button class="btn-secondary" style="margin-bottom:24px" onclick="nav('store')">${__('back')}</button>
    <h1 style="font-family:var(--fd);font-size:clamp(28px,4vw,40px);font-weight:700;letter-spacing:-0.03em;margin-bottom:24px">${__('terms')}</h1>
    <div style="background:#fff;border:1px solid var(--surface-border);border-radius:var(--radius-xl);padding:32px;box-shadow:var(--shadow-sm);line-height:1.8;color:var(--text-secondary);font-size:13px">
      <p style="margin-bottom:16px"><strong>Last updated:</strong> July 2026</p>
      <h3 style="color:var(--text);margin:20px 0 8px;font-size:15px">1. Acceptance of Terms</h3>
      <p style="margin-bottom:12px">By accessing or using Stitched, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our service.</p>
      <h3 style="color:var(--text);margin:20px 0 8px;font-size:15px">2. Products & Pricing</h3>
      <p style="margin-bottom:12px">All product descriptions, images, and prices are provided for informational purposes. We make every effort to ensure accuracy, but we do not guarantee that product descriptions or prices are error-free. Prices are subject to change without notice.</p>
      <h3 style="color:var(--text);margin:20px 0 8px;font-size:15px">3. Orders & Payment</h3>
      <p style="margin-bottom:12px">When you place an order, you agree to provide accurate and complete information. Payment is due at the time of order. We reserve the right to refuse or cancel any order at our discretion.</p>
      <h3 style="color:var(--text);margin:20px 0 8px;font-size:15px">4. Shipping & Delivery</h3>
      <p style="margin-bottom:12px">Shipping times are estimates and not guaranteed. We are not responsible for delays caused by customs, carriers, or unforeseen circumstances. Risk of loss passes to you upon delivery to the carrier.</p>
      <h3 style="color:var(--text);margin:20px 0 8px;font-size:15px">5. Returns & Refunds</h3>
      <p style="margin-bottom:12px">Please refer to our Shipping & Returns policy for detailed information on returns and refunds. Generally, items may be returned within 30 days of delivery in unused condition.</p>
      <h3 style="color:var(--text);margin:20px 0 8px;font-size:15px">6. Limitation of Liability</h3>
      <p style="margin-bottom:12px">Stitched shall not be liable for any indirect, incidental, or consequential damages arising from your use of this service or any products purchased through it.</p>
      <h3 style="color:var(--text);margin:20px 0 8px;font-size:15px">7. Changes</h3>
      <p style="margin-bottom:12px">We reserve the right to update these terms at any time. Continued use after changes constitutes acceptance of the new terms.</p>
      <h3 style="color:var(--text);margin:20px 0 8px;font-size:15px">8. Contact</h3>
      <p>For questions about these terms, contact us at <strong>${__('contactEmail')}</strong>.</p>
    </div>
  </div>`;
  return p;
}

function renderPrivacy() {
  const p = document.createElement('div');
  p.className = 'page';
  p.style.cssText = 'padding:80px 24px;flex:1';
  p.innerHTML = `<div style="max-width:720px;margin:0 auto">
    <button class="btn-secondary" style="margin-bottom:24px" onclick="nav('store')">${__('back')}</button>
    <h1 style="font-family:var(--fd);font-size:clamp(28px,4vw,40px);font-weight:700;letter-spacing:-0.03em;margin-bottom:24px">${__('privacy')}</h1>
    <div style="background:#fff;border:1px solid var(--surface-border);border-radius:var(--radius-xl);padding:32px;box-shadow:var(--shadow-sm);line-height:1.8;color:var(--text-secondary);font-size:13px">
      <p style="margin-bottom:16px"><strong>Last updated:</strong> July 2026</p>
      <h3 style="color:var(--text);margin:20px 0 8px;font-size:15px">1. Information We Collect</h3>
      <p style="margin-bottom:12px">We collect information you provide when placing an order: your name, email address, shipping address, and payment details. We also collect anonymous usage data to improve our service.</p>
      <h3 style="color:var(--text);margin:20px 0 8px;font-size:15px">2. How We Use Your Information</h3>
      <p style="margin-bottom:12px">We use your information to process orders, communicate with you about your purchases, improve our store, and comply with legal obligations. We do not sell your personal information to third parties.</p>
      <h3 style="color:var(--text);margin:20px 0 8px;font-size:15px">3. Data Security</h3>
      <p style="margin-bottom:12px">We implement reasonable security measures to protect your information. However, no method of transmission over the Internet is 100% secure.</p>
      <h3 style="color:var(--text);margin:20px 0 8px;font-size:15px">4. Cookies</h3>
      <p style="margin-bottom:12px">We use minimal cookies necessary for the functioning of the store. You can control cookie preferences through your browser settings.</p>
      <h3 style="color:var(--text);margin:20px 0 8px;font-size:15px">5. Third Parties</h3>
      <p style="margin-bottom:12px">We may share your information with trusted third parties who help us process payments and deliver orders. These partners are bound by confidentiality agreements.</p>
      <h3 style="color:var(--text);margin:20px 0 8px;font-size:15px">6. Your Rights</h3>
      <p style="margin-bottom:12px">You have the right to access, correct, or delete your personal information. To exercise these rights, contact us at <strong>${__('contactEmail')}</strong>.</p>
      <h3 style="color:var(--text);margin:20px 0 8px;font-size:15px">7. Changes</h3>
      <p>We may update this policy. We will notify you of material changes via the website.</p>
    </div>
  </div>`;
  return p;
}

function renderShipping() {
  const p = document.createElement('div');
  p.className = 'page';
  p.style.cssText = 'padding:80px 24px;flex:1';
  p.innerHTML = `<div style="max-width:720px;margin:0 auto">
    <button class="btn-secondary" style="margin-bottom:24px" onclick="nav('store')">${__('back')}</button>
    <h1 style="font-family:var(--fd);font-size:clamp(28px,4vw,40px);font-weight:700;letter-spacing:-0.03em;margin-bottom:24px">${__('shippingReturns')}</h1>
    <div style="background:#fff;border:1px solid var(--surface-border);border-radius:var(--radius-xl);padding:32px;box-shadow:var(--shadow-sm);line-height:1.8;color:var(--text-secondary);font-size:13px">
      <h3 style="color:var(--text);margin:0 0 8px;font-size:15px">Shipping</h3>
      <p style="margin-bottom:12px">We offer worldwide shipping on all orders. Standard shipping takes 7–14 business days depending on your location. Express shipping options are available at checkout.</p>
      <p style="margin-bottom:16px"><strong>Free shipping</strong> on all orders over $50.</p>
      <h3 style="color:var(--text);margin:20px 0 8px;font-size:15px">Order Tracking</h3>
      <p style="margin-bottom:16px">Once your order ships, you'll receive a tracking number via email. You can check your order status anytime from your account or by contacting us.</p>
      <h3 style="color:var(--text);margin:20px 0 8px;font-size:15px">Returns</h3>
      <p style="margin-bottom:12px">We accept returns within <strong>30 days</strong> of delivery. Items must be unused and in original packaging. To initiate a return, email <strong>${__('contactEmail')}</strong> with your order number.</p>
      <h3 style="color:var(--text);margin:20px 0 8px;font-size:15px">Refunds</h3>
      <p style="margin-bottom:12px">Refunds are processed within 5–7 business days after we receive the returned item. The refund will be issued to the original payment method. Shipping costs are non-refundable.</p>
      <h3 style="color:var(--text);margin:20px 0 8px;font-size:15px">Damaged or Incorrect Items</h3>
      <p>If you receive a damaged or incorrect item, contact us within 48 hours of delivery. We'll arrange a replacement or full refund, including return shipping costs.</p>
    </div>
  </div>`;
  return p;
}

// ─── Store Page ──────────────────────────────────────────────────────
function renderStore() {
  const page = document.createElement('div');
  let search = '', cat = 'all';
  const cats = ['all',...new Set(products.map(p=>p.category))];

  function grid() {
    const g = page.querySelector('.pg');
    if (!g) return;
    const flt = products.filter(p => {
      if (cat!='all' && p.category!==cat) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    g.innerHTML = flt.length === 0
      ? `<div class="empty-state"><span class="empty-state-icon">📦</span><p>${__('noProducts')}</p></div>`
      : flt.map(p => `<div class="pc" onclick="navProduct('${p.id}')">
          <div class="pc-img">
            <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22><rect fill=%22%23f0efe8%22 width=%22300%22 height=%22300%22/><text fill=%22%23a8a7b2%22 font-size=%2240%22 x=%22150%22 y=%22160%22 text-anchor=%22middle%22>📦</text></svg>'">
            <button class="pc-quick-add" onclick="event.stopPropagation();addCart('${p.id}');this.innerHTML='✓';setTimeout(()=>this.innerHTML='+',800)" title="Add to cart">+</button>
          </div>
          <div class="pc-info">
            <span class="pc-cat">${p.category}</span>
            <h3 class="pc-name">${p.name}</h3>
            <p class="pc-desc">${(p.description||'').slice(0,60)}${(p.description||'').length>60?'…':''}</p>
            <div class="pc-row">
                <span class="pc-price">$${p.yourPrice.toFixed(2)}</span>
                ${p.rating ? `<span class="pc-rating">★ ${p.rating}</span>` : ''}
            </div>
          </div>
        </div>`).join('');
  }

  page.innerHTML = `
    <section class="hero">
      <div class="hero-badge"><span class="hero-badge-dot"></span> ${__('curatedCollection')}</div>
      <h1>${__('heroTitle')}</h1>
      <p class="hero-sub">${__('heroSub')}</p>
      <div class="hero-actions">
        <button class="btn-primary" onclick="nav('admin')">${__('dashboard')}</button>
        <button class="btn-secondary" onclick="document.querySelector('.sec')?.scrollIntoView({behavior:'smooth'})">${__('explore')}</button>
      </div>
      <div class="hero-stats">
        <div class="hero-stat"><div class="hero-stat-num">${products.length}</div><div class="hero-stat-label">${__('products')}</div></div>
        <div class="hero-stat"><div class="hero-stat-num">${orders.length}</div><div class="hero-stat-label">${__('orders')}</div></div>
      </div>
    </section>
    <section class="sec" style="padding:40px 24px 80px;max-width:1200px;margin:0 auto;width:100%">
      <div class="sec-h">
        <div>
          <div class="sec-label">${__('productsLabel')}</div>
          <h2 style="font-family:var(--fd);font-size:clamp(24px,3.5vw,36px);font-weight:700;letter-spacing:-0.03em">${__('featuredProducts')}</h2>
        </div>
        <div class="sec-ctrl">
          <div class="sw"><svg class="si" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input class="si-i" type="text" placeholder="${__('search')}" id="ss"></div>
          <div class="cf" id="cf">${cats.map(c=>`<button class="cf-btn ${c===cat?'active':''}" data-c="${c}">${c==='all'?'All':c}</button>`).join('')}</div>
        </div>
      </div>
      <div class="pg"></div>
    </section>`;

  grid();
  setTimeout(() => {
    const inp = page.querySelector('#ss');
    if (inp) inp.oninput = function() { search=this.value; grid(); };
    page.querySelectorAll('#cf .cf-btn').forEach(b => {
      b.onclick = function() {
        page.querySelectorAll('#cf .cf-btn').forEach(x => x.classList.remove('active'));
        this.classList.add('active'); cat = this.dataset.c; grid();
      };
    });
  }, 0);
  return page;
}

// ─── Product Detail Page ─────────────────────────────────────────────
function renderProduct() {
  const pid = sessionStorage.getItem('st_pid') || '';
  const p = products.find(x => x.id === pid);
  if (!p) { currentPage='store'; return renderStore(); }

  const page = document.createElement('div');
  page.className = 'page';
  page.style.padding = '40px 24px';

  const imgs = p.images || [p.image];
  page.innerHTML = `
    <div style="max-width:1000px;margin:0 auto;width:100%">
      <button class="btn-secondary" style="margin-bottom:24px" onclick="nav('store')">${__('back')}</button>
      <div class="pd-layout">
        <div class="pd-gallery">
          <div class="pd-main"><img src="${imgs[0]}" alt="${p.name}" id="pdMain" onerror="this.outerHTML='<div style=\\'height:400px;display:flex;align-items:center;justify-content:center;font-size:64px\\'>📦</div>'"></div>
          <div class="pd-thumbs">${imgs.slice(0,4).map((u,i) => `<img src="${u}" class="pd-thumb ${i===0?'active':''}" onclick="document.getElementById('pdMain').src=this.src;document.querySelectorAll('.pd-thumb').forEach(t=>t.classList.remove('active'));this.classList.add('active')">`).join('')}</div>
        </div>
        <div class="pd-info">
          <span class="pc-cat">${p.category}</span>
          <h1 class="pd-title">${p.name}</h1>
          ${p.rating ? `<div style="color:var(--accent);font-size:14px;margin:4px 0">★ ${p.rating} / 5</div>` : ''}
          <p class="pd-desc">${p.description}</p>
          <div class="pd-prices">
            <span class="pd-price">$${p.yourPrice.toFixed(2)}</span>
          </div>
          <button class="btn-primary" style="width:100%;margin-top:16px" onclick="addCart('${p.id}');nav('store')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            ${__('addToCart')} — $${p.yourPrice.toFixed(2)}
          </button>
        </div>
  </div>
  ${p.reviews && p.reviews.length > 0 ? `
  <div style="margin-top:40px;padding-top:32px;border-top:1px solid var(--surface-border)">
    <h3 style="font-family:var(--fd);font-size:18px;font-weight:600;margin-bottom:16px">Customer Reviews (${p.reviews.length})</h3>
    <div class="rv-grid">
      ${p.reviews.map(r => `
        <div class="rv-card">
          <div class="rv-h">
            <div class="rv-av">${r.name.charAt(0).toUpperCase()}</div>
            <div>
              <div class="rv-name">${r.name}</div>
              <div class="rv-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
            </div>
          </div>
          <p class="rv-text">${r.comment}</p>
        </div>
      `).join('')}
    </div>
  </div>` : ''}
</div>`;
  page.style.cssText += `padding:40px 24px;flex:1;max-width:1000px;margin:0 auto;width:100%`;
  return page;
}

function navProduct(id) { sessionStorage.setItem('st_pid', id); nav('product'); }

// ─── Cart ─────────────────────────────────────────────────────────────
function addCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const e = cart.find(i => i.id === id);
  if (e) e.qty++;
  else cart.push({ id, name: p.name, price: p.yourPrice, qty:1, image: p.image });
  lssj('cart', cart);
  notify(__('added'));
  const b = document.getElementById('cb');
  if (b) { const c = cart.reduce((s,i) => s+i.qty, 0); b.textContent = c; b.classList.toggle('hidden', c===0); }
}

function cartQty(id, d) {
  cart = cart.map(i => i.id===id ? {...i, qty: Math.max(0,i.qty+d)} : i).filter(i => i.qty>0);
  lssj('cart', cart);
  const ov = document.querySelector('.co');
  if (ov) { ov.remove(); cartOpen(); }
  render();
}

function cartOpen() {
  const e = document.querySelector('.co');
  if (e) { e.classList.toggle('open'); return; }
  const d = document.createElement('div');
  d.className = 'co open';
  const ct = cart.reduce((s,i) => s+i.price*i.qty, 0);
  d.innerHTML = `<div class="cp">
    <div class="cph"><h3>${__('cart')}</h3><button class="close-btn" onclick="cartClose()">✕</button></div>
    ${cart.length===0 ? '<div class="empty-state" style="padding:32px">Empty</div>' : `
      <div class="ci">${cart.map(i => `
        <div class="ci-row">
          <div class="ci-info">
            <img src="${i.image}" width="36" height="36" style="border-radius:6px;object-fit:cover">
            <div><div class="ci-name">${i.name}</div><div class="ci-p">$${i.price.toFixed(2)}</div></div>
          </div>
          <div class="ci-qty">
            <button class="qty-btn" onclick="cartQty('${i.id}',-1)">−</button>
            <span class="qty-n">${i.qty}</span>
            <button class="qty-btn" onclick="cartQty('${i.id}',1)">+</button>
          </div>
        </div>`).join('')}</div>
      <div class="ctot"><span>${__('total')}</span><span style="color:var(--accent)">$${ct.toFixed(2)}</span></div>
      <button class="btn-primary" style="width:100%" onclick="cartClose();nav('checkout')">${__('checkout')}</button>
    `}
  </div>`;
  d.onclick = function(ev) { if (ev.target===this) this.classList.remove('open'); };
  document.body.appendChild(d);
}
function cartClose() { document.querySelector('.co')?.classList.remove('open'); }

// ─── Checkout ─────────────────────────────────────────────────────────
function renderCheckout() {
  if (cart.length === 0) {
    const p = document.createElement('div');
    p.style.cssText='display:flex;align-items:center;justify-content:center;min-height:60vh';
    p.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🛒</span><h3 style="margin:8px 0;font-family:var(--fd)">${__('cartEmpty')}</h3><button class="btn-primary" onclick="nav('store')">${__('browse')}</button></div>`;
    return p;
  }
  const ct = cart.reduce((s,i) => s+i.price*i.qty, 0);
  const p = document.createElement('div'); p.className='checkout-page';
  p.innerHTML = `
    <div class="co-layout">
      <div class="co-form">
        <h2>${__('checkout')}</h2>
        <div class="sb"><h4>${__('shipping')}</h4>
          <div class="ff"><label>${__('fullName')}</label><input type="text" id="cn" value="${isLoggedIn()?currentUser.name:''}"></div>
          <div class="ff"><label>${__('email')}</label><input type="email" id="ce" value="${isLoggedIn()?currentUser.email:''}"></div>
          <div class="ff"><label>${__('address')}</label><textarea id="ca" rows="3"></textarea></div>
        </div>
        <div class="sb"><h4>${__('payment')}</h4><p class="pn">${__('testMode')}</p>
          <div class="ff"><label>${__('card')}</label><input type="text" inputmode="numeric" id="cc" placeholder="4242 4242 4242 4242" maxlength="19"></div>
          <div class="cr"><div class="ff"><label>${__('expiry')}</label><input type="text" inputmode="numeric" id="cex" placeholder="MM/YY" maxlength="5"></div>
          <div class="ff"><label>CVC</label><input type="text" inputmode="numeric" id="cvc" placeholder="123" maxlength="4"></div></div>
        </div>
        <button class="btn-primary" style="width:100%;padding:14px" onclick="placeOrder()" id="pb">${__('placeOrder')} $${ct.toFixed(2)}</button>
      </div>
      <div class="co-summary">
        <h4>${__('orderSummary')}</h4>
        ${cart.map(i => `<div class="sum-item"><span>${i.name} × ${i.qty}</span><span>$${(i.price*i.qty).toFixed(2)}</span></div>`).join('')}
        <div class="sum-total"><span>${__('total')}</span><span>$${ct.toFixed(2)}</span></div>
      </div>
    </div>`;
  return p;
}

function placeOrder() {
  const n = document.getElementById('cn')?.value;
  const e = document.getElementById('ce')?.value;
  const a = document.getElementById('ca')?.value;
  if (!n||!e||!a) return notify(__('fillDetails'));
  const btn = document.getElementById('pb');
  btn.disabled = true; btn.textContent = '⏳ Processing…';
  setTimeout(() => {
    const ct = cart.reduce((s,i) => s+i.price*i.qty, 0);
    orders.unshift({ id:crypto.randomUUID(), customerName:n, customerEmail:e, shippingAddress:a, items:[...cart], total:ct, status:'pending', createdAt:new Date().toISOString() });
    lssj('orders', orders);
    cart = []; lssj('cart', cart);
    nav('confirmed');
    notify(__('orderPlacedNotif'));
  }, 1200);
}

function renderConfirmed() {
  const p = document.createElement('div'); p.className='confirmed-page';
  p.innerHTML = `<div class="cc"><span class="confirmed-icon">✅</span><h2>${__('orderPlaced')}</h2><p>${__('checkDashboard')}</p><button class="btn-primary" onclick="nav('store')">${__('continue')}</button></div>`;
  return p;
}

// ─── Dashboard ────────────────────────────────────────────────────────
function renderDash() {
  const p = document.createElement('div'); p.className='dashboard';
  const pen = orders.filter(o => o.status === 'pending').length;
  const rev = orders.reduce((s,o) => s+o.total, 0);
  let tab = 'orders';

  function content() {
    const c = p.querySelector('.dbc');
    if (!c) return;
    if (tab === 'orders') {
      c.innerHTML = orders.length === 0
        ? `<div class="empty-state"><span class="empty-state-icon">📋</span><p>${__('noOrders')}</p></div>`
        : `<div class="ol">${orders.map(o => `
          <div class="oc ${o.status}">
            <div class="oh"><div><span class="oi">#${o.id.slice(0,8)}</span> <span class="os ${o.status}">${o.status}</span></div><span class="odate">${new Date(o.createdAt).toLocaleDateString()}</span></div>
            <div class="ocust">${o.customerName} · ${o.customerEmail}</div>
            <div class="oship">📍 ${o.shippingAddress}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin:6px 0">${o.items.map(i => `<div class="sum-item"><span>${i.name} × ${i.qty}</span><span>$${(i.price*i.qty).toFixed(2)}</span></div>`).join('')}</div>
            <div class="of"><span class="ot">$${o.total.toFixed(2)}</span>${o.status==='pending'?`<button class="fb" onclick="fulfill('${o.id}')">${__('markFulfilled')}</button>`:''}</div>
          </div>`).join('')}</div>`;
    } else {
      c.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <span style="font-size:13px;color:var(--text-secondary)">${products.length} products</span>
          <button class="btn-primary" style="padding:8px 18px;font-size:12px" onclick="showPF()">${__('addProduct')}</button>
        </div>
        <div id="pf" class="pf hidden">
          <h4>New Product</h4>
          <div class="fg"><div class="ff"><label>${__('name')}</label><input id="pfn"></div>
          <div class="ff"><label>Category</label><select id="pfc"><option>Electronics</option><option>Clothing</option><option>Home</option><option>Accessories</option><option>Beauty</option><option>Other</option></select></div>
          <div class="ff" style="grid-column:1/-1"><label>${__('imageUrl')}</label><input id="pfi" placeholder="https://..."></div>
          <div class="ff" style="grid-column:1/-1"><label>${__('description')}</label><input id="pfd"></div>
          <div class="ff"><label>${__('supplierPrice')}</label><input type="number" step="0.01" id="pfsp"></div>
          <div class="ff"><label>${__('yourPrice')}</label><input type="number" step="0.01" id="pfyp"></div></div>
          <button class="submit-btn" onclick="submitP()">${__('addProduct')}</button>
        </div>
        <div class="ptw"><table class="pt"><thead><tr><th>${__('product')}</th><th>${__('cost')}</th><th>${__('sell')}</th><th>${__('profit')}</th><th></th></tr></thead>
          <tbody>${products.map(p => {
            const profit = p.yourPrice - p.supplierPrice;
            return `<tr><td><div style="display:flex;align-items:center;gap:8px"><img src="${p.image}" width="32" height="32" style="border-radius:4px;object-fit:cover"><div><strong>${p.name}</strong><br><span style="font-size:11px;color:var(--text-muted)">${p.category}</span></div></div></td>
              <td>$${p.supplierPrice.toFixed(2)}</td>
              <td>$${p.yourPrice.toFixed(2)}</td>
              <td class="profit">+$${profit.toFixed(2)}</td>
              <td class="dc"><button class="db" onclick="delP('${p.id}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></td></tr>`;
          }).join('')}</tbody></table></div>`;
    }
  }

  p.innerHTML = `
    <div class="dh"><h2>${__('dashboard')}</h2>
      <div class="ds"><div class="sc"><div class="scl">${__('productsLabel')}</div><div class="scv">${products.length}</div></div>
      <div class="sc accent"><div class="scl">${__('revenue')}</div><div class="scv">$${rev.toFixed(2)}</div></div>
      <div class="sc"><div class="scl">${__('orders')}</div><div class="scv">${orders.length}</div></div>
      <div class="sc"><div class="scl">${__('toFulfill')}</div><div class="scv">${pen}</div></div></div>
      <div class="dt"><button class="dt-btn ${tab==='orders'?'active':''}" onclick="switchDT('orders')">${__('orders')}</button>
      <button class="dt-btn ${tab==='products'?'active':''}" onclick="switchDT('products')">${__('products')}</button></div>
    </div>
    <div class="dbc"></div>`;

  content();
  return p;
}

window.fulfill = function(id) {
  const o = orders.find(x => x.id === id);
  if (o) { o.status='fulfilled'; lssj('orders', orders); notify(__('fulfilled')); render(); }
};
window.switchDT = function(t) {
  const d = document.querySelector('.dashboard');
  if (!d) return;
  const c = d.querySelector('.dbc');
  if (!c) return;
  // Redraw
  render();
};
window.showPF = function() { document.getElementById('pf')?.classList.toggle('hidden'); };
window.submitP = function() {
  const n = document.getElementById('pfn')?.value;
  const yp = parseFloat(document.getElementById('pfyp')?.value);
  if (!n||!yp) return notify(__('fillAllFields'));
  products.push({
    id: crypto.randomUUID(), name: n, description: document.getElementById('pfd')?.value||'',
    category: document.getElementById('pfc')?.value||'Other', supplier: 'Manual',
    supplierPrice: parseFloat(document.getElementById('pfsp')?.value)||0,
    yourPrice: yp, image: document.getElementById('pfi')?.value||'', images: [],
  });
  lssj('products', products); notify(__('added')); render();
};
window.delP = function(id) {
  products = products.filter(p => p.id !== id);
  lssj('products', products); notify(__('deleted')); render();
};

// ─── Boot ─────────────────────────────────────────────────────────────
init();
