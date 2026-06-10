"""
Барномаи илова кардани ҳамаи маҳсулотҳо ва ингредиентҳои DEDI
Аз расмҳои Telegram Desktop (8-9 март ва 11 май)
Истифода: python manage.py seed_dedi_food
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from products.models import Category, Product, ProductIngredient


# ─────────────────────────────────────────────
#  ИНГРЕДИЕНТҲО (хоммаҳсулот)
# ─────────────────────────────────────────────
INGREDIENTS = [
    # Нон / Булочки
    ("Болои булочка (нони гамбургер боло)",   "ING-BUN-TOP"),
    ("Поёни булочка (нони гамбургер поён)",   "ING-BUN-BOT"),
    ("Булочка хот-дог мини",                  "ING-BUN-HOTDOG-MINI"),
    ("Булочка хот-дог калон",                 "ING-BUN-HOTDOG-BIG"),
    ("Булочка хаггис",                        "ING-BUN-HAGGIS"),
    ("Нони шаверма (хлеб шаурмы)",            "ING-BREAD-SHAWA"),
    ("Нони шаверма мини",                     "ING-BREAD-SHAWA-MINI"),
    ("Нони герман (Герман хлеб)",             "ING-BREAD-GERMAN"),
    ("Тостер хлеб",                           "ING-BREAD-TOAST"),
    ("Лаваш калон классик",                   "ING-LAVASH-BIG"),
    ("Лаваш калон тез (острый)",              "ING-LAVASH-BIG-HOT"),
    ("Лаваш калон панири (сырный)",           "ING-LAVASH-BIG-CHEESE"),
    ("Лаваш мини классик",                    "ING-LAVASH-MINI"),
    ("Лаваш мини панири (сырный)",            "ING-LAVASH-MINI-CHEESE"),
    ("Лаваш сабз (зелёный)",                  "ING-LAVASH-GREEN"),
    ("Тортилья 10.5 (пшеничная)",             "ING-TORT-105"),
    ("Тортилья 12 (пшеничная)",               "ING-TORT-12"),
    ("Тортилья 8 панири (сырная)",            "ING-TORT-8-CHEESE"),
    ("Тортилья классик",                      "ING-TORT-CLASSIC"),
    ("Тортилья сырный (для трайнглас)",       "ING-TORT-CHEESE"),
    ("Тортилья мини",                         "ING-TORT-MINI"),
    ("Тортилья сафед (белая, 60гр)",          "ING-TORT-WHITE-60"),
    # Гушт / Мясо
    ("Гушти гов дӯстдошта (говяжье донар)",   "ING-MEAT-BEEF"),
    ("Гушти мурғ дӯстдошта (куриное донар)",  "ING-MEAT-CHICKEN"),
    ("Катлети говии калон",                   "ING-PATTY-BEEF"),
    ("Катлети мурғии калон",                  "ING-PATTY-CHICKEN"),
    ("Сосиски",                               "ING-SAUSAGE"),
    ("Шницель классический (136гр)",          "ING-SCHNITZEL"),
    ("Стрипсы оригинальные",                  "ING-STRIPS-ORIG"),
    ("Стрипсы острые",                        "ING-STRIPS-HOT"),
    ("Байтсы (куриные кусочки)",              "ING-BITES"),
    ("Кофте (фрикадельки)",                   "ING-KOFTE"),
    ("Колбаса салями",                        "ING-SALAMI"),
    ("Хешбраун",                              "ING-HASHBROWN"),
    # Панир / Сыр
    ("Панир чеддер (сыр чеддер)",             "ING-CHEESE-CHEDDAR"),
    ("Панир фетакс (сыр фетакс)",             "ING-CHEESE-FETA"),
    ("Панир хохланд (сыр хохланд, 150гр)",   "ING-CHEESE-HOHLND"),
    ("Панир моцарелла тёртый",               "ING-CHEESE-MOZZ"),
    ("Панир тёртый",                          "ING-CHEESE-GRATED"),
    # Сабзавот / Овощи
    ("Помидоры чищеный",                      "ING-TOMATO"),
    ("Бодиринги маринад (маринованные огурцы)", "ING-PICKLE"),
    ("Бодиринги тоза (огурцы свежие)",        "ING-CUCUMBER"),
    ("Пиёзи сурх (лук красный)",              "ING-RED-ONION"),
    ("Пиёзи стружка (лук тёртый)",            "ING-ONION-GRATED"),
    ("Карам айсберг (салат айсберг)",         "ING-ICEBERG"),
    ("Салат с красной капустой (готовый)",    "ING-RED-CABBAGE-SALAD"),
    ("Красная капуста",                       "ING-RED-CABBAGE"),
    ("Перец болгарский (тонкий соломкой)",    "ING-BELL-PEPPER"),
    ("Халапено маренованное",                 "ING-JALAPENO"),
    ("Маслины",                               "ING-OLIVES"),
    ("Кукуруза сладкая",                      "ING-CORN"),
    ("Морковча (корейская морковь)",          "ING-KOREAN-CARROT"),
    ("Лимон",                                 "ING-LEMON"),
    ("Лимон ломтиками",                       "ING-LEMON-SLICE"),
    # Соусҳо / Соусы
    ("Соуси бургер (бургер соус)",            "ING-SAUCE-BURGER"),
    ("Соуси томати (томатный соус)",          "ING-SAUCE-TOMATO"),
    ("Соуси томатии тез (острый томат)",      "ING-SAUCE-TOMATO-HOT"),
    ("Майонез",                               "ING-SAUCE-MAYO"),
    ("Кетчуп",                                "ING-SAUCE-KETCHUP"),
    ("Горчичный соус",                        "ING-SAUCE-MUSTARD"),
    ("BBQ соус",                              "ING-SAUCE-BBQ"),
    ("Соуси сирпиёзи (чесночный соус)",       "ING-SAUCE-GARLIC"),
    ("Клаб соус",                             "ING-SAUCE-CLUB"),
    ("Майонезный соус",                       "ING-SAUCE-MAYO-MIX"),
    ("Сырный соус",                           "ING-SAUCE-CHEESE"),
    ("Греческий соус",                        "ING-SAUCE-GREEK"),
    ("Цезарь соус",                           "ING-SAUCE-CAESAR"),
    ("Соуси анбарис",                         "ING-SAUCE-ANBAR"),
    ("Соуси трайнгл",                         "ING-SAUCE-TRIANGLE"),
    ("Соуси панири (сырный микс)",            "ING-SAUCE-PANIR"),
    ("Кисло-сладкий соус",                    "ING-SAUCE-SWEETSOUR"),
    ("Белый соус",                            "ING-SAUCE-WHITE"),
    ("Соуси ифтар",                           "ING-SAUCE-IFTAR"),
    # Картошка / Фри
    ("Картошка фри готовая",                  "ING-FRIES"),
    ("Чипсы солью",                           "ING-CHIPS"),
    ("Чипсы измельчённые",                    "ING-CHIPS-CRUSHED"),
    # Напитки / Ингредиенты для напитков
    ("Сироп мохито",                          "ING-SYR-MOJITO"),
    ("Сироп клубничный",                      "ING-SYR-STRAWBERRY"),
    ("Сироп дюшес",                           "ING-SYR-DUCHESS"),
    ("Сироп гранатовый",                      "ING-SYR-POMEGRANATE"),
    ("Сироп маракуйя",                        "ING-SYR-PASSIONFRUIT"),
    ("Сироп клубника",                        "ING-SYR-STRAWBERRY2"),
    ("Сироп гренадин",                        "ING-SYR-GRENADINE"),
    ("Пюре вишни",                            "ING-PUREE-CHERRY"),
    ("Пюре манго",                            "ING-PUREE-MANGO"),
    ("Пюре маракуйя",                         "ING-PUREE-PASSIONFRUIT"),
    ("Газировка / Газированная вода",         "ING-SODA"),
    ("Лимонный фреш",                         "ING-LEMON-FRESH"),
    ("Мята",                                  "ING-MINT"),
    ("Лёд",                                   "ING-ICE"),
    ("Стакан одноразовый 0.4л",               "ING-CUP-04"),
    ("Стакан одноразовый 0.5л",               "ING-CUP-05"),
    # Бошқа / Прочее
    ("Биринч / Рис (гарнир готовый)",         "ING-RICE"),
    ("Сухарики",                              "ING-CROUTONS"),
    ("Round bowl (упаковка для салата)",      "ING-BOWL"),
    ("Нон (багет 50-60гр)",                   "ING-BAGUETTE"),
    ("Донар 5 в 1 (посуда)",                  "ING-DONAR-TRAY"),
]

# ─────────────────────────────────────────────
#  МАҲСУЛОТҲО (меню)
# ─────────────────────────────────────────────
# (name, sku, category)
PRODUCTS = [
    # ── БУРГЕРЫ ──────────────────────────────
    ("Гамбургер (котлет)",          "PROD-BURGER-BEEF",        "Бургеры"),
    ("Дабл Гамбургер (котлет)",     "PROD-DBURGER-BEEF",       "Бургеры"),
    ("Чизбургер (котлет)",          "PROD-CHEESEBURGER-BEEF",  "Бургеры"),
    ("Дабл Чизбургер (котлет)",     "PROD-DCHEESE-BEEF",       "Бургеры"),
    ("Чиккенбургер (котлет)",       "PROD-CHICKENBURGER",      "Бургеры"),
    ("Бургер Анбарис (котлет)",     "PROD-BURGER-ANBAR",       "Бургеры"),
    ("Чизбургер (шницель)",         "PROD-CHEESE-SCHNITZEL",   "Бургеры"),
    ("Чизлюксбургер (шницель)",     "PROD-LUXE-SCHNITZEL",     "Бургеры"),
    ("Чизбургер (стрипсы)",         "PROD-CHEESE-STRIPS",      "Бургеры"),
    ("Броунстер",                   "PROD-BROUNSTER",          "Бургеры"),
    # ── ХОТ-ДОГҲО ────────────────────────────
    ("Классик хот-дог",             "PROD-HOTDOG-CLASSIC",     "Хот-догҳо"),
    ("Кинг дог",                    "PROD-HOTDOG-KING",        "Хот-догҳо"),
    ("Хот лонгер",                  "PROD-HOTDOG-LONGER",      "Хот-догҳо"),
    ("Хаггис с курицей и сыром",    "PROD-HAGGIS-CHICK-CHEESE","Хот-догҳо"),
    ("Хаггис с сыром",              "PROD-HAGGIS-BEEF-CHEESE", "Хот-догҳо"),
    ("Хаггис без сыра",             "PROD-HAGGIS-BEEF",        "Хот-догҳо"),
    ("Хаггис без сыра с курицей",   "PROD-HAGGIS-CHICKEN",     "Хот-догҳо"),
    ("Слив-дог",                    "PROD-HOTDOG-SLIV",        "Хот-догҳо"),
    ("Лаусдог",                     "PROD-HOTDOG-LAUS",        "Хот-догҳо"),
    ("Классик-дог",                 "PROD-HOTDOG-CLASS2",      "Хот-догҳо"),
    ("Цезарь-дог",                  "PROD-HOTDOG-CAESAR",      "Хот-догҳо"),
    ("Мехико-дог",                  "PROD-HOTDOG-MEXICO",      "Хот-догҳо"),
    ("Американо-дог",               "PROD-HOTDOG-AMERICAN",    "Хот-догҳо"),
    ("Итали-дог",                   "PROD-HOTDOG-ITALIAN",     "Хот-догҳо"),
    ("Датский-дог",                 "PROD-HOTDOG-DANISH",      "Хот-догҳо"),
    ("Чиздог",                      "PROD-HOTDOG-CHEESE",      "Хот-догҳо"),
    ("Азиатский-дог",               "PROD-HOTDOG-ASIAN",       "Хот-догҳо"),
    # ── ШАВЕРМА ──────────────────────────────
    ("Шаверма (говядина)",          "PROD-SHAWA-BEEF",         "Шаверма"),
    ("Шаверма с сыром (говядина)",  "PROD-SHAWA-BEEF-CH",      "Шаверма"),
    ("Шаверма острая (говядина)",   "PROD-SHAWA-BEEF-HOT",     "Шаверма"),
    ("Шаверма (курица)",            "PROD-SHAWA-CHICK",        "Шаверма"),
    ("Шаверма с сыром (курица)",    "PROD-SHAWA-CHICK-CH",     "Шаверма"),
    ("Шаверма острая (курица)",     "PROD-SHAWA-CHICK-HOT",    "Шаверма"),
    ("Шаверма мини (говядина)",     "PROD-SHAWA-MINI-BEEF",    "Шаверма"),
    ("Шаверма мини (курица)",       "PROD-SHAWA-MINI-CHICK",   "Шаверма"),
    # Тоҷикӣ (Tajik style)
    ("Шавермаи гови B (калон)",     "PROD-SHAWA-GOV-B",        "Шаверма"),
    ("Шавермаи гови тез B",         "PROD-SHAWA-GOV-HOT-B",    "Шаверма"),
    ("Шавермаи гови панири B",      "PROD-SHAWA-GOV-CH-B",     "Шаверма"),
    ("Шавермаи гови M (хурд)",      "PROD-SHAWA-GOV-M",        "Шаверма"),
    ("Шавермаи гови тез M",         "PROD-SHAWA-GOV-HOT-M",    "Шаверма"),
    ("Шавермаи мурғи B (калон)",    "PROD-SHAWA-MURG-B",       "Шаверма"),
    ("Шавермаи мурғи тез B",        "PROD-SHAWA-MURG-HOT-B",   "Шаверма"),
    ("Шавермаи мурғи M (хурд)",     "PROD-SHAWA-MURG-M",       "Шаверма"),
    ("Шавермаи мурғи тез M",        "PROD-SHAWA-MURG-HOT-M",   "Шаверма"),
    ("Шавермитто мурғи калон B",    "PROD-SHAWAMITTO-B",       "Шаверма"),
    ("Шавермитто мурғи хурд M",     "PROD-SHAWAMITTO-M",       "Шаверма"),
    # ── ЛАВАШ ────────────────────────────────
    ("Лаваш с курицей (калон)",     "PROD-LAVASH-CHICK",       "Лаваш"),
    ("Лаваш с сыром (говядина)",    "PROD-LAVASH-BEEF-CH",     "Лаваш"),
    ("Лаваш острый (говядина)",     "PROD-LAVASH-BEEF-HOT",    "Лаваш"),
    ("Лаваш S (мини с курицей)",    "PROD-LAVASH-S",           "Лаваш"),
    ("Мини лаваш с курицей",        "PROD-LAVASH-MINI-CHICK",  "Лаваш"),
    ("Мини лаваш с сыром",          "PROD-LAVASH-MINI-CH",     "Лаваш"),
    ("Фитролл",                     "PROD-FITROLL",            "Лаваш"),
    # Тоҷикӣ (Tajik style)
    ("Лаваши гови B (калон)",       "PROD-LAV-GOV-B",          "Лаваш"),
    ("Лаваши гови тез B",           "PROD-LAV-GOV-HOT-B",      "Лаваш"),
    ("Лаваши мурғи M (хурд)",       "PROD-LAV-MURG-M",         "Лаваш"),
    ("Лаваши панири гови M",        "PROD-LAV-GOV-CH-M",       "Лаваш"),
    ("Лаваши панири гови B",        "PROD-LAV-GOV-CH-B",       "Лаваш"),
    ("Лаваши панири гови тез B",    "PROD-LAV-GOV-CH-HOT-B",   "Лаваш"),
    ("Лаваши мурғи B (калон)",      "PROD-LAV-MURG-B",         "Лаваш"),
    ("Лаваши мурғи тез B",          "PROD-LAV-MURG-HOT-B",     "Лаваш"),
    ("Лаваши панири мурғи M",       "PROD-LAV-MURG-CH-M",      "Лаваш"),
    ("Лаваши панири мурғи B",       "PROD-LAV-MURG-CH-B",      "Лаваш"),
    ("Лаваши панири мурғи тез B",   "PROD-LAV-MURG-CH-HOT-B",  "Лаваш"),
    # ── РОЛЛҲО ───────────────────────────────
    ("Донар ролл (говядина)",       "PROD-ROLL-BEEF",          "Роллҳо"),
    ("Донар ролл (курица)",         "PROD-ROLL-CHICK",         "Роллҳо"),
    ("Донар ролл мини (курица)",    "PROD-ROLL-MINI-CHICK",    "Роллҳо"),
    ("Криспи ролл",                 "PROD-ROLL-CRISPY",        "Роллҳо"),
    ("Криспи ролл халопенько",      "PROD-ROLL-CRISPY-HOT",    "Роллҳо"),
    ("Кидс Криспи-ролл",            "PROD-ROLL-KIDS",          "Роллҳо"),
    ("Броунстер",                   "PROD-ROLL-BROUNSTER",     "Роллҳо"),
    ("Каттача-ролл",                "PROD-ROLL-KATTACHA",      "Роллҳо"),
    ("Трайнглас (говядина)",        "PROD-TRIANGL-BEEF",       "Роллҳо"),
    ("Трайнглас (курица)",          "PROD-TRIANGL-CHICK",      "Роллҳо"),
    ("Трайнгелли анбарис",          "PROD-TRIANGL-ANBAR",      "Роллҳо"),
    ("Лавашитто мурғи калон B",     "PROD-LAVASHITTO-B",       "Роллҳо"),
    ("Лавашитто мурғи хурд M",      "PROD-LAVASHITTO-M",       "Роллҳо"),
    # ── ДОНАР БЛЮДА ──────────────────────────
    ("Донар блюда (говядина)",      "PROD-DONAR-PLATE-BEEF",   "Донар блюда"),
    ("Донар блюда (курица)",        "PROD-DONAR-PLATE-CHICK",  "Донар блюда"),
    ("Хуроки донар (гови)",         "PROD-HUROKI-GOV",         "Донар блюда"),
    ("Хуроки донар (мурғи)",        "PROD-HUROKI-MURG",        "Донар блюда"),
    ("Хуроки ифтар (кофте)",        "PROD-HUROKI-IFTAR-K",     "Донар блюда"),
    ("Хуроки ифтар (стрипсы)",      "PROD-HUROKI-IFTAR-S",     "Донар блюда"),
    # ── ДОНАР СЭНДВИЧ ────────────────────────
    ("Герман донер (говядина)",     "PROD-GERMAN-BEEF",        "Донар сэндвич"),
    ("Герман донер (курица)",       "PROD-GERMAN-CHICK",       "Донар сэндвич"),
    ("Клаб сэндвич",                "PROD-SANDWICH-CLUB",      "Донар сэндвич"),
    ("Сэндвич",                     "PROD-SANDWICH",           "Донар сэндвич"),
    # ── НАПИТКИ ──────────────────────────────
    ("Мохито классик",              "PROD-MOJITO-CLASSIC",     "Напитки"),
    ("Мохито клубничное",           "PROD-MOJITO-STRAW",       "Напитки"),
    ("Лимонад дюшес",               "PROD-LEMONADE-DUCHESS",   "Напитки"),
    ("Лимонад гранатовый",          "PROD-LEMONADE-POMEGR",    "Напитки"),
    ("Лимонад маракуйя",            "PROD-LEMONADE-PASSION",   "Напитки"),
    ("Лимонад клубника",            "PROD-LEMONADE-STRAW",     "Напитки"),
    ("Вишня-гранат",                "PROD-DRINK-CHERRY-POMEGR","Напитки"),
    ("Манго-маракуйя",              "PROD-DRINK-MANGO-PASSION","Напитки"),
    # ── САЛАТҲО ──────────────────────────────
    ("Греческий салат",             "PROD-SALAD-GREEK",        "Салатҳо"),
    ("Цезарь салат",                "PROD-SALAD-CAESAR",       "Салатҳо"),
]

# ─────────────────────────────────────────────
#  РЕЦЕПТҲО  {sku_продукт: [(sku_ингредиент, количество_гр_мл_шт), ...]}
# ─────────────────────────────────────────────
RECIPES = {
    # ── БУРГЕРЫ ──────────────────────────────────────────────────────────────
    "PROD-BURGER-BEEF": [
        ("ING-BUN-TOP",       1),
        ("ING-SAUCE-MAYO",   20),
        ("ING-ICEBERG",      20),
        ("ING-TOMATO",       20),
        ("ING-RED-ONION",     6),
        ("ING-SAUCE-KETCHUP",15),
        ("ING-PICKLE",       15),
        ("ING-PATTY-BEEF",    1),
        ("ING-BUN-BOT",       1),
    ],
    "PROD-DBURGER-BEEF": [
        ("ING-BUN-TOP",       1),
        ("ING-SAUCE-MAYO",   20),
        ("ING-ICEBERG",      20),
        ("ING-TOMATO",       20),
        ("ING-RED-ONION",     6),
        ("ING-SAUCE-KETCHUP",15),
        ("ING-PICKLE",       15),
        ("ING-PATTY-BEEF",    2),
        ("ING-BUN-BOT",       1),
    ],
    "PROD-CHEESEBURGER-BEEF": [
        ("ING-BUN-TOP",           1),
        ("ING-SAUCE-MAYO",       20),
        ("ING-ICEBERG",          20),
        ("ING-TOMATO",           20),
        ("ING-SAUCE-KETCHUP",    15),
        ("ING-PICKLE",           15),
        ("ING-CHEESE-CHEDDAR",   12),
        ("ING-PATTY-BEEF",        1),
        ("ING-BUN-BOT",           1),
    ],
    "PROD-DCHEESE-BEEF": [
        ("ING-BUN-TOP",           1),
        ("ING-SAUCE-MAYO",       20),
        ("ING-ICEBERG",          20),
        ("ING-TOMATO",           20),
        ("ING-SAUCE-KETCHUP",    10),
        ("ING-PICKLE",           15),
        ("ING-CHEESE-CHEDDAR",   12),
        ("ING-PATTY-BEEF",        1),
        ("ING-CHEESE-CHEDDAR",   12),
        ("ING-PATTY-BEEF",        1),
        ("ING-BUN-BOT",           1),
    ],
    "PROD-CHICKENBURGER": [
        ("ING-BUN-TOP",           1),
        ("ING-SAUCE-MAYO",       20),
        ("ING-ICEBERG",          20),
        ("ING-TOMATO",           20),
        ("ING-SAUCE-KETCHUP",    15),
        ("ING-PICKLE",           15),
        ("ING-CHEESE-CHEDDAR",   12),
        ("ING-PATTY-CHICKEN",     1),
        ("ING-BUN-BOT",           1),
    ],
    "PROD-BURGER-ANBAR": [
        ("ING-BUN-TOP",          1),
        ("ING-SAUCE-PANIR",     20),
        ("ING-ICEBERG",         20),
        ("ING-ONION-GRATED",    10),
        ("ING-SAUCE-ANBAR",     20),
        ("ING-PICKLE",          15),
        ("ING-CHEESE-FETA",     12),
        ("ING-PATTY-BEEF",       1),
        ("ING-BUN-BOT",          1),
    ],
    "PROD-CHEESE-SCHNITZEL": [
        ("ING-BUN-TOP",          1),
        ("ING-SAUCE-BURGER",    20),
        ("ING-ICEBERG",         15),
        ("ING-TOMATO",          20),
        ("ING-PICKLE",          10),
        ("ING-RED-ONION",        6),
        ("ING-CHEESE-CHEDDAR",   1),
        ("ING-SCHNITZEL",        1),
        ("ING-BUN-BOT",          1),
    ],
    "PROD-LUXE-SCHNITZEL": [
        ("ING-BUN-TOP",          1),
        ("ING-SAUCE-MUSTARD",    1),
        ("ING-SAUCE-KETCHUP",   10),
        ("ING-PICKLE",           2),
        ("ING-ICEBERG",         10),
        ("ING-TOMATO",          15),
        ("ING-SCHNITZEL",        1),
        ("ING-CHEESE-CHEDDAR",   1),
        ("ING-BUN-BOT",          1),
    ],
    "PROD-CHEESE-STRIPS": [
        ("ING-BUN-TOP",          1),
        ("ING-SAUCE-MUSTARD",    1),
        ("ING-SAUCE-KETCHUP",   10),
        ("ING-PICKLE",           1),
        ("ING-STRIPS-ORIG",      2),
        ("ING-CHEESE-CHEDDAR",   1),
        ("ING-BUN-BOT",          1),
    ],
    "PROD-BROUNSTER": [
        ("ING-TORT-105",         1),
        ("ING-SAUCE-MAYO-MIX",  45),
        ("ING-ICEBERG",         15),
        ("ING-TOMATO",          20),
        ("ING-SCHNITZEL",        2),
        ("ING-CHEESE-CHEDDAR",   1),
        ("ING-HASHBROWN",        1),
    ],
    # ── ХОТ-ДОГҲО ────────────────────────────────────────────────────────────
    "PROD-HOTDOG-CLASSIC": [
        ("ING-BUN-HOTDOG-MINI",  1),
        ("ING-SAUCE-MAYO",       5),
        ("ING-PICKLE",          10),
        ("ING-TOMATO",          15),
        ("ING-SAUSAGE",          1),
        ("ING-SAUCE-KETCHUP",   10),
    ],
    "PROD-HOTDOG-KING": [
        ("ING-BUN-HOTDOG-BIG",   1),
        ("ING-CHEESE-CHEDDAR",   1),
        ("ING-PICKLE",          15),
        ("ING-TOMATO",          20),
        ("ING-SAUSAGE",          2),
        ("ING-SAUCE-KETCHUP",   15),
        ("ING-SAUCE-MAYO",      15),
    ],
    "PROD-HOTDOG-LONGER": [
        ("ING-BUN-HOTDOG-MINI",  1),
        ("ING-SAUCE-MAYO",      10),
        ("ING-SAUCE-KETCHUP",   10),
        ("ING-PICKLE",          10),
        ("ING-ICEBERG",          5),
        ("ING-STRIPS-ORIG",      1),
    ],
    "PROD-HAGGIS-CHICK-CHEESE": [
        ("ING-BUN-HAGGIS",       1),
        ("ING-SAUCE-BBQ",       10),
        ("ING-CHEESE-CHEDDAR",   1),
        ("ING-RED-ONION",        6),
        ("ING-MEAT-CHICKEN",    65),
        ("ING-SAUCE-BBQ",       10),
    ],
    "PROD-HAGGIS-BEEF-CHEESE": [
        ("ING-BUN-HAGGIS",       1),
        ("ING-SAUCE-BBQ",       10),
        ("ING-CHEESE-CHEDDAR",   1),
        ("ING-RED-ONION",        6),
        ("ING-MEAT-BEEF",       65),
        ("ING-SAUCE-BBQ",       10),
    ],
    "PROD-HAGGIS-BEEF": [
        ("ING-BUN-HAGGIS",       1),
        ("ING-SAUCE-BBQ",       10),
        ("ING-RED-ONION",        6),
        ("ING-MEAT-BEEF",       65),
        ("ING-SAUCE-BBQ",       10),
    ],
    "PROD-HAGGIS-CHICKEN": [
        ("ING-BUN-HAGGIS",       1),
        ("ING-SAUCE-BBQ",       10),
        ("ING-RED-ONION",        6),
        ("ING-MEAT-CHICKEN",    65),
        ("ING-SAUCE-BBQ",       10),
    ],
    "PROD-HOTDOG-SLIV": [
        ("ING-BUN-HOTDOG-MINI",  1),
        ("ING-ICEBERG",          1),
        ("ING-SAUSAGE",          1),
        ("ING-SAUCE-KETCHUP",   10),
        ("ING-TOMATO",          20),
        ("ING-FRIES",           30),
        ("ING-SAUCE-WHITE",     40),
    ],
    "PROD-HOTDOG-LAUS": [
        ("ING-BUN-HOTDOG-BIG",   1),
        ("ING-SAUSAGE",          1),
        ("ING-CHEESE-CHEDDAR",  15),
        ("ING-SAUCE-KETCHUP",   10),
        ("ING-CHIPS-CRUSHED",   10),
        ("ING-SAUCE-GARLIC",    20),
    ],
    "PROD-HOTDOG-CLASS2": [
        ("ING-BUN-HOTDOG-MINI",  1),
        ("ING-ICEBERG",          1),
        ("ING-SAUSAGE",          1),
        ("ING-CUCUMBER",         1),
        ("ING-TOMATO",          15),
        ("ING-SAUCE-KETCHUP",   15),
        ("ING-SAUCE-GARLIC",    15),
    ],
    "PROD-HOTDOG-CAESAR": [
        ("ING-BUN-HOTDOG-BIG",   1),
        ("ING-SAUCE-WHITE",     30),
        ("ING-ICEBERG",          1),
        ("ING-SAUSAGE",          1),
        ("ING-BITES",            1),
        ("ING-TOMATO",          20),
        ("ING-SAUCE-GARLIC",    20),
    ],
    "PROD-HOTDOG-MEXICO": [
        ("ING-BUN-HOTDOG-MINI",  1),
        ("ING-SAUSAGE",          1),
        ("ING-BELL-PEPPER",     15),
        ("ING-RED-ONION",       10),
        ("ING-BITES",           50),
        ("ING-SAUCE-KETCHUP",   10),
        ("ING-CHIPS-CRUSHED",   15),
    ],
    "PROD-HOTDOG-AMERICAN": [
        ("ING-BUN-HOTDOG-BIG",   1),
        ("ING-SAUSAGE",          1),
        ("ING-SALAMI",          20),
        ("ING-SAUCE-GARLIC",    15),
        ("ING-CORN",            20),
        ("ING-SAUCE-KETCHUP",   10),
    ],
    "PROD-HOTDOG-ITALIAN": [
        ("ING-BUN-HOTDOG-MINI",  1),
        ("ING-SAUCE-GARLIC",    15),
        ("ING-ICEBERG",          1),
        ("ING-SAUSAGE",          1),
        ("ING-TOMATO",          20),
        ("ING-CHEESE-CHEDDAR",  15),
        ("ING-SAUCE-CHEESE",    15),
    ],
    "PROD-HOTDOG-DANISH": [
        ("ING-BUN-HOTDOG-BIG",   1),
        ("ING-SAUSAGE",          1),
        ("ING-SAUCE-MUSTARD",   10),
        ("ING-PICKLE",          20),
        ("ING-RED-ONION",       15),
        ("ING-SAUCE-KETCHUP",   10),
    ],
    "PROD-HOTDOG-CHEESE": [
        ("ING-BUN-HOTDOG-MINI",  1),
        ("ING-ICEBERG",          1),
        ("ING-SAUSAGE",          1),
        ("ING-CHEESE-FETA",     10),
        ("ING-CHEESE-CHEDDAR",  20),
        ("ING-CHEESE-MOZZ",     20),
        ("ING-SAUCE-CHEESE",    20),
    ],
    "PROD-HOTDOG-ASIAN": [
        ("ING-BUN-HOTDOG-MINI",  1),
        ("ING-SAUCE-SWEETSOUR", 20),
        ("ING-SAUSAGE",          1),
        ("ING-SAUCE-KETCHUP",   20),
        ("ING-KOREAN-CARROT",   30),
        ("ING-CHIPS-CRUSHED",   15),
        ("ING-SAUCE-WHITE",     20),
    ],
    # ── ШАВЕРМА (русский вариант) ─────────────────────────────────────────────
    "PROD-SHAWA-BEEF": [
        ("ING-BREAD-SHAWA",       1),
        ("ING-MEAT-BEEF",       100),
        ("ING-SAUCE-TOMATO",     60),
        ("ING-TOMATO",           20),
        ("ING-CUCUMBER",         15),
        ("ING-CHIPS",             5),
    ],
    "PROD-SHAWA-BEEF-CH": [
        ("ING-BREAD-SHAWA",       1),
        ("ING-MEAT-BEEF",       100),
        ("ING-SAUCE-TOMATO",     60),
        ("ING-TOMATO",           20),
        ("ING-CUCUMBER",         15),
        ("ING-CHIPS",             5),
        ("ING-CHEESE-CHEDDAR",    1),
    ],
    "PROD-SHAWA-BEEF-HOT": [
        ("ING-BREAD-SHAWA",       1),
        ("ING-MEAT-BEEF",       100),
        ("ING-SAUCE-TOMATO-HOT", 60),
        ("ING-TOMATO",           20),
        ("ING-CUCUMBER",         15),
        ("ING-CHIPS",             5),
    ],
    "PROD-SHAWA-CHICK": [
        ("ING-BREAD-SHAWA",       1),
        ("ING-MEAT-CHICKEN",    100),
        ("ING-SAUCE-TOMATO",     60),
        ("ING-TOMATO",           20),
        ("ING-CUCUMBER",         15),
        ("ING-CHIPS",             5),
    ],
    "PROD-SHAWA-CHICK-CH": [
        ("ING-BREAD-SHAWA",       1),
        ("ING-MEAT-CHICKEN",    100),
        ("ING-SAUCE-TOMATO",     60),
        ("ING-TOMATO",           20),
        ("ING-CUCUMBER",         15),
        ("ING-CHIPS",             5),
        ("ING-CHEESE-CHEDDAR",    1),
    ],
    "PROD-SHAWA-CHICK-HOT": [
        ("ING-BREAD-SHAWA",       1),
        ("ING-MEAT-CHICKEN",    100),
        ("ING-SAUCE-TOMATO-HOT", 60),
        ("ING-TOMATO",           20),
        ("ING-CUCUMBER",         15),
        ("ING-CHIPS",             5),
    ],
    "PROD-SHAWA-MINI-BEEF": [
        ("ING-BREAD-SHAWA-MINI",  1),
        ("ING-MEAT-BEEF",        70),
        ("ING-SAUCE-TOMATO",     40),
        ("ING-TOMATO",           10),
        ("ING-CUCUMBER",          8),
        ("ING-CHIPS",             5),
    ],
    "PROD-SHAWA-MINI-CHICK": [
        ("ING-BREAD-SHAWA-MINI",  1),
        ("ING-MEAT-CHICKEN",     70),
        ("ING-SAUCE-TOMATO",     40),
        ("ING-TOMATO",           10),
        ("ING-CUCUMBER",          8),
        ("ING-CHIPS",             5),
    ],
    # ── ШАВЕРМА (тоҷикӣ) ─────────────────────────────────────────────────────
    "PROD-SHAWA-GOV-B": [
        ("ING-BREAD-SHAWA",       1),  # нони шаверма 150гр
        ("ING-TOMATO",           20),
        ("ING-PICKLE",           10),
        ("ING-SAUCE-TOMATO",     85),
        ("ING-MEAT-BEEF",        85),
    ],
    "PROD-SHAWA-GOV-HOT-B": [
        ("ING-BREAD-SHAWA",       1),
        ("ING-TOMATO",           20),
        ("ING-PICKLE",           10),
        ("ING-SAUCE-TOMATO-HOT", 85),
        ("ING-MEAT-BEEF",        85),
    ],
    "PROD-SHAWA-GOV-CH-B": [
        ("ING-BREAD-SHAWA",       1),
        ("ING-TOMATO",           20),
        ("ING-PICKLE",           10),
        ("ING-CHEESE-CHEDDAR",   12),
        ("ING-SAUCE-TOMATO",     85),
        ("ING-MEAT-BEEF",        85),
    ],
    "PROD-SHAWA-GOV-M": [
        ("ING-BREAD-SHAWA-MINI",  1),  # нони шаверма 100гр
        ("ING-TOMATO",           10),
        ("ING-PICKLE",            5),
        ("ING-SAUCE-TOMATO",     65),
        ("ING-MEAT-BEEF",        65),
    ],
    "PROD-SHAWA-GOV-HOT-M": [
        ("ING-BREAD-SHAWA-MINI",  1),
        ("ING-TOMATO",           10),
        ("ING-PICKLE",            5),
        ("ING-SAUCE-TOMATO-HOT", 65),
        ("ING-MEAT-BEEF",        65),
    ],
    "PROD-SHAWA-MURG-B": [
        ("ING-BREAD-SHAWA",       1),
        ("ING-TOMATO",           20),
        ("ING-PICKLE",           10),
        ("ING-SAUCE-TOMATO",     85),
        ("ING-MEAT-CHICKEN",     85),
    ],
    "PROD-SHAWA-MURG-HOT-B": [
        ("ING-BREAD-SHAWA",       1),
        ("ING-TOMATO",           20),
        ("ING-PICKLE",           10),
        ("ING-SAUCE-TOMATO-HOT", 85),
        ("ING-MEAT-CHICKEN",     85),
    ],
    "PROD-SHAWA-MURG-M": [
        ("ING-BREAD-SHAWA-MINI",  1),
        ("ING-TOMATO",           10),
        ("ING-PICKLE",            5),
        ("ING-SAUCE-TOMATO",     65),
        ("ING-MEAT-CHICKEN",     65),
    ],
    "PROD-SHAWA-MURG-HOT-M": [
        ("ING-BREAD-SHAWA-MINI",  1),
        ("ING-TOMATO",           10),
        ("ING-PICKLE",            5),
        ("ING-SAUCE-TOMATO-HOT", 65),
        ("ING-MEAT-CHICKEN",     65),
    ],
    "PROD-SHAWAMITTO-B": [
        ("ING-BREAD-SHAWA",       1),  # нони шаверма 150гр
        ("ING-TOMATO",           20),
        ("ING-PICKLE",           10),
        ("ING-MEAT-CHICKEN",     85),
        ("ING-SAUCE-GARLIC",     85),
    ],
    "PROD-SHAWAMITTO-M": [
        ("ING-BREAD-SHAWA-MINI",  1),  # нони шаверма 100гр
        ("ING-TOMATO",           10),
        ("ING-PICKLE",            5),
        ("ING-MEAT-CHICKEN",     65),
        ("ING-SAUCE-GARLIC",     30),
    ],
    # ── ЛАВАШ (русский) ──────────────────────────────────────────────────────
    "PROD-LAVASH-CHICK": [
        ("ING-LAVASH-BIG",        1),
        ("ING-TOMATO",           20),
        ("ING-CHIPS",            20),
        ("ING-MEAT-CHICKEN",    100),
        ("ING-SAUCE-MAYO",       35),
        ("ING-SAUCE-TOMATO",     80),
    ],
    "PROD-LAVASH-BEEF-CH": [
        ("ING-LAVASH-BIG-CHEESE", 1),
        ("ING-TOMATO",           20),
        ("ING-CHIPS",            20),
        ("ING-MEAT-BEEF",       100),
        ("ING-SAUCE-MAYO",       35),
        ("ING-SAUCE-TOMATO",     80),
        ("ING-CHEESE-CHEDDAR",    1),
    ],
    "PROD-LAVASH-BEEF-HOT": [
        ("ING-LAVASH-BIG-HOT",    1),
        ("ING-TOMATO",           20),
        ("ING-CHIPS",            20),
        ("ING-MEAT-BEEF",       100),
        ("ING-SAUCE-MAYO",       35),
        ("ING-SAUCE-TOMATO-HOT", 80),
    ],
    "PROD-LAVASH-S": [
        ("ING-LAVASH-MINI",       1),
        ("ING-TOMATO",           20),
        ("ING-CHIPS",            10),
        ("ING-MEAT-CHICKEN",     40),
        ("ING-SAUCE-MAYO",       20),
        ("ING-SAUCE-TOMATO",     40),
    ],
    "PROD-LAVASH-MINI-CHICK": [
        ("ING-LAVASH-MINI",       1),
        ("ING-TOMATO",           10),
        ("ING-CHIPS",            15),
        ("ING-MEAT-CHICKEN",     70),
        ("ING-SAUCE-MAYO",       25),
        ("ING-SAUCE-TOMATO",     60),
    ],
    "PROD-LAVASH-MINI-CH": [
        ("ING-LAVASH-MINI-CHEESE",1),
        ("ING-TOMATO",           10),
        ("ING-CHIPS",            15),
        ("ING-MEAT-BEEF",        70),
        ("ING-SAUCE-MAYO",       25),
        ("ING-SAUCE-TOMATO",     60),
        ("ING-CHEESE-CHEDDAR",    1),
    ],
    "PROD-FITROLL": [
        ("ING-LAVASH-GREEN",      1),
        ("ING-ICEBERG",          40),
        ("ING-CUCUMBER",         25),
        ("ING-TOMATO",           30),
        ("ING-MEAT-CHICKEN",     40),
        ("ING-CHEESE-FETA",      35),
        ("ING-SAUCE-MAYO-MIX",   40),
    ],
    # ── ЛАВАШ (тоҷикӣ) ───────────────────────────────────────────────────────
    "PROD-LAV-GOV-B": [
        ("ING-LAVASH-BIG-CHEESE", 1),
        ("ING-SAUCE-TOMATO",     90),
        ("ING-SAUCE-MAYO",       35),
        ("ING-MEAT-BEEF",       100),
        ("ING-CHIPS",            20),
        ("ING-TOMATO",           20),
    ],
    "PROD-LAV-GOV-HOT-B": [
        ("ING-LAVASH-BIG-CHEESE", 1),
        ("ING-SAUCE-TOMATO-HOT", 90),
        ("ING-SAUCE-MAYO",       35),
        ("ING-MEAT-BEEF",       100),
        ("ING-CHIPS",            20),
        ("ING-TOMATO",           20),
    ],
    "PROD-LAV-MURG-M": [
        ("ING-LAVASH-MINI",       1),
        ("ING-SAUCE-TOMATO",     65),
        ("ING-SAUCE-MAYO",       20),
        ("ING-MEAT-CHICKEN",     65),
        ("ING-CHIPS",            13),
        ("ING-TOMATO",           20),
    ],
    "PROD-LAV-GOV-CH-M": [
        ("ING-LAVASH-MINI-CHEESE",1),
        ("ING-CHEESE-CHEDDAR",   12),
        ("ING-SAUCE-TOMATO",     65),
        ("ING-SAUCE-MAYO",       20),
        ("ING-MEAT-BEEF",        65),
        ("ING-CHIPS",            13),
        ("ING-TOMATO",           20),
    ],
    "PROD-LAV-GOV-CH-B": [
        ("ING-LAVASH-BIG-CHEESE", 1),
        ("ING-CHEESE-CHEDDAR",   12),
        ("ING-SAUCE-TOMATO",     90),
        ("ING-SAUCE-MAYO",       35),
        ("ING-MEAT-BEEF",       100),
        ("ING-CHIPS",            20),
        ("ING-TOMATO",           20),
    ],
    "PROD-LAV-GOV-CH-HOT-B": [
        ("ING-LAVASH-BIG-CHEESE", 1),
        ("ING-CHEESE-CHEDDAR",   12),
        ("ING-SAUCE-TOMATO-HOT", 90),
        ("ING-SAUCE-MAYO",       35),
        ("ING-MEAT-BEEF",       100),
        ("ING-CHIPS",            20),
        ("ING-TOMATO",           20),
    ],
    "PROD-LAV-MURG-B": [
        ("ING-LAVASH-BIG-CHEESE", 1),
        ("ING-SAUCE-TOMATO",     90),
        ("ING-SAUCE-MAYO",       35),
        ("ING-MEAT-CHICKEN",    100),
        ("ING-CHIPS",            20),
        ("ING-TOMATO",           20),
    ],
    "PROD-LAV-MURG-HOT-B": [
        ("ING-LAVASH-BIG-CHEESE", 1),
        ("ING-SAUCE-TOMATO-HOT", 90),
        ("ING-SAUCE-MAYO",       35),
        ("ING-MEAT-CHICKEN",    100),
        ("ING-CHIPS",            20),
        ("ING-TOMATO",           20),
    ],
    "PROD-LAV-MURG-CH-M": [
        ("ING-LAVASH-MINI-CHEESE",1),
        ("ING-CHEESE-CHEDDAR",   12),
        ("ING-SAUCE-TOMATO",     65),
        ("ING-SAUCE-MAYO",       20),
        ("ING-MEAT-CHICKEN",     65),
        ("ING-CHIPS",            13),
        ("ING-TOMATO",           20),
    ],
    "PROD-LAV-MURG-CH-B": [
        ("ING-LAVASH-BIG-CHEESE", 1),
        ("ING-CHEESE-CHEDDAR",   12),
        ("ING-SAUCE-TOMATO",     90),
        ("ING-SAUCE-MAYO",       35),
        ("ING-MEAT-CHICKEN",    100),
        ("ING-CHIPS",            20),
        ("ING-TOMATO",           20),
    ],
    "PROD-LAV-MURG-CH-HOT-B": [
        ("ING-LAVASH-BIG-CHEESE", 1),
        ("ING-CHEESE-CHEDDAR",   12),
        ("ING-SAUCE-TOMATO-HOT", 90),
        ("ING-SAUCE-MAYO",       35),
        ("ING-MEAT-CHICKEN",    100),
        ("ING-CHIPS",            20),
        ("ING-TOMATO",           20),
    ],
    # ── РОЛЛҲО ───────────────────────────────────────────────────────────────
    "PROD-ROLL-BEEF": [
        ("ING-TORT-CLASSIC",      1),
        ("ING-PICKLE",           10),
        ("ING-FRIES",            30),
        ("ING-SAUCE-MAYO-MIX",   40),
        ("ING-MEAT-BEEF",        70),
    ],
    "PROD-ROLL-CHICK": [
        ("ING-TORT-CLASSIC",      1),
        ("ING-PICKLE",           10),
        ("ING-FRIES",            30),
        ("ING-SAUCE-MAYO-MIX",   40),
        ("ING-MEAT-CHICKEN",     70),
    ],
    "PROD-ROLL-MINI-CHICK": [
        ("ING-TORT-MINI",         1),
        ("ING-FRIES",            20),
        ("ING-SAUCE-GARLIC",     20),
        ("ING-MEAT-CHICKEN",     40),
    ],
    "PROD-ROLL-CRISPY": [
        ("ING-TORT-105",          1),
        ("ING-SAUCE-MAYO-MIX",   30),
        ("ING-ICEBERG",          10),
        ("ING-TOMATO",           18),
        ("ING-STRIPS-ORIG",       2),
    ],
    "PROD-ROLL-CRISPY-HOT": [
        ("ING-TORT-105",          1),
        ("ING-SAUCE-CHEESE",     45),
        ("ING-ICEBERG",          20),
        ("ING-JALAPENO",          4),
        ("ING-FRIES",            10),
        ("ING-STRIPS-HOT",        2),
    ],
    "PROD-ROLL-KIDS": [
        ("ING-TORT-8-CHEESE",     1),
        ("ING-CHEESE-CHEDDAR",    1),
        ("ING-SAUCE-MUSTARD",     1),
        ("ING-SAUCE-KETCHUP",    10),
        ("ING-PICKLE",            2),
        ("ING-STRIPS-ORIG",       1),
    ],
    "PROD-ROLL-BROUNSTER": [
        ("ING-TORT-105",          1),
        ("ING-SAUCE-MAYO-MIX",   45),
        ("ING-ICEBERG",          15),
        ("ING-TOMATO",           20),
        ("ING-SCHNITZEL",         2),
        ("ING-CHEESE-CHEDDAR",    1),
        ("ING-HASHBROWN",         1),
    ],
    "PROD-ROLL-KATTACHA": [
        ("ING-TORT-12",           1),
        ("ING-SAUCE-MAYO-MIX",   30),
        ("ING-SAUCE-KETCHUP",    20),
        ("ING-PICKLE",            4),
        ("ING-ICEBERG",          40),
        ("ING-TOMATO",           20),
        ("ING-FRIES",            20),
        ("ING-STRIPS-ORIG",       3),
    ],
    "PROD-TRIANGL-BEEF": [
        ("ING-TORT-CHEESE",       1),
        ("ING-SAUCE-TRIANGLE",   40),
        ("ING-MEAT-BEEF",        85),
        ("ING-TOMATO",           30),
        ("ING-CHEESE-CHEDDAR",    1),
    ],
    "PROD-TRIANGL-CHICK": [
        ("ING-TORT-CLASSIC",      1),
        ("ING-SAUCE-TRIANGLE",   40),
        ("ING-MEAT-CHICKEN",     85),
        ("ING-TOMATO",           30),
        ("ING-CHEESE-CHEDDAR",    1),
    ],
    "PROD-TRIANGL-ANBAR": [
        ("ING-TORT-WHITE-60",     1),
        ("ING-CHEESE-FETA",      12),
        ("ING-TOMATO",           30),
        ("ING-SAUCE-ANBAR",      20),
        ("ING-MEAT-CHICKEN",     85),
        ("ING-SAUCE-TRIANGLE",   20),
    ],
    "PROD-LAVASHITTO-B": [
        ("ING-LAVASH-BIG",        1),  # лаваш 90гр
        ("ING-MEAT-CHICKEN",    100),
        ("ING-SAUCE-GARLIC",     60),
        ("ING-RED-CABBAGE",      30),
        ("ING-TOMATO",           20),
    ],
    "PROD-LAVASHITTO-M": [
        ("ING-LAVASH-MINI",       1),  # лаваш 60гр
        ("ING-MEAT-CHICKEN",     65),
        ("ING-SAUCE-GARLIC",     40),
        ("ING-RED-CABBAGE",      20),
        ("ING-TOMATO",           20),
    ],
    # ── ДОНАР БЛЮДА ──────────────────────────────────────────────────────────
    "PROD-DONAR-PLATE-BEEF": [
        ("ING-DONAR-TRAY",        1),
        ("ING-MEAT-BEEF",       130),
        ("ING-FRIES",            60),  # готовой (сырой 70гр)
        ("ING-RICE",             80),
        ("ING-RED-CABBAGE-SALAD",80),
        ("ING-SAUCE-TOMATO",     50),
        ("ING-BAGUETTE",          1),
    ],
    "PROD-DONAR-PLATE-CHICK": [
        ("ING-DONAR-TRAY",        1),
        ("ING-MEAT-CHICKEN",    130),
        ("ING-FRIES",            60),
        ("ING-RICE",             80),
        ("ING-RED-CABBAGE-SALAD",80),
        ("ING-SAUCE-TOMATO",     50),
        ("ING-BAGUETTE",          1),
    ],
    "PROD-HUROKI-GOV": [
        ("ING-BAGUETTE",          1),  # нон 70гр
        ("ING-MEAT-BEEF",       135),
        ("ING-FRIES",            85),
        ("ING-RICE",             90),
        ("ING-SAUCE-TOMATO",     50),
        ("ING-RED-CABBAGE-SALAD",90),
        ("ING-DONAR-TRAY",        1),  # кутти 5 тага 60гр
    ],
    "PROD-HUROKI-MURG": [
        ("ING-BAGUETTE",          1),
        ("ING-MEAT-CHICKEN",    135),
        ("ING-FRIES",            85),
        ("ING-RICE",             90),
        ("ING-SAUCE-TOMATO",     50),
        ("ING-RED-CABBAGE-SALAD",90),
        ("ING-DONAR-TRAY",        1),
    ],
    "PROD-HUROKI-IFTAR-K": [
        ("ING-TORT-CLASSIC",      1),  # тортилья 55гр
        ("ING-KOFTE",             5),
        ("ING-RICE",             90),
        ("ING-SAUCE-IFTAR",      50),
        ("ING-RED-CABBAGE-SALAD",90),
        ("ING-DONAR-TRAY",        1),
    ],
    "PROD-HUROKI-IFTAR-S": [
        ("ING-TORT-CLASSIC",      1),
        ("ING-STRIPS-ORIG",     145),
        ("ING-RICE",             90),
        ("ING-SAUCE-IFTAR",      50),
        ("ING-RED-CABBAGE-SALAD",90),
        ("ING-DONAR-TRAY",        1),
    ],
    # ── ДОНАР СЭНДВИЧ ────────────────────────────────────────────────────────
    "PROD-GERMAN-BEEF": [
        ("ING-BREAD-GERMAN",      1),
        ("ING-SAUCE-GARLIC",     30),
        ("ING-RED-CABBAGE-SALAD",40),
        ("ING-MEAT-BEEF",       100),
        ("ING-SAUCE-TOMATO",     30),
        ("ING-TOMATO",           10),
        ("ING-ICEBERG",          20),
    ],
    "PROD-GERMAN-CHICK": [
        ("ING-BREAD-GERMAN",      1),
        ("ING-SAUCE-GARLIC",     30),
        ("ING-RED-CABBAGE-SALAD",40),
        ("ING-MEAT-CHICKEN",    100),
        ("ING-SAUCE-TOMATO",     30),
        ("ING-TOMATO",           10),
        ("ING-ICEBERG",          20),
    ],
    "PROD-SANDWICH-CLUB": [
        ("ING-BREAD-TOAST",       1),
        ("ING-SAUCE-CLUB",       20),
        ("ING-TOMATO",           30),
        ("ING-CHEESE-HOHLND",     1),
        ("ING-BREAD-TOAST",       1),
        ("ING-SAUCE-CLUB",       20),
        ("ING-CUCUMBER",         30),
        ("ING-SCHNITZEL",         1),
        ("ING-BREAD-TOAST",       1),
        ("ING-SAUCE-CLUB",       20),
    ],
    "PROD-SANDWICH": [
        ("ING-BREAD-TOAST",       1),
        ("ING-SAUCE-CLUB",       20),
        ("ING-TOMATO",           30),
        ("ING-CHEESE-HOHLND",     1),
        ("ING-BREAD-TOAST",       1),
        ("ING-SAUCE-CLUB",       20),
        ("ING-CUCUMBER",         30),
        ("ING-SCHNITZEL",         1),
        ("ING-BREAD-TOAST",       1),
        ("ING-SAUCE-CLUB",       20),
    ],
    # ── НАПИТКИ ──────────────────────────────────────────────────────────────
    "PROD-MOJITO-CLASSIC": [
        ("ING-CUP-05",            1),
        ("ING-SYR-MOJITO",       63),
        ("ING-LEMON-SLICE",      20),
        ("ING-MINT",              4),
        ("ING-ICE",               4),
        ("ING-SODA",            340),
    ],
    "PROD-MOJITO-STRAW": [
        ("ING-CUP-05",            1),
        ("ING-SYR-STRAWBERRY",   63),
        ("ING-LEMON-SLICE",      20),
        ("ING-MINT",              4),
        ("ING-ICE",               4),
        ("ING-SODA",            340),
    ],
    "PROD-LEMONADE-DUCHESS": [
        ("ING-CUP-04",            1),
        ("ING-SYR-DUCHESS",      63),
        ("ING-SODA",            340),
    ],
    "PROD-LEMONADE-POMEGR": [
        ("ING-CUP-04",            1),
        ("ING-SYR-POMEGRANATE",  63),
        ("ING-SODA",            340),
    ],
    "PROD-LEMONADE-PASSION": [
        ("ING-CUP-05",            1),
        ("ING-SYR-PASSIONFRUIT", 63),
        ("ING-LEMON-FRESH",      30),
        ("ING-LEMON",            10),
        ("ING-SODA",            150),
    ],
    "PROD-LEMONADE-STRAW": [
        ("ING-CUP-05",            1),
        ("ING-SYR-STRAWBERRY2",  63),
        ("ING-LEMON-FRESH",      30),
        ("ING-LEMON",            10),
        ("ING-SODA",            150),
    ],
    "PROD-DRINK-CHERRY-POMEGR": [
        ("ING-CUP-04",            1),
        ("ING-PUREE-CHERRY",     30),
        ("ING-SYR-GRENADINE",    30),
        ("ING-ICE",               5),
        ("ING-SODA",            300),
    ],
    "PROD-DRINK-MANGO-PASSION": [
        ("ING-CUP-04",            1),
        ("ING-PUREE-MANGO",      30),
        ("ING-PUREE-PASSIONFRUIT",30),
        ("ING-ICE",               5),
        ("ING-SODA",            300),
    ],
    # ── САЛАТҲО ──────────────────────────────────────────────────────────────
    "PROD-SALAD-GREEK": [
        ("ING-BOWL",             20),
        ("ING-ICEBERG",          40),
        ("ING-TOMATO",           45),
        ("ING-CUCUMBER",         40),
        ("ING-CHEESE-FETA",      35),
        ("ING-OLIVES",           15),
        ("ING-SAUCE-GREEK",      15),
    ],
    "PROD-SALAD-CAESAR": [
        ("ING-BOWL",             20),
        ("ING-ICEBERG",          40),
        ("ING-TOMATO",           45),
        ("ING-CROUTONS",         10),
        ("ING-CHEESE-GRATED",   10),
        ("ING-STRIPS-ORIG",      65),
        ("ING-SAUCE-CAESAR",     25),
    ],
}


class Command(BaseCommand):
    help = "Ҳамаи маҳсулотҳо ва ингредиентҳои DEDI-ро аз расмҳои Telegram илова мекунад (8-9 март, 11 май)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Пеш аз илова кардан маҳсулотҳои мавҷударо нест кунед",
        )

    def handle(self, *args, **options):
        with transaction.atomic():
            if options["clear"]:
                self._clear()
            ing_map = self._create_ingredients()
            prod_map = self._create_products()
            self._create_recipes(ing_map, prod_map)

        total_ing = len(ing_map)
        total_prod = len(prod_map)
        total_rec = sum(len(v) for v in RECIPES.values())
        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Тайёр! Ингредиентҳо: {total_ing}, Маҳсулотҳо: {total_prod}, Граммовка: {total_rec} сатр"
        ))

    def _clear(self):
        ProductIngredient.objects.all().delete()
        Product.objects.filter(is_ingredient=False).exclude(
            sku__startswith="PROD-BT"
        ).delete()
        self.stdout.write(self.style.WARNING("🗑  Маҳсулотҳои кӯҳна нест шуданд"))

    def _create_ingredients(self):
        cat, _ = Category.objects.get_or_create(name="Ингредиентҳо")
        ing_map = {}
        created = 0
        for name, sku in INGREDIENTS:
            p, new = Product.objects.get_or_create(
                sku=sku,
                defaults=dict(
                    name=name,
                    price=0,
                    category=cat,
                    is_ingredient=True,
                    is_active=True,
                    stock_quantity=0,
                ),
            )
            if new:
                created += 1
            ing_map[sku] = p
        self.stdout.write(f"🧪 Ингредиентҳо: {created} нав, {len(ing_map)-created} мавҷуд буд")
        return ing_map

    def _create_products(self):
        prod_map = {}
        created = 0
        for name, sku, cat_name in PRODUCTS:
            cat, _ = Category.objects.get_or_create(name=cat_name)
            p, new = Product.objects.get_or_create(
                sku=sku,
                defaults=dict(
                    name=name,
                    price=0,
                    category=cat,
                    is_ingredient=False,
                    is_active=True,
                ),
            )
            if new:
                created += 1
                self.stdout.write(f"  🍔 {name}")
            prod_map[sku] = p
        self.stdout.write(f"🍽  Маҳсулотҳо: {created} нав")
        return prod_map

    def _create_recipes(self, ing_map, prod_map):
        created = 0
        skipped = 0
        for prod_sku, lines in RECIPES.items():
            prod = prod_map.get(prod_sku)
            if not prod:
                continue
            # Барои маҳсулоти такрорӣ (мисли тостер хлеб) - аввал тоза мекунем
            ProductIngredient.objects.filter(product=prod).delete()
            for ing_sku, qty in lines:
                ing = ing_map.get(ing_sku)
                if not ing:
                    self.stdout.write(
                        self.style.WARNING(f"  ⚠ Ингредиент топилмади: {ing_sku}")
                    )
                    skipped += 1
                    continue
                # Агар як маҳсулот ду маротиба ингредиент дошта бошад, миқдорро ҷамъ мекунем
                obj, new = ProductIngredient.objects.get_or_create(
                    product=prod,
                    ingredient=ing,
                    defaults={"quantity": qty},
                )
                if not new:
                    obj.quantity += qty
                    obj.save()
                created += 1
        self.stdout.write(f"📋 Граммовка: {created} сатр, {skipped} гум шуд")
