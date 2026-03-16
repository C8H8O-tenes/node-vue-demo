#!/bin/bash

# AREK deployment script.
# Assumes the repository has already been updated manually in /data/vue_AREK.

set -e

echo "Starting AREK deployment..."

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="/data/vue_AREK"
FRONTEND_DIR="$PROJECT_DIR/AREK_vuecode"
BACKEND_DIR="$PROJECT_DIR/AREK_backend"
PROD_DIR="/data/AREK_PROD"
NGINX_CONFIG_SOURCE="$PROJECT_DIR/rh-luo.cn.arek.conf"
NGINX_CONFIG_DEST="/etc/nginx/snippets/rh-luo.cn-arek-paths.conf"
PM2_APP_NAME="arek-backend"

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
command_exists() { command -v "$1" >/dev/null 2>&1; }

print_status "Checking prerequisites..."
if ! command_exists pm2; then
  print_error "pm2 is not installed"
  exit 1
fi
print_success "Basic prerequisites check passed"

print_status "Checking project directories..."
if [ ! -d "$PROJECT_DIR" ]; then
  print_error "Project directory not found: $PROJECT_DIR"
  print_error "Update the repo manually first, then rerun this script."
  exit 1
fi
if [ ! -d "$FRONTEND_DIR" ] && [ ! -d "$BACKEND_DIR" ]; then
  print_error "Neither frontend nor backend directory exists under $PROJECT_DIR"
  exit 1
fi
print_success "Project directory check passed"

# Step 1: Build frontend and deploy dist
if [ -d "$FRONTEND_DIR" ] && [ -f "$FRONTEND_DIR/package.json" ]; then
  print_status "Building frontend..."
  cd "$FRONTEND_DIR"
  [ -d node_modules ] || npm install
  npm run build
  sudo mkdir -p "$PROD_DIR"
  sudo rm -rf "$PROD_DIR"/*
  sudo cp -r dist/* "$PROD_DIR/"
  sudo chown -R www-data:www-data "$PROD_DIR"
  sudo chmod -R 755 "$PROD_DIR"
  print_success "Frontend deployed to $PROD_DIR"
else
  print_warning "Frontend not ready, skipping build/deploy"
fi

# Step 2: Update nginx snippet
if [ -f "$NGINX_CONFIG_SOURCE" ]; then
  print_status "Installing nginx snippet..."
  sudo mkdir -p /etc/nginx/snippets
  sudo cp "$NGINX_CONFIG_SOURCE" "$NGINX_CONFIG_DEST"
  sudo nginx -t
  print_success "Nginx snippet installed and validated"
  print_warning "Ensure your main rh-luo.cn 443 server block includes:"
  print_warning "  include /etc/nginx/snippets/rh-luo.cn-arek-paths.conf;"
else
  print_warning "Nginx config source not found: $NGINX_CONFIG_SOURCE"
fi

# Step 3: Restart backend via PM2
if [ -d "$BACKEND_DIR" ] && [ -f "$PROJECT_DIR/ecosystem.config.js" ]; then
  print_status "Restarting backend with PM2..."
  cd "$PROJECT_DIR"
  sudo pm2 delete "$PM2_APP_NAME" 2>/dev/null || true
  sudo pm2 start ecosystem.config.js
  sudo pm2 save
  print_success "Backend restarted"
else
  print_warning "Backend not ready, skipping PM2 start"
fi

# Step 4: Reload nginx
if command_exists nginx; then
  print_status "Reloading nginx..."
  sudo systemctl reload nginx
  print_success "Nginx reloaded"
fi

echo "Deployment finished."
echo "Path prefix reserved: /AREK/"
echo "Backend port reserved: 8081"
