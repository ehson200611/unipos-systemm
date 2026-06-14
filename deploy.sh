#!/bin/bash
# ================================================
# Bubble Tea POS — Server Deploy Script
# Run: bash deploy.sh
# ================================================
set -e

APP_DIR="/opt/bubbletea"
REPO="https://github.com/ehson200611/unipos-systemm.git"
DOMAIN="5.42.113.132"

echo "=== [1/7] Пакетҳоро нав карданом ==="
apt-get update -y
apt-get install -y python3 python3-pip python3-venv nginx git curl

echo "=== [2/7] Node.js 20 насб мекунем ==="
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v && npm -v

echo "=== [3/7] Репозиторийро клон мекунем ==="
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR" && git pull origin main
else
  git clone "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# ── Backend ───────────────────────────────────────────────────
echo "=== [4/7] Backend (Django) танзим мекунем ==="
cd "$APP_DIR/pos-server"

python3 -m venv .venv
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

# .env файл — SQLite-ро истифода мебарем
cat > .env << 'ENVEOF'
SECRET_KEY=bubbletea-prod-secret-key-change-this-2024
DEBUG=False
ALLOWED_HOSTS=5.42.113.132,localhost,127.0.0.1
DB_ENGINE=sqlite
CORS_ALLOW_ALL=True
CORS_ALLOWED_ORIGINS=http://5.42.113.132,http://5.42.113.132:80
ENVEOF

python manage.py migrate --noinput
python manage.py collectstatic --noinput

# Superuser (агар мавҷуд набошад)
python manage.py shell -c "
from django.contrib.auth import get_user_model
U = get_user_model()
if not U.objects.filter(username='admin').exists():
    u = U.objects.create_superuser('admin', 'admin@bubbletea.tj', 'admin123')
    u.first_name = 'Admin'
    u.role = 'admin'
    u.save()
    print('Admin created: admin / admin123')
else:
    print('Admin already exists')
"

deactivate

# ── Systemd — Gunicorn ────────────────────────────────────────
echo "=== [5/7] Gunicorn systemd сервис ==="
cat > /etc/systemd/system/bubbletea.service << SVCEOF
[Unit]
Description=Bubble Tea POS Backend
After=network.target

[Service]
WorkingDirectory=$APP_DIR/pos-server
ExecStart=$APP_DIR/pos-server/.venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 3
Restart=always
RestartSec=3
Environment=DJANGO_SETTINGS_MODULE=config.settings

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable bubbletea
systemctl restart bubbletea
sleep 2
systemctl status bubbletea --no-pager | head -10

# ── Frontend ──────────────────────────────────────────────────
echo "=== [6/7] Frontend (React) build мекунем ==="
cd "$APP_DIR/pos-frontend"
npm install
VITE_API_URL="http://$DOMAIN/api" npm run build

# ── Nginx ─────────────────────────────────────────────────────
echo "=== [7/7] Nginx танзим мекунем ==="
cat > /etc/nginx/sites-available/bubbletea << NGINXEOF
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend — React
    root $APP_DIR/pos-frontend/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /static/ {
        alias $APP_DIR/pos-server/staticfiles/;
    }

    location /media/ {
        alias $APP_DIR/pos-server/media/;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/bubbletea /etc/nginx/sites-enabled/bubbletea
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo ""
echo "============================================"
echo "  МУВАФФАҚИЯТНОК!"
echo "============================================"
echo "  Сайт:  http://$DOMAIN"
echo "  Admin: http://$DOMAIN/admin"
echo "  Login: admin / admin123"
echo "============================================"
echo ""
echo "Логинро иваз кунед:"
echo "  cd $APP_DIR/pos-server"
echo "  source .venv/bin/activate"
echo "  python manage.py changepassword admin"
