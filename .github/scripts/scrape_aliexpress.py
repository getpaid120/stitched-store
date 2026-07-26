"""
Fetch real product data from DummyJSON API (free, no key needed).
Maps categories to dropshipping-friendly categories.
Outputs: products.json with real images and descriptions.
"""
import json, os, re, urllib.request, ssl

LIMIT = 30
OUTPUT = 'products.json'

CAT_MAP = {
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
}

def build_product(dj):
    cat = CAT_MAP.get(dj.get('category',''), 'Other')
    sp = round(dj['price'] * 0.4, 2)
    yp = round(dj['price'] * 1.0, 2)
    return {
        'id': 'dj_'+str(dj['id']),
        'name': dj['title'][:80],
        'supplierPrice': sp,
        'yourPrice': yp,
        'description': dj.get('description',''),
        'category': cat,
        'supplier': 'AliExpress',
        'image': dj.get('thumbnail',''),
        'images': [u for u in (dj.get('images') or [dj.get('thumbnail','')]) if u],
        'rating': round((dj.get('rating',0) or 0)*10)/10,
    }

def main():
    url = f'https://dummyjson.com/products?limit={LIMIT}'
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    print(f"Fetching {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Stitched/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=30, context=ctx) as r:
            data = json.loads(r.read().decode())
    except Exception as e:
        print(f"Error: {e}")
        # Fallback seeds
        data = {'products': []}

    products = [build_product(p) for p in (data.get('products',[]) if isinstance(data,dict) else data)]
    print(f"Got {len(products)} products")

    with open(OUTPUT, 'w') as f:
        json.dump(products, f, indent=2)
    print(f"Written to {OUTPUT}")

if __name__ == '__main__':
    main()
