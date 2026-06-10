"""
Management command: python manage.py seed_iphones
Adds iPhone X–17 products with images to the database.
"""
import os
from django.core.management.base import BaseCommand
from django.core.files import File
from products.models import Category, Product

BASE_MEDIA = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))),
    'media', 'products'
)

IPHONES = [
    # (name, price_tjs, image_file, stock_qty, sku)
    ("iPhone X",          2500,  "iphone_x.png",          5,  "IPH-X"),
    ("iPhone XR",         3000,  "iphone_xr.jpg",         5,  "IPH-XR"),
    ("iPhone XS",         3500,  "iphone_xs.jpg",         3,  "IPH-XS"),
    ("iPhone 11",         4500,  "iphone_11.jpg",         8,  "IPH-11"),
    ("iPhone 11 Pro",     5500,  "iphone_11_pro.jpg",     5,  "IPH-11P"),
    ("iPhone 12",         6000,  "iphone_12.jpg",         7,  "IPH-12"),
    ("iPhone 12 Pro",     7500,  "iphone_12_pro.jpg",     4,  "IPH-12P"),
    ("iPhone 13",         7000,  "iphone_13.jpg",         10, "IPH-13"),
    ("iPhone 13 Pro",     8500,  "iphone_13_pro.jpg",     6,  "IPH-13P"),
    ("iPhone 14",         9000,  "iphone_14.jpg",         8,  "IPH-14"),
    ("iPhone 14 Plus",    9500,  "iphone_14_plus.jpg",    5,  "IPH-14+"),
    ("iPhone 14 Pro",    11000,  "iphone_14_pro.jpg",     4,  "IPH-14P"),
    ("iPhone 15",        11000,  "iphone_15.jpg",         10, "IPH-15"),
    ("iPhone 15 Pro",    13000,  "iphone_15_pro.jpg",     6,  "IPH-15P"),
    ("iPhone 15 Pro Max",15000,  "iphone_15_pro_max.jpg", 4,  "IPH-15PM"),
    ("iPhone 16",        13000,  "iphone_16.jpg",         12, "IPH-16"),
    ("iPhone 16 Plus",   14000,  "iphone_16_plus.jpg",    7,  "IPH-16+"),
    ("iPhone 16 Pro",    16000,  "iphone_16_pro.jpg",     6,  "IPH-16P"),
    ("iPhone 16 Pro Max",18000,  "iphone_16_pro_max.jpg", 4,  "IPH-16PM"),
    ("iPhone 17",        20000,  "iphone_17.jpg",         3,  "IPH-17"),
]


class Command(BaseCommand):
    help = "Seed database with iPhone X–17 products"

    def handle(self, *args, **options):
        category, created = Category.objects.get_or_create(name="iPhone")
        if created:
            self.stdout.write(self.style.SUCCESS("Category 'iPhone' created"))
        else:
            self.stdout.write("Category 'iPhone' already exists")

        added = 0
        skipped = 0

        for name, price, img_file, stock_qty, sku in IPHONES:
            if Product.objects.filter(name=name).exists():
                self.stdout.write(f"  SKIP (exists): {name}")
                skipped += 1
                continue

            product = Product(
                name=name,
                price=price,
                category=category,
                sku=sku,
                stock_quantity=stock_qty,
                is_active=True,
                is_ingredient=False,
            )

            img_path = os.path.join(BASE_MEDIA, img_file)
            if os.path.exists(img_path) and os.path.getsize(img_path) > 100:
                with open(img_path, 'rb') as f:
                    product.image.save(img_file, File(f), save=False)

            product.save()
            added += 1
            self.stdout.write(self.style.SUCCESS(f"  ADDED: {name} — {price} сомонӣ ({stock_qty} дона)"))

        self.stdout.write(self.style.SUCCESS(
            f"\nТамом шуд: {added} маҳсулот илова шуд, {skipped} аллакай мавҷуд буд."
        ))
