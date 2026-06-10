"""
Run with: python manage.py shell < seed_menu.py
Adds all Dedi menu categories and products with ingredients.
"""
from products.models import Category, Product
import json

MENU = [
    # ── БУРГЕРЫ ─────────────────────────────────────────────────
    {
        "name": "Гамбургер",
        "category": "Бургеры",
        "price": 35,
        "description": "",
        "ingredients": [
            {"name": "Булочка гамбургер (верхняя часть)", "amount": "1 шт"},
            {"name": "Бургер соус", "amount": "20 гр"},
            {"name": "Айсберг чищеный", "amount": "15 гр"},
            {"name": "Помидоры чищеный", "amount": "20 гр"},
            {"name": "П/Ф Огурцы маринованные", "amount": "10 гр (3 шт)"},
            {"name": "П/Ф Лук красный", "amount": "5–7 гр (2–3 кольца)"},
            {"name": "Котлеты мясные", "amount": "1 шт"},
            {"name": "Булочка гамбургер (нижняя часть)", "amount": "1 шт"},
        ],
    },
    {
        "name": "Чизбургер",
        "category": "Бургеры",
        "price": 40,
        "description": "",
        "ingredients": [
            {"name": "Булочка гамбургер (верхняя часть)", "amount": "1 шт"},
            {"name": "Бургер соус", "amount": "20 гр"},
            {"name": "Айсберг чищеный", "amount": "15 гр"},
            {"name": "Помидоры чищеный", "amount": "20 гр"},
            {"name": "П/Ф Огурцы маринованные", "amount": "10 гр (3 шт)"},
            {"name": "П/Ф Лук красный", "amount": "5–7 гр (2–3 кольца)"},
            {"name": "Сыр Чеддер", "amount": "1 шт"},
            {"name": "Котлеты мясные", "amount": "1 шт"},
            {"name": "Булочка гамбургер (нижняя часть)", "amount": "1 шт"},
        ],
    },
    {
        "name": "Бигбургер",
        "category": "Бургеры",
        "price": 50,
        "description": "",
        "ingredients": [
            {"name": "Булочка гамбургер (верхняя часть)", "amount": "1 шт"},
            {"name": "Бургер соус", "amount": "20 гр"},
            {"name": "Айсберг чищеный", "amount": "15 гр"},
            {"name": "Помидоры чищеный", "amount": "20 гр"},
            {"name": "П/Ф Огурцы маринованные", "amount": "10 гр (3 шт)"},
            {"name": "П/Ф Лук красный", "amount": "5–7 гр (2–3 кольца)"},
            {"name": "Котлеты мясные", "amount": "1 шт"},
            {"name": "Сыр Чеддер", "amount": "1 шт"},
            {"name": "Котлеты мясные", "amount": "1 шт"},
            {"name": "Булочка гамбургер (нижняя часть)", "amount": "1 шт"},
        ],
    },
    {
        "name": "Чизлюксбургер (Шницель)",
        "category": "Бургеры",
        "price": 55,
        "description": "",
        "ingredients": [
            {"name": "Булочка гамбургер кукуруза (верхняя часть)", "amount": "1 шт"},
            {"name": "Горчичный соус", "amount": "1 нажатие"},
            {"name": "Кетчуп", "amount": "10 гр"},
            {"name": "Огурцы маринованные", "amount": "2 шт (круглые ломтики)"},
            {"name": "Салат Айсберг", "amount": "10 гр"},
            {"name": "Помидоры", "amount": "15 гр (кубики)"},
            {"name": "Шницель классический", "amount": "1 шт"},
            {"name": "Сыр Чеддер", "amount": "1 шт"},
            {"name": "Булочка гамбургер (нижняя часть)", "amount": "1 шт"},
        ],
    },
    {
        "name": "Чизбургер со стрипсами",
        "category": "Бургеры",
        "price": 52,
        "description": "",
        "ingredients": [
            {"name": "Булочка гамбургер кукуруза (верхняя часть)", "amount": "1 шт"},
            {"name": "Горчичный соус", "amount": "1 нажатие"},
            {"name": "Кетчуп", "amount": "10 гр"},
            {"name": "Огурцы маринованные", "amount": "1 шт"},
            {"name": "Стрипсы классические", "amount": "2 шт"},
            {"name": "Сыр Чеддер", "amount": "1 шт"},
            {"name": "Булочка гамбургер (нижняя часть)", "amount": "1 шт"},
        ],
    },
    {
        "name": "Чиккенбургер",
        "category": "Бургеры",
        "price": 48,
        "description": "",
        "ingredients": [
            {"name": "Булочка (верхняя часть)", "amount": "1 шт"},
            {"name": "Майонез", "amount": "20 гр"},
            {"name": "Салат Айсберг", "amount": "20 гр"},
            {"name": "Помидор", "amount": "20 гр (2 дона)"},
            {"name": "Кетчуп", "amount": "15 гр"},
            {"name": "Бодиринги маринад", "amount": "15 гр (3 шт)"},
            {"name": "Сыр", "amount": "12 гр (1 дона)"},
            {"name": "Катлети мурғии калон", "amount": "1 шт"},
            {"name": "Булочка (нижняя часть)", "amount": "1 шт"},
        ],
    },
    {
        "name": "Бургер Анбарис",
        "category": "Бургеры",
        "price": 55,
        "description": "",
        "ingredients": [
            {"name": "Булочка (верхняя часть)", "amount": "1 шт"},
            {"name": "Соуси паниры", "amount": "20 мл"},
            {"name": "Салат Айсберг", "amount": "20 гр"},
            {"name": "Пиёзи стружка", "amount": "10 гр"},
            {"name": "Соуси анбарис", "amount": "20 гр"},
            {"name": "Бодиринги маринад", "amount": "15 гр (3 шт)"},
            {"name": "Панир", "amount": "12 гр (1 дона)"},
            {"name": "Катлети говии калон", "amount": "1 шт"},
            {"name": "Булочка (нижняя часть)", "amount": "1 шт"},
        ],
    },

    # ── ХОТ-ДОГИ ─────────────────────────────────────────────
    {
        "name": "Классик Хот-Дог",
        "category": "Хот-доги",
        "price": 28,
        "description": "",
        "ingredients": [
            {"name": "Булочка хот-дог мини", "amount": "1 шт"},
            {"name": "Майонез", "amount": "5 гр"},
            {"name": "Огурцы маринованные", "amount": "10 гр (3–4 шт)"},
            {"name": "Помидоры чищеный", "amount": "15 гр (2 шт ломтика)"},
            {"name": "Сосиски", "amount": "1 шт (разогреть в микроволновке 30 сек)"},
            {"name": "Кетчуп + Майонез (зиг-заг)", "amount": "10 гр + 10 гр"},
        ],
    },
    {
        "name": "Хаггис с курицей и сыром",
        "category": "Хот-доги",
        "price": 42,
        "description": "",
        "ingredients": [
            {"name": "Булочка Хаггис", "amount": "1 шт"},
            {"name": "BBQ соус (зиг-заг)", "amount": "10 мл"},
            {"name": "Сыр", "amount": "1 шт"},
            {"name": "Красный лук", "amount": "6 гр (2 кольца)"},
            {"name": "Куриное мясо", "amount": "65 гр"},
            {"name": "BBQ соус (зиг-заг)", "amount": "10 мл"},
        ],
    },
    {
        "name": "Хаггис с сыром",
        "category": "Хот-доги",
        "price": 40,
        "description": "",
        "ingredients": [
            {"name": "Булочка Хаггис", "amount": "1 шт"},
            {"name": "BBQ соус (зиг-заг)", "amount": "10 мл"},
            {"name": "Сыр", "amount": "1 шт"},
            {"name": "Красный лук", "amount": "6 гр (2 кольца)"},
            {"name": "Говяжье мясо", "amount": "65 гр"},
            {"name": "BBQ соус (зиг-заг)", "amount": "10 мл"},
        ],
    },
    {
        "name": "Хаггис без сыра",
        "category": "Хот-доги",
        "price": 35,
        "description": "",
        "ingredients": [
            {"name": "Булочка Хаггис", "amount": "1 шт"},
            {"name": "BBQ соус (зиг-заг)", "amount": "10 мл"},
            {"name": "Красный лук", "amount": "6 гр (2 кольца)"},
            {"name": "Говяжье мясо", "amount": "65 гр"},
            {"name": "BBQ соус (зиг-заг)", "amount": "10 мл"},
        ],
    },
    {
        "name": "Хаггис без сыра с курицей",
        "category": "Хот-доги",
        "price": 35,
        "description": "",
        "ingredients": [
            {"name": "Булочка Хаггис", "amount": "1 шт"},
            {"name": "BBQ соус (зиг-заг)", "amount": "10 мл"},
            {"name": "Красный лук", "amount": "6 гр (2 кольца)"},
            {"name": "Куриное мясо", "amount": "65 гр"},
            {"name": "BBQ соус (зиг-заг)", "amount": "10 мл"},
        ],
    },

    # ── РОЛЛЫ ─────────────────────────────────────────────────
    {
        "name": "Криспи Ролл",
        "category": "Роллы",
        "price": 38,
        "description": "",
        "ingredients": [
            {"name": "Тортилья пшеничная 10.5", "amount": "1 шт"},
            {"name": "Майонезный соус", "amount": "2 нажатия"},
            {"name": "Салат Айсберг", "amount": "10 гр"},
            {"name": "Помидоры (нарезанные)", "amount": "15–20 гр"},
            {"name": "Оригинальные стрипсы", "amount": "2 шт"},
        ],
    },
    {
        "name": "Криспи Ролл Халапеньо",
        "category": "Роллы",
        "price": 42,
        "description": "",
        "ingredients": [
            {"name": "Тортилья пшеничная 10.5", "amount": "1 шт"},
            {"name": "Сырный соус", "amount": "3 нажатия"},
            {"name": "Салат Айсберг", "amount": "20 гр"},
            {"name": "Халапеньо маренованное", "amount": "3–4 шт (кольца)"},
            {"name": "Фри", "amount": "10 гр (2–3 шт)"},
            {"name": "Острые стрипсы", "amount": "2 шт"},
        ],
    },
    {
        "name": "Кидс Криспи-Ролл",
        "category": "Роллы",
        "price": 28,
        "description": "",
        "ingredients": [
            {"name": "Тортилья сырная 8", "amount": "1 шт"},
            {"name": "Сыр Чеддер", "amount": "1 ломтик"},
            {"name": "Горчичный соус", "amount": "1 нажатие"},
            {"name": "Кетчуп", "amount": "10 гр (1 полоска)"},
            {"name": "Маринованные огурцы", "amount": "2 шт (10–15 гр)"},
            {"name": "Оригинальный стрипс", "amount": "1 шт"},
        ],
    },
    {
        "name": "Броунстер",
        "category": "Роллы",
        "price": 52,
        "description": "",
        "ingredients": [
            {"name": "Тортилья пшеничная 10.5", "amount": "1 шт"},
            {"name": "Майонезный соус", "amount": "3 нажатия"},
            {"name": "Салат Айсберг", "amount": "15 гр"},
            {"name": "Помидоры (нарезанный кубики)", "amount": "20 гр"},
            {"name": "Шницель классик", "amount": "2 шт"},
            {"name": "Сыр Чеддер", "amount": "1 ломтик"},
            {"name": "Хешбраун", "amount": "1 шт"},
        ],
    },
    {
        "name": "Донар Ролл",
        "category": "Роллы",
        "price": 45,
        "description": "",
        "ingredients": [
            {"name": "Тортилья", "amount": "1 шт"},
            {"name": "Огурцы маринованные", "amount": "10 гр (2–3 шт)"},
            {"name": "Фри готовое", "amount": "30 гр"},
            {"name": "Соус", "amount": "40 гр"},
            {"name": "Говяжье мясо Донар", "amount": "70 гр"},
        ],
    },
    {
        "name": "Донар Ролл с курицей",
        "category": "Роллы",
        "price": 45,
        "description": "",
        "ingredients": [
            {"name": "Тортилья", "amount": "1 шт"},
            {"name": "Огурцы маринованные", "amount": "10 гр (2–3 шт)"},
            {"name": "Фри готовое", "amount": "30 гр"},
            {"name": "Соус", "amount": "40 гр"},
            {"name": "Куриный мясо Донар", "amount": "70 гр"},
        ],
    },
    {
        "name": "Донар Ролл Мини с курицей",
        "category": "Роллы",
        "price": 30,
        "description": "",
        "ingredients": [
            {"name": "Мини тортилья", "amount": "1 шт"},
            {"name": "Картошка фри", "amount": "20 гр"},
            {"name": "Чесночный соус", "amount": "20 гр"},
            {"name": "Куриное мясо", "amount": "40 гр"},
        ],
    },

    # ── ТРАЙНГЛС ──────────────────────────────────────────────
    {
        "name": "Трайнглс (говядина)",
        "category": "Трайнглс",
        "price": 48,
        "description": "",
        "ingredients": [
            {"name": "Тортилья сырный", "amount": "1 шт"},
            {"name": "Соус Трайнгл", "amount": "40 мл"},
            {"name": "Мясо говяжий", "amount": "85 гр"},
            {"name": "Помидоры", "amount": "30 гр (3 куска)"},
            {"name": "Сыр", "amount": "1 шт"},
        ],
    },
    {
        "name": "Трайнглс с курицей",
        "category": "Трайнглс",
        "price": 48,
        "description": "",
        "ingredients": [
            {"name": "Тортилья классик", "amount": "1 шт"},
            {"name": "Соус Трайнгл", "amount": "40 мл"},
            {"name": "Мясо куриный", "amount": "85 гр"},
            {"name": "Помидоры", "amount": "30 гр (3 куска)"},
            {"name": "Сыр", "amount": "1 шт"},
        ],
    },
    {
        "name": "Трайнглс Анбарис",
        "category": "Трайнглс",
        "price": 52,
        "description": "",
        "ingredients": [
            {"name": "Тортилла сафед", "amount": "1 дона (60 гр)"},
            {"name": "Панир", "amount": "12 гр (1 дона)"},
            {"name": "Помидор", "amount": "30 гр (3 дона)"},
            {"name": "Соуси анбарис", "amount": "20 гр"},
            {"name": "Гушти мурғ", "amount": "85 гр"},
            {"name": "Соуси трайнгл", "amount": "20 гр"},
        ],
    },

    # ── ЛАВАШИ ────────────────────────────────────────────────
    {
        "name": "Лаваш S (куриный)",
        "category": "Лаваши",
        "price": 32,
        "description": "",
        "ingredients": [
            {"name": "Мини классик лаваш", "amount": "1 шт"},
            {"name": "Помидоры", "amount": "20 гр (2 шт)"},
            {"name": "Чипсы", "amount": "10 гр"},
            {"name": "Мясо куриное", "amount": "40 гр"},
            {"name": "Майонез", "amount": "20 гр"},
            {"name": "Томатный соус", "amount": "40 гр"},
        ],
    },
    {
        "name": "Лаваш с сыром",
        "category": "Лаваши",
        "price": 55,
        "description": "",
        "ingredients": [
            {"name": "Лаваш большой сырный", "amount": "1 шт"},
            {"name": "Помидоры чищеный", "amount": "20 гр (2 шт)"},
            {"name": "Чипсы солью", "amount": "20 гр"},
            {"name": "Мясо Донар жареное", "amount": "100 гр"},
            {"name": "Майонез", "amount": "35 гр (6 раз полосками)"},
            {"name": "Томатный соус", "amount": "80 гр (1 половник)"},
            {"name": "Сыр Чеддер", "amount": "1 шт (2 половинки ломтика)"},
        ],
    },
    {
        "name": "Лаваш острый",
        "category": "Лаваши",
        "price": 52,
        "description": "",
        "ingredients": [
            {"name": "Лаваш большой острый", "amount": "1 шт"},
            {"name": "Помидоры чищеный", "amount": "20 гр (2 шт)"},
            {"name": "Чипсы солью", "amount": "20 гр"},
            {"name": "Мясо Донар жареное", "amount": "100 гр"},
            {"name": "Майонез", "amount": "35 гр (6 раз полосками)"},
            {"name": "Томатный острый соус", "amount": "80 гр (1 половник)"},
        ],
    },
    {
        "name": "Лаваш с курицей",
        "category": "Лаваши",
        "price": 52,
        "description": "",
        "ingredients": [
            {"name": "Лаваш большой", "amount": "1 шт"},
            {"name": "Помидоры чищеный", "amount": "20 гр (2 шт)"},
            {"name": "Чипсы солью", "amount": "20 гр"},
            {"name": "Куриный мясо Донар", "amount": "100 гр"},
            {"name": "Майонез", "amount": "35 гр (6 раз полосками)"},
            {"name": "Томатный соус", "amount": "80 гр (1 половник)"},
        ],
    },
    {
        "name": "Фитролл",
        "category": "Лаваши",
        "price": 48,
        "description": "",
        "ingredients": [
            {"name": "Зеленый лаваш", "amount": "1 шт"},
            {"name": "Салат Айсберг", "amount": "40 гр"},
            {"name": "Огурцы свежие", "amount": "25 гр"},
            {"name": "Помидоры", "amount": "30 гр (6 шт половники)"},
            {"name": "Куриное мясо", "amount": "40 гр"},
            {"name": "Сыр Фетакс", "amount": "35 гр"},
            {"name": "Соус", "amount": "40 мл (линия)"},
        ],
    },
    {
        "name": "Лаваши гови (Калон В)",
        "category": "Лаваши",
        "price": 55,
        "description": "",
        "ingredients": [
            {"name": "Лаваши панири калон", "amount": "1 дона"},
            {"name": "Гушти гов", "amount": "100 гр"},
            {"name": "Соуси томати", "amount": "90 гр"},
            {"name": "Майонез", "amount": "35 гр"},
            {"name": "Чипсы", "amount": "20 гр"},
            {"name": "Помидор", "amount": "20 гр (2 дона)"},
        ],
    },
    {
        "name": "Лаваши гови (Хурд М)",
        "category": "Лаваши",
        "price": 38,
        "description": "",
        "ingredients": [
            {"name": "Лаваш мини классик", "amount": "1 шт"},
            {"name": "Гушти гов", "amount": "65 гр"},
            {"name": "Соуси томати", "amount": "65 гр"},
            {"name": "Майонез", "amount": "20 гр"},
            {"name": "Чипсы", "amount": "13 гр"},
            {"name": "Помидор", "amount": "20 гр (2 дона)"},
        ],
    },
    {
        "name": "Лаваши панирии гови (Калон В)",
        "category": "Лаваши",
        "price": 60,
        "description": "",
        "ingredients": [
            {"name": "Лаваши панири калон", "amount": "1 дона"},
            {"name": "Панир", "amount": "12 гр (1 шт)"},
            {"name": "Гушти гов", "amount": "100 гр"},
            {"name": "Соуси томати", "amount": "90 гр"},
            {"name": "Майонез", "amount": "35 гр"},
            {"name": "Чипсы", "amount": "20 гр"},
            {"name": "Помидор", "amount": "20 гр (2 дона)"},
        ],
    },
    {
        "name": "Лаваши панирии гови (Хурд М)",
        "category": "Лаваши",
        "price": 42,
        "description": "",
        "ingredients": [
            {"name": "Лаваши мини панири", "amount": "1 шт"},
            {"name": "Панир", "amount": "12 гр (1 шт)"},
            {"name": "Гушти гов", "amount": "65 гр"},
            {"name": "Соуси томати", "amount": "65 гр"},
            {"name": "Майонез", "amount": "20 гр"},
            {"name": "Чипсы", "amount": "13 гр"},
            {"name": "Помидор", "amount": "20 гр (2 дона)"},
        ],
    },

    # ── ШАВЕРМА ───────────────────────────────────────────────
    {
        "name": "Шаверма говядина (Большой)",
        "category": "Шаверма",
        "price": 55,
        "description": "",
        "ingredients": [
            {"name": "Нони шаверма", "amount": "1 дона (150 гр)"},
            {"name": "Гушти гов", "amount": "85 гр"},
            {"name": "Соуси томати", "amount": "85 мл"},
            {"name": "Помидор", "amount": "20 гр (2 дона)"},
            {"name": "Бодиринг", "amount": "10 гр (2 дона)"},
        ],
    },
    {
        "name": "Шаверма говядина (Малый)",
        "category": "Шаверма",
        "price": 38,
        "description": "",
        "ingredients": [
            {"name": "Нони шаверма", "amount": "1 дона (100 гр)"},
            {"name": "Гушти гов", "amount": "65 гр"},
            {"name": "Соуси томати", "amount": "65 мл"},
            {"name": "Помидор", "amount": "10 гр (1 дона)"},
            {"name": "Бодиринг", "amount": "5 гр (1 дона)"},
        ],
    },
    {
        "name": "Шаверма курица (Большой)",
        "category": "Шаверма",
        "price": 52,
        "description": "",
        "ingredients": [
            {"name": "Нони шаверма", "amount": "1 дона (150 гр)"},
            {"name": "Гушти мурғ", "amount": "85 гр"},
            {"name": "Соуси томати", "amount": "85 мл"},
            {"name": "Помидор", "amount": "20 гр (2 дона)"},
            {"name": "Бодиринг", "amount": "10 гр (2 дона)"},
        ],
    },
    {
        "name": "Шаверма курица (Малый)",
        "category": "Шаверма",
        "price": 35,
        "description": "",
        "ingredients": [
            {"name": "Нони шаверма", "amount": "1 дона (100 гр)"},
            {"name": "Гушти мурғ", "amount": "65 гр"},
            {"name": "Соуси томати", "amount": "65 мл"},
            {"name": "Помидор", "amount": "10 гр (1 дона)"},
            {"name": "Бодиринг", "amount": "5 гр (1 дона)"},
        ],
    },
    {
        "name": "Шавермитто курица (Большой)",
        "category": "Шаверма",
        "price": 55,
        "description": "",
        "ingredients": [
            {"name": "Нони шаверма", "amount": "1 дона (150 гр)"},
            {"name": "Гушти мурғ", "amount": "85 гр"},
            {"name": "Соуси сирпиёзи", "amount": "85 мл"},
            {"name": "Помидор", "amount": "20 гр (2 дона)"},
            {"name": "Бодиринг", "amount": "10 гр (2 дона)"},
        ],
    },
    {
        "name": "Шавермитто курица (Малый)",
        "category": "Шаверма",
        "price": 38,
        "description": "",
        "ingredients": [
            {"name": "Нони шаверма", "amount": "1 дона (100 гр)"},
            {"name": "Гушти мурғ", "amount": "65 гр"},
            {"name": "Соуси сирпиёзи", "amount": "30 мл"},
            {"name": "Помидор", "amount": "10 гр (1 дона)"},
            {"name": "Бодиринг", "amount": "5 гр (1 дона)"},
        ],
    },
    {
        "name": "Лавашитто курица (Большой)",
        "category": "Шаверма",
        "price": 55,
        "description": "",
        "ingredients": [
            {"name": "Лаваш", "amount": "1 дона (90 гр)"},
            {"name": "Гушти мурғ", "amount": "100 гр"},
            {"name": "Соуси сирпиёзи", "amount": "60 гр"},
            {"name": "Карам", "amount": "30 гр"},
            {"name": "Помидор", "amount": "20 гр (2 дона)"},
        ],
    },
    {
        "name": "Лавашитто курица (Малый)",
        "category": "Шаверма",
        "price": 38,
        "description": "",
        "ingredients": [
            {"name": "Лаваш", "amount": "1 дона (60 гр)"},
            {"name": "Гушти мурғ", "amount": "65 гр"},
            {"name": "Соуси сирпиёзи", "amount": "40 гр"},
            {"name": "Карам", "amount": "20 гр"},
            {"name": "Помидор", "amount": "20 гр (2 дона)"},
        ],
    },
    {
        "name": "Трайнгелли Анбарис",
        "category": "Шаверма",
        "price": 52,
        "description": "",
        "ingredients": [
            {"name": "Тортилла сафед", "amount": "1 дона (60 гр)"},
            {"name": "Гушти мурғ", "amount": "85 гр"},
            {"name": "Соуси анбарис", "amount": "20 гр"},
            {"name": "Соуси трайнгл", "amount": "20 гр"},
            {"name": "Помидор", "amount": "30 гр (3 дона)"},
            {"name": "Панир", "amount": "12 гр (1 дона)"},
        ],
    },

    # ── ДОНАР ─────────────────────────────────────────────────
    {
        "name": "Донар блюдо (говядина)",
        "category": "Донар",
        "price": 85,
        "description": "",
        "ingredients": [
            {"name": "Донар 5в1 (посуда)", "amount": "1 шт"},
            {"name": "П/Ф Мясо Донар жареное 32%", "amount": "130 гр"},
            {"name": "П/Ф Фри", "amount": "70 гр сырой → 60 гр готовый"},
            {"name": "П/Ф цех гарнир рис", "amount": "80 гр"},
            {"name": "П/Ф Салат с красной капустой", "amount": "80 гр"},
            {"name": "П/Ф Красный томатный соус", "amount": "50 гр"},
        ],
    },
    {
        "name": "Донар блюдо (курица)",
        "category": "Донар",
        "price": 80,
        "description": "",
        "ingredients": [
            {"name": "Донар 5в1 (посуда)", "amount": "1 шт"},
            {"name": "Куриное мясо Донар", "amount": "130 гр"},
            {"name": "П/Ф Фри", "amount": "70 гр сырой → 60 гр готовый"},
            {"name": "П/Ф цех гарнир рис", "amount": "80 гр"},
            {"name": "П/Ф Салат с красной капустой", "amount": "80 гр"},
            {"name": "П/Ф Красный томатный соус", "amount": "50 гр"},
        ],
    },
    {
        "name": "Хуроки Донар (говядина)",
        "category": "Донар",
        "price": 85,
        "description": "",
        "ingredients": [
            {"name": "Нон", "amount": "1 дона (70 гр)"},
            {"name": "Гушти гов", "amount": "135 гр"},
            {"name": "Картошка фри", "amount": "85 гр"},
            {"name": "Биринч (рис)", "amount": "90 гр"},
            {"name": "Соуси томати", "amount": "50 мл"},
            {"name": "Салат", "amount": "90 гр"},
            {"name": "Кутти 5тага", "amount": "1 дона (60 гр)"},
        ],
    },
    {
        "name": "Хуроки Донар (курица)",
        "category": "Донар",
        "price": 80,
        "description": "",
        "ingredients": [
            {"name": "Нон", "amount": "1 дона (70 гр)"},
            {"name": "Гушти мурғ", "amount": "135 гр"},
            {"name": "Картошка фри", "amount": "85 гр"},
            {"name": "Биринч (рис)", "amount": "90 гр"},
            {"name": "Соуси томати", "amount": "50 мл"},
            {"name": "Салат", "amount": "90 гр"},
            {"name": "Кутти 5тага", "amount": "1 дона (60 гр)"},
        ],
    },

    # ── СЕНДВИЧИ ──────────────────────────────────────────────
    {
        "name": "Сендвич",
        "category": "Сендвичи",
        "price": 65,
        "description": "",
        "ingredients": [
            {"name": "Тостер хлеб (верхний)", "amount": "1 шт"},
            {"name": "Клаб соус", "amount": "20 гр"},
            {"name": "П/Ф Помидоры чищ.", "amount": "30 гр (3 шт круглые ломтики)"},
            {"name": "Сыр Хохланд для сендвича", "amount": "150 гр (1 шт)"},
            {"name": "Тостер хлеб (средний)", "amount": "1 шт"},
            {"name": "Клаб соус", "amount": "20 гр"},
            {"name": "П/Ф Огурцы свежие, очищенные", "amount": "30 гр (3 слайса)"},
            {"name": "Шницель", "amount": "136 гр (жарить 4 мин при 172°C)"},
            {"name": "Тостер хлеб (нижний)", "amount": "1 шт"},
            {"name": "Клаб соус", "amount": "20 гр"},
        ],
    },
    {
        "name": "Клаб Сендвич",
        "category": "Сендвичи",
        "price": 75,
        "description": "",
        "ingredients": [
            {"name": "Тостер хлеб (верхний)", "amount": "1 шт"},
            {"name": "Клаб соус", "amount": "20 гр"},
            {"name": "П/Ф Помидоры чищ.", "amount": "30 гр (3 шт)"},
            {"name": "Сыр Хохланд для сендвича", "amount": "150 гр (1 шт)"},
            {"name": "Тостер хлеб (средний)", "amount": "1 шт"},
            {"name": "Клаб соус", "amount": "20 гр"},
            {"name": "П/Ф Огурцы свежие, очищенные", "amount": "30 гр (3 слайса)"},
            {"name": "Шницель", "amount": "136 гр"},
            {"name": "Тостер хлеб (нижний)", "amount": "1 шт"},
            {"name": "Клаб соус", "amount": "20 гр"},
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
