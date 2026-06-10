from django.core.management.base import BaseCommand
from django.db import transaction
from products.models import Category, Product, ProductIngredient


INGREDIENTS = [
    {"name": "Клубника",          "sku": "ING-STRAWBERRY"},
    {"name": "Шоколад",           "sku": "ING-CHOCOLATE"},
    {"name": "Тапиоки (жемчуг)", "sku": "ING-TAPIOCA"},
    {"name": "Шир (молоко)",      "sku": "ING-MILK"},
    {"name": "Кокосовое молоко",  "sku": "ING-COCONUT"},
    {"name": "Манго",             "sku": "ING-MANGO"},
    {"name": "Чай чёрный",        "sku": "ING-TEA-BLACK"},
    {"name": "Чай зелёный",       "sku": "ING-TEA-GREEN"},
    {"name": "Сахар",             "sku": "ING-SUGAR"},
    {"name": "Сливки",            "sku": "ING-CREAM"},
    {"name": "Матча",             "sku": "ING-MATCHA"},
    {"name": "Банан",             "sku": "ING-BANANA"},
]

PRODUCTS = [
    # (name, price, category_name, sku)
    ("Клубника в шоколаде",      18.00, "Десерты",    "PROD-STRAW-CHOC"),
    ("Bubble Tea классический",  35.00, "Bubble Tea", "PROD-BT-CLASSIC"),
    ("Bubble Tea клубничный",    38.00, "Bubble Tea", "PROD-BT-STRAW"),
    ("Bubble Tea манго",         38.00, "Bubble Tea", "PROD-BT-MANGO"),
    ("Bubble Tea кокосовый",     39.00, "Bubble Tea", "PROD-BT-COCO"),
    ("Bubble Tea матча",         42.00, "Bubble Tea", "PROD-BT-MATCHA"),
    ("Кофе американо",           25.00, "Напитки",    "PROD-COF-AMER"),
    ("Кофе капучино",            30.00, "Напитки",    "PROD-COF-CAP"),
    ("Банановый смузи",          28.00, "Напитки",    "PROD-SMOOTHIE-BAN"),
    ("Манго ласси",              30.00, "Напитки",    "PROD-LASSI-MANGO"),
]

# Рецептҳо: {sku маҳсулот: [(sku ингредиент, grам), ...]}
RECIPES = {
    "PROD-STRAW-CHOC":   [("ING-STRAWBERRY", 100), ("ING-CHOCOLATE", 50)],
    "PROD-BT-CLASSIC":   [("ING-TAPIOCA", 30), ("ING-MILK", 200), ("ING-TEA-BLACK", 150), ("ING-SUGAR", 20)],
    "PROD-BT-STRAW":     [("ING-TAPIOCA", 30), ("ING-MILK", 200), ("ING-TEA-BLACK", 100), ("ING-STRAWBERRY", 50), ("ING-SUGAR", 20)],
    "PROD-BT-MANGO":     [("ING-TAPIOCA", 30), ("ING-MILK", 150), ("ING-MANGO", 100), ("ING-SUGAR", 20)],
    "PROD-BT-COCO":      [("ING-TAPIOCA", 30), ("ING-COCONUT", 200), ("ING-TEA-GREEN", 100), ("ING-SUGAR", 15)],
    "PROD-BT-MATCHA":    [("ING-TAPIOCA", 30), ("ING-MILK", 200), ("ING-MATCHA", 10), ("ING-SUGAR", 20)],
    "PROD-COF-CAP":      [("ING-MILK", 150), ("ING-CREAM", 30), ("ING-SUGAR", 10)],
    "PROD-SMOOTHIE-BAN": [("ING-BANANA", 150), ("ING-MILK", 100), ("ING-SUGAR", 15)],
    "PROD-LASSI-MANGO":  [("ING-MANGO", 120), ("ING-MILK", 150), ("ING-SUGAR", 20)],
}


class Command(BaseCommand):
    help = "Базаро тоза карда, ингредиентҳо ва маҳсулотҳои намунавӣ илова мекунад"

    def handle(self, *args, **options):
        with transaction.atomic():
            self._clear()
            ing_map = self._create_ingredients()
            prod_map = self._create_products()
            self._create_recipes(ing_map, prod_map)

        self.stdout.write(self.style.SUCCESS("\n🎉 Тайёр! Барномаро оғоз кунед."))

    # ── тозакунӣ ────────────────────────────────────────────────
    def _clear(self):
        ProductIngredient.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()
        self.stdout.write(self.style.WARNING("🗑  База тоза шуд"))

    # ── ингредиентҳо ────────────────────────────────────────────
    def _create_ingredients(self):
        cat, _ = Category.objects.get_or_create(name="Ингредиентҳо")
        ing_map = {}
        for item in INGREDIENTS:
            p = Product.objects.create(
                name=item["name"],
                sku=item["sku"],
                price=0,
                category=cat,
                is_ingredient=True,
                is_active=True,
                stock_grams=0,
            )
            ing_map[item["sku"]] = p
            self.stdout.write(f"  🧪 Ингредиент: {p.name}")
        return ing_map

    # ── маҳсулотҳо ──────────────────────────────────────────────
    def _create_products(self):
        prod_map = {}
        for name, price, cat_name, sku in PRODUCTS:
            cat, _ = Category.objects.get_or_create(name=cat_name)
            p = Product.objects.create(
                name=name,
                sku=sku,
                price=price,
                category=cat,
                is_ingredient=False,
                is_active=True,
            )
            prod_map[sku] = p
            self.stdout.write(f"  🍹 Маҳсулот: {p.name} — {price} сом")
        return prod_map

    # ── рецептҳо ────────────────────────────────────────────────
    def _create_recipes(self, ing_map, prod_map):
        self.stdout.write("\n📋 Граммовка:")
        for prod_sku, recipe_lines in RECIPES.items():
            prod = prod_map.get(prod_sku)
            if not prod:
                continue
            for ing_sku, grams in recipe_lines:
                ing = ing_map.get(ing_sku)
                if not ing:
                    continue
                ProductIngredient.objects.create(product=prod, ingredient=ing, grams=grams)
            names = ", ".join(
                f"{ing_map[s].name} {g}г"
                for s, g in recipe_lines
                if s in ing_map
            )
            self.stdout.write(f"  {prod.name}: {names}")
