"""
Scrape AliExpress search results for dropshipping product data.
Extracts product info from the embedded JSON in search pages.
Outputs: products.json (list of products with supplier pricing)

Uses only stdlib (urllib) — no pip dependencies needed for GitHub Actions.
"""
import json, os, re, sys, urllib.request, ssl
from urllib.parse import quote

KEYWORDS = os.environ.get('KEYWORDS', 'wireless earbuds,led desk lamp,bluetooth speaker,phone stand,water bottle,hoodie')
MAX_PRODUCTS = 30
OUTPUT_FILE = 'products.json'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'DNT': '1',
}

CATEGORY_MAP = {
    'earbuds': 'Electronics', 'earphone': 'Electronics', 'headphone': 'Electronics',
    'speaker': 'Electronics', 'bluetooth': 'Electronics', 'charger': 'Electronics',
    'cable': 'Electronics', 'phone': 'Electronics', 'drone': 'Electronics',
    'lamp': 'Home', 'light': 'Home', 'home': 'Home', 'kitchen': 'Home',
    'decor': 'Home', 'storage': 'Home', 'organizer': 'Home', 'cushion': 'Home',
    'hoodie': 'Clothing', 'shirt': 'Clothing', 'dress': 'Clothing', 'jacket': 'Clothing',
    'pants': 'Clothing', 'socks': 'Clothing', 'shoe': 'Clothing', 'bag': 'Accessories',
    'watch': 'Accessories', 'bracelet': 'Accessories', 'necklace': 'Accessories',
    'ring': 'Accessories', 'belt': 'Accessories', 'wallet': 'Accessories',
    'sunglasses': 'Accessories', 'hat': 'Accessories', 'scarf': 'Accessories',
}

EMOJI_MAP = {
    'Electronics': '🎧', 'Home': '💡', 'Clothing': '👕', 'Accessories': '⌚',
}

GRADIENT_MAP = {
    'Electronics': '#1a1a3e,#0d0d1e',
    'Home': '#1a3a1a,#0d1e0d',
    'Clothing': '#3a2a1a,#1e150d',
    'Accessories': '#1a2a3e,#0d1520',
}

def guess_category(title):
    t = title.lower()
    for kw, cat in CATEGORY_MAP.items():
        if kw in t:
            return cat
    return 'Electronics'

def fetch_url(url):
    """Fetch a URL with standard headers, return text."""
    req = urllib.request.Request(url, headers=HEADERS)
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    try:
        with urllib.request.urlopen(req, timeout=20, context=ctx) as resp:
            return resp.read().decode('utf-8', errors='replace')
    except Exception as e:
        print(f"  ✗ HTTP error: {e}")
        return ''

def extract_search_products(html):
    """Extract product data from AliExpress search page HTML."""
    products = []
    
    # Method 1: Try to find `window.runParams` with product data
    # AliExpress stores product data in a script tag as JSON
    m = re.search(r'window\.runParams\s*=\s*({.*?});', html, re.DOTALL)
    if m:
        try:
            data = json.loads(m.group(1))
            # Navigate to find product list
            items = data
            # Try common keys for product lists
            for path_key in ['items', 'products', 'itemListElement', 'list', 'data']:
                if isinstance(items, dict) and path_key in items:
                    items = items[path_key]
                    break
            
            if isinstance(items, list):
                for item in items:
                    if not isinstance(item, dict):
                        continue
                    
                    # Extract title
                    title = ''
                    if 'title' in item:
                        t = item['title']
                        if isinstance(t, dict):
                            title = t.get('displayTitle', '') or t.get('title', '') or t.get('value', '')
                        else:
                            title = str(t)
                    
                    # Extract price
                    price = 0.0
                    if 'prices' in item:
                        pdata = item['prices']
                        if isinstance(pdata, dict):
                            for pkey in ['salePrice', 'originalPrice', 'price']:
                                if pkey in pdata:
                                    sub = pdata[pkey]
                                    if isinstance(sub, dict):
                                        price = float(sub.get('minPrice', 0) or sub.get('price', 0) or 0)
                                    else:
                                        try: price = float(sub)
                                        except: pass
                                    if price > 0:
                                        break
                    elif 'price' in item:
                        try: price = float(item['price'])
                        except: pass
                    
                    pid = str(item.get('productId', '') or item.get('id', '') or '')
                    
                    if title and price > 0:
                        category = guess_category(title)
                        supplier_price = round(price * 0.4, 2)
                        your_price = round(price, 2)
                        products.append({
                            'id': f'ae_{pid}' if pid else f'ae_{hash(title) % 100000}',
                            'name': title[:80],
                            'supplierPrice': supplier_price,
                            'yourPrice': your_price,
                            'description': title[:120],
                            'category': category,
                            'supplier': 'AliExpress',
                            'emoji': EMOJI_MAP.get(category, '📦'),
                            'gradient': GRADIENT_MAP.get(category, '#1a1a2e,#0a0a14'),
                        })
        except json.JSONDecodeError:
            pass
    
    # Method 2: Try structured data (ld+json)
    if not products:
        schema_match = re.search(
            r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',
            html, re.DOTALL
        )
        if schema_match:
            try:
                schema = json.loads(schema_match.group(1))
                items = []
                if isinstance(schema, dict) and 'itemListElement' in schema:
                    items = schema['itemListElement']
                elif isinstance(schema, list):
                    items = schema
                
                for item in items:
                    if not isinstance(item, dict):
                        continue
                    if isinstance(item.get('item'), dict):
                        item = item['item']
                    
                    title = item.get('name', '')
                    price_str = ''
                    if 'offers' in item:
                        offers = item['offers']
                        if isinstance(offers, dict):
                            price_str = str(offers.get('price', ''))
                        elif isinstance(offers, list) and len(offers) > 0:
                            price_str = str(offers[0].get('price', ''))
                    
                    try:
                        price = float(re.sub(r'[^0-9.]', '', price_str))
                    except:
                        continue
                    
                    if title and price > 0:
                        category = guess_category(title)
                        products.append({
                            'id': f'ae_ld_{hash(title) % 100000}',
                            'name': title[:80],
                            'supplierPrice': round(price * 0.4, 2),
                            'yourPrice': round(price, 2),
                            'description': title[:120],
                            'category': category,
                            'supplier': 'AliExpress',
                            'emoji': EMOJI_MAP.get(category, '📦'),
                            'gradient': GRADIENT_MAP.get(category, '#1a1a2e,#0a0a14'),
                        })
            except json.JSONDecodeError:
                pass
    
    return products

def main():
    keywords = [k.strip() for k in KEYWORDS.split(',') if k.strip()]
    print(f"🔍 Scraping AliExpress for: {', '.join(keywords)}")
    
    all_products = []
    seen_ids = set()
    
    for keyword in keywords:
        print(f"  Searching '{keyword}'...")
        url = f'https://www.aliexpress.com/w/wholesale-{quote(keyword)}.html?g=y&SearchText={quote(keyword)}'
        html = fetch_url(url)
        
        if html:
            products = extract_search_products(html)
            for p in products:
                if p['id'] not in seen_ids:
                    seen_ids.add(p['id'])
                    all_products.append(p)
            print(f"    → Found {len(products)} products ({len(all_products)} unique so far)")
        else:
            print(f"    ✗ No data returned")
        
        if len(all_products) >= MAX_PRODUCTS:
            break
    
    # Fallback: if scraping fails, use seed products
    if not all_products:
        print("⚠️  Scraping returned no products. Using seed data.")
        all_products = get_seed_products()
    
    # Trim to max
    all_products = all_products[:MAX_PRODUCTS]
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(all_products, f, indent=2)
    
    print(f"\n✅ Written {len(all_products)} products to {OUTPUT_FILE}")

def get_seed_products():
    """Fallback seed products when scraping is blocked."""
    return [
        {"id":"ae_1","name":"Wireless Earbuds Pro","supplierPrice":12.50,"yourPrice":29.99,"description":"Premium wireless earbuds with active noise cancellation and 24hr battery","category":"Electronics","supplier":"AliExpress","emoji":"🎧","gradient":"#1a1a3e,#0d0d1e"},
        {"id":"ae_2","name":"LED Desk Lamp","supplierPrice":8.75,"yourPrice":24.99,"description":"Touch control desk lamp with 3 brightness levels and USB charging","category":"Home","supplier":"AliExpress","emoji":"💡","gradient":"#1a3a1a,#0d1e0d"},
        {"id":"ae_3","name":"Bluetooth 5.3 Speaker","supplierPrice":10.00,"yourPrice":34.99,"description":"Portable waterproof speaker with deep bass and 12hr playtime","category":"Electronics","supplier":"AliExpress","emoji":"🔊","gradient":"#2a1a3e,#150d20"},
        {"id":"ae_4","name":"20000mAh Power Bank","supplierPrice":7.50,"yourPrice":22.99,"description":"Fast charging portable power bank with dual USB output","category":"Electronics","supplier":"AliExpress","emoji":"🔋","gradient":"#1a2a3e,#0d1520"},
        {"id":"ae_5","name":"Fitness Smart Watch","supplierPrice":9.00,"yourPrice":27.99,"description":"Heart rate monitor, step counter, sleep tracking, IP68 waterproof","category":"Accessories","supplier":"AliExpress","emoji":"⌚","gradient":"#2a1a3e,#150d20"},
        {"id":"ae_6","name":"Slim Phone Case","supplierPrice":2.00,"yourPrice":8.99,"description":"Minimalist shockproof case, precise cutouts, available for all models","category":"Accessories","supplier":"AliExpress","emoji":"📱","gradient":"#1a2a3e,#0d1520"},
        {"id":"ae_7","name":"Cotton Casual T-Shirt","supplierPrice":4.50,"yourPrice":16.99,"description":"Soft breathable cotton tee, relaxed fit, multiple colors available","category":"Clothing","supplier":"AliExpress","emoji":"👕","gradient":"#3a2a1a,#1e150d"},
        {"id":"ae_8","name":"RGB LED Strip 5M","supplierPrice":3.80,"yourPrice":13.99,"description":"Color changing LED strip lights with remote, music sync mode","category":"Home","supplier":"AliExpress","emoji":"✨","gradient":"#1a3a1a,#0d1e0d"},
        {"id":"ae_9","name":"Wireless Charger Pad","supplierPrice":4.00,"yourPrice":12.99,"description":"Qi fast wireless charging pad, compatible with all phones","category":"Electronics","supplier":"AliExpress","emoji":"⚡","gradient":"#1a2a3e,#0d1520"},
        {"id":"ae_10","name":"Bamboo Phone Stand","supplierPrice":2.50,"yourPrice":9.99,"description":"Adjustable eco-friendly bamboo stand, foldable and portable","category":"Accessories","supplier":"AliExpress","emoji":"🎋","gradient":"#2a3a1a,#15200d"},
    ]

if __name__ == '__main__':
    main()
