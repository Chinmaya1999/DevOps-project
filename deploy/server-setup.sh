#!/usr/bin/env bash
# One-time setup of a fresh Amazon Linux 2023 server for DeployDojo.
# Installs Docker, Nginx and Certbot, adds swap, and wires up the reverse proxy for:
#   deploydojo.cmcloud.online -> frontend container (127.0.0.1:3000)
#   api.cmcloud.online        -> backend container  (127.0.0.1:5001, incl. WebSockets)
#   cmcloud.online / www      -> redirect to deploydojo.cmcloud.online
# Safe to run again.   Usage:  sudo bash server-setup.sh you@example.com
set -euo pipefail

EMAIL="${1:?usage: sudo bash server-setup.sh you@example.com}"
APP_HOST="deploydojo.cmcloud.online"
API_HOST="api.cmcloud.online"
OLD_HOSTS="cmcloud.online www.cmcloud.online"

echo "==> Packages"
dnf -y install docker nginx python3 augeas-libs >/dev/null
systemctl enable --now docker >/dev/null
usermod -aG docker ec2-user || true

echo "==> Swap (2 GB; small servers run out of memory otherwise)"
if ! swapon --show | grep -q /swapfile; then
  [ -f /swapfile ] || { fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null; }
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Certbot (official pip install, isolated virtualenv)"
if [ ! -x /opt/certbot/bin/certbot ]; then
  python3 -m venv /opt/certbot
  /opt/certbot/bin/pip install --quiet --upgrade pip
  /opt/certbot/bin/pip install --quiet certbot certbot-nginx
fi
ln -sf /opt/certbot/bin/certbot /usr/local/bin/certbot

echo "==> Nginx reverse proxy"
cat > /etc/nginx/conf.d/deploydojo.conf <<NGINX
# WebSocket upgrade support (Socket.IO chat)
map \$http_upgrade \$connection_upgrade { default upgrade; '' close; }

server {
    listen 80;
    listen [::]:80;
    server_name ${APP_HOST};
    client_max_body_size 5m;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name ${API_HOST};
    client_max_body_size 5m;
    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        proxy_read_timeout 600s;   # long deployments and WebSockets
        proxy_send_timeout 600s;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name ${OLD_HOSTS};
    return 301 https://${APP_HOST}\$request_uri;
}
NGINX
nginx -t
systemctl enable --now nginx >/dev/null
systemctl reload nginx

echo "==> HTTPS certificates (Let's Encrypt)"
HOSTS="-d ${APP_HOST} -d ${API_HOST}"
for h in ${OLD_HOSTS}; do HOSTS="$HOSTS -d $h"; done
certbot --nginx $HOSTS --non-interactive --agree-tos -m "$EMAIL" --redirect --no-eff-email

echo "==> Automatic renewal (twice a day, systemd timer)"
cat > /etc/systemd/system/certbot-renew.service <<'UNIT'
[Unit]
Description=Renew Let's Encrypt certificates
[Service]
Type=oneshot
ExecStart=/opt/certbot/bin/certbot renew --quiet --deploy-hook "systemctl reload nginx"
UNIT
cat > /etc/systemd/system/certbot-renew.timer <<'UNIT'
[Unit]
Description=Twice-daily certificate renewal check
[Timer]
OnCalendar=*-*-* 03,15:00:00
RandomizedDelaySec=1800
Persistent=true
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now certbot-renew.timer >/dev/null

echo "==> Done. Docker: $(docker --version)  Nginx: $(nginx -v 2>&1)"
