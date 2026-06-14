"""
Run with: python manage.py shell < seed_menu.py
Adds Bubble Tea menu categories and products.
"""
from products.models import Category, Product

MENU = [
    # ── КЛАССИК BUBBLE TEA ──────────────────────────────────────
    {
        "name": "Классик Bubble Tea",
        "category": "Классик",
        "price": 18,
        "description": "Чои классикӣ бо топпингҳои анъанавӣ",
        "ingredients": [
            {"name": "Чои сиёҳ", "amount": "300 мл"},
            {"name": "Шир", "amount": "50 мл"},
            {"name": "Шакар", "amount": "бо хоҳиш"},
            {"name": "Ях", "amount": "бо хоҳиш"},
            {"name": "Тапиока гӯй (Boba)", "amount": "50 гр"},
        ],
    },
    {
        "name": "Чои Сиёҳ Шир",
        "category": "Классик",
        "price": 16,
        "description": "Чои сиёҳ бо шир",
        "ingredients": [
            {"name": "Чои сиёҳ", "amount": "300 мл"},
            {"name": "Шир", "amount": "80 мл"},
            {"name": "Шакар", "amount": "бо хоҳиш"},
            {"name": "Ях", "amount": "бо хоҳиш"},
        ],
    },
    {
        "name": "Чои Сабз Шир",
        "category": "Классик",
        "price": 16,
        "description": "Чои сабз бо шир",
        "ingredients": [
            {"name": "Чои сабз (матча)", "amount": "300 мл"},
            {"name": "Шир", "amount": "80 мл"},
            {"name": "Шакар", "amount": "бо хоҳиш"},
            {"name": "Ях", "amount": "бо хоҳиш"},
        ],
    },
    {
        "name": "Тайвании Bubble Tea",
        "category": "Классик",
        "price": 20,
        "description": "Рецепти аслии Тайван",
        "ingredients": [
            {"name": "Чои сиёҳи пурқувват", "amount": "250 мл"},
            {"name": "Шири конденсатсионӣ", "amount": "40 мл"},
            {"name": "Тапиока гӯй", "amount": "60 гр"},
            {"name": "Ях", "amount": "бо хоҳиш"},
        ],
    },

    # ── ЧОИ МАТЧА ───────────────────────────────────────────────
    {
        "name": "Матча Латте",
        "category": "Матча",
        "price": 22,
        "description": "Матчаи японӣ бо шир",
        "ingredients": [
            {"name": "Матча порошок", "amount": "8 гр"},
            {"name": "Шири пурравған", "amount": "200 мл"},
            {"name": "Оби гарм", "amount": "50 мл"},
            {"name": "Шакар", "amount": "бо хоҳиш"},
            {"name": "Ях", "amount": "бо хоҳиш"},
        ],
    },
    {
        "name": "Матча Bubble Tea",
        "category": "Матча",
        "price": 24,
        "description": "Матча бо гӯйҳои тапиока",
        "ingredients": [
            {"name": "Матча порошок", "amount": "8 гр"},
            {"name": "Шири пурравған", "amount": "200 мл"},
            {"name": "Тапиока гӯй", "amount": "50 гр"},
            {"name": "Шакар", "amount": "бо хоҳиш"},
            {"name": "Ях", "amount": "бо хоҳиш"},
        ],
    },
    {
        "name": "Матча Кокос",
        "category": "Матча",
        "price": 24,
        "description": "Матча бо шири кокос",
        "ingredients": [
            {"name": "Матча порошок", "amount": "8 гр"},
            {"name": "Шири кокос", "amount": "200 мл"},
            {"name": "Шакар", "amount": "бо хоҳиш"},
            {"name": "Ях", "amount": "бо хоҳиш"},
        ],
    },

    # ── ЧОИ МЕВАГӢ ──────────────────────────────────────────────
    {
        "name": "Чои Клубника",
        "category": "Мевагӣ",
        "price": 20,
        "description": "Чои мевагии клубника",
        "ingredients": [
            {"name": "Чои сафед", "amount": "200 мл"},
            {"name": "Пюреи клубника", "amount": "80 мл"},
            {"name": "Шакар", "amount": "бо хоҳиш"},
            {"name": "Ях", "amount": "бо хоҳиш"},
            {"name": "Тапиока гӯй", "amount": "50 гр"},
        ],
    },
    {
        "name": "Чои Манго",
        "category": "Мевагӣ",
        "price": 20,
        "description": "Чои тропикии манго",
        "ingredients": [
            {"name": "Чои сафед", "amount": "200 мл"},
            {"name": "Пюреи манго", "amount": "80 мл"},
            {"name": "Шакар", "amount": "бо хоҳиш"},
            {"name": "Ях", "amount": "бо хоҳиш"},
            {"name": "Тапиока гӯй", "amount": "50 гр"},
        ],
    },
    {
        "name": "Чои Лимон",
        "category": "Мевагӣ",
        "price": 18,
        "description": "Чои тарозуи лимон",
        "ingredients": [
            {"name": "Чои сиёҳ", "amount": "250 мл"},
            {"name": "Шарбати лимон", "amount": "40 мл"},
            {"name": "Шакар", "amount": "бо хоҳиш"},
            {"name": "Ях", "amount": "бо хоҳиш"},
        ],
    },
    {
        "name": "Чои Личи",
        "category": "Мевагӣ",
        "price": 21,
        "description": "Чои муаттари личи",
        "ingredients": [
            {"name": "Чои сафед", "amount": "200 мл"},
            {"name": "Шарбати личи", "amount": "80 мл"},
            {"name": "Шакар", "amount": "бо хоҳиш"},
            {"name": "Ях", "amount": "бо хоҳиш"},
            {"name": "Тапиока гӯй", "amount": "50 гр"},
        ],
    },
    {
        "name": "Чои Тарбуз",
        "category": "Мевагӣ",
        "price": 19,
        "description": "Чои тарбузи тобистона",
        "ingredients": [
            {"name": "Чои сафед", "amount": "200 мл"},
            {"name": "Пюреи тарбуз", "amount": "80 мл"},
            {"name": "Шакар", "amount": "бо хоҳиш"},
            {"name": "Ях", "amount": "бо хоҳиш"},
        ],
    },

    # ── ШИРИ (МОЛОЧНЫЕ) ─────────────────────────────────────────
    {
        "name": "Шоколадии Шир Bubble Tea",
        "category": "Шири",
        "price": 22,
        "description": "Нӯшокии шоколадии шир",
        "ingredients": [
            {"name": "Шири пурравған", "amount": "200 мл"},
            {"name": "Шоколади порошок", "amount": "20 гр"},
            {"name": "Шакар", "amount": "бо хоҳиш"},
            {"name": "Ях", "amount": "бо хоҳиш"},
            {"name": "Тапиока гӯй", "amount": "50 гр"},
        ],
    },
    {
        "name": "Карамел Шир",
        "category": "Шири",
        "price": 22,
        "description": "Шири карамелдор",
        "ingredients": [
            {"name": "Шири пурравған", "amount": "200 мл"},
            {"name": "Сиропи карамел", "amount": "30 мл"},
            {"name": "Ях", "amount": "бо хоҳиш"},
            {"name": "Тапиока гӯй", "amount": "50 гр"},
        ],
    },
    {
        "name": "Ванили Шир",
        "category": "Шири",
        "price": 20,
        "description": "Шири ванилии нарм",
        "ingredients": [
            {"name": "Шири пурравған", "amount": "200 мл"},
            {"name": "Сиропи ваниль", "amount": "20 мл"},
            {"name": "Ях", "amount": "бо хоҳиш"},
            {"name": "Тапиока гӯй", "amount": "50 гр"},
        ],
    },
    {
        "name": "Кокос Шир",
        "category": "Шири",
        "price": 23,
        "description": "Шири тропикии кокос",
        "ingredients": [
            {"name": "Шири кокос", "amount": "150 мл"},
            {"name": "Шири пурравған", "amount": "100 мл"},
            {"name": "Шакар", "amount": "бо хоҳиш"},
            {"name": "Ях", "amount": "бо хоҳиш"},
            {"name": "Тапиока гӯй", "amount": "50 гр"},
        ],
    },

    # ── SMOOTHIE ────────────────────────────────────────────────
    {
        "name": "Smoothie Клубника-Банан",
        "category": "Smoothie",
        "price": 25,
        "description": "Smoothie-и меваи тоза",
        "ingredients": [
            {"name": "Клубника тоза", "amount": "100 гр"},
            {"name": "Банан", "amount": "1 дона"},
            {"name": "Шири пурравған", "amount": "150 мл"},
            {"name": "Ях", "amount": "100 гр"},
            {"name": "Асал", "amount": "бо хоҳиш"},
        ],
    },
    {
        "name": "Smoothie Манго-Ананас",
        "category": "Smoothie",
        "price": 26,
        "description": "Smoothie-и тропикӣ",
        "ingredients": [
            {"name": "Манго тоза/ях", "amount": "100 гр"},
            {"name": "Ананас", "amount": "80 гр"},
            {"name": "Оби кокос", "amount": "100 мл"},
            {"name": "Ях", "amount": "100 гр"},
        ],
    },
    {
        "name": "Smoothie Кукча Тарбуз",
        "category": "Smoothie",
        "price": 22,
        "description": "Smoothie-и тарбузи тоза",
        "ingredients": [
            {"name": "Тарбуз тоза", "amount": "200 гр"},
            {"name": "Ях", "amount": "100 гр"},
            {"name": "Шарбати лимон", "amount": "15 мл"},
            {"name": "Асал", "amount": "бо хоҳиш"},
        ],
    },

    # ── ТОППИНГҲО (отдельно) ────────────────────────────────────
    {
        "name": "Тапиока гӯй (Boba) иловагӣ",
        "category": "Топпингҳо",
        "price": 4,
        "description": "Тапиока иловагӣ",
        "ingredients": [
            {"name": "Тапиока гӯй", "amount": "50 гр"},
        ],
    },
    {
        "name": "Желе иловагӣ",
        "category": "Топпингҳо",
        "price": 3,
        "description": "Желе алоэ ё кокос",
        "ingredients": [
            {"name": "Желе", "amount": "50 гр"},
        ],
    },
    {
        "name": "Пудинги тухм иловагӣ",
        "category": "Топпингҳо",
        "price": 5,
        "description": "Пудинги тухми мурғ",
        "ingredients": [
            {"name": "Пудинги тухм", "amount": "1 дона"},
        ],
    },
]

created_cats = 0
updated_cats = 0
created_products = 0
updated_products = 0

for item in MENU:
    cat_name = item["category"]
    cat, cat_created = Category.objects.get_or_create(name=cat_name)
    if cat_created:
        created_cats += 1
    else:
        updated_cats += 1

    prod, prod_created = Product.objects.get_or_create(
        name=item["name"],
        defaults={
            "category": cat,
            "price": item["price"],
            "description": item.get("description", ""),
            "ingredients_text": item["ingredients"],
            "is_active": True,
            "is_ingredient": False,
            "stock_quantity": 999,
        }
    )
    if not prod_created:
        prod.category = cat
        prod.price = item["price"]
        prod.description = item.get("description", "")
        prod.ingredients_text = item["ingredients"]
        prod.is_active = True
        prod.is_ingredient = False
        prod.save()
        updated_products += 1
    else:
        created_products += 1

print(f"Categories: {created_cats} created, {updated_cats} updated")
print(f"Products:   {created_products} created, {updated_products} updated")
print("Done!")
