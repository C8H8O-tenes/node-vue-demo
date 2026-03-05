#!/bin/bash

# AREK deployment script with GitHub sync.
# Deploys to path-prefix /AREK/ and keeps RMzyme routes untouched.

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
GIT_REPO="${GIT_REPO:-https://github.com/C8H8O-tenes/node-vue-demo.git}"
GIT_BRANCH="${GIT_BRANCH:-main}"

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
command_exists() { command -v "$1" >/dev/null 2>&1; }

print_status "Checking prerequisites..."
if ! command_exists git; then
  print_error "git is not installed"
  exit 1
fi
if ! command_exists pm2; then
  print_error "pm2 is not installed"
  exit 1
fi
print_success "Basic prerequisites check passed"

# Step 1: Sync source from GitHub
print_status "Syncing source from GitHub..."
if [ ! -d "$PROJECT_DIR/.git" ]; then
  sudo mkdir -p "$(dirname "$PROJECT_DIR")"
  if [ -d "$PROJECT_DIR" ] && [ "$(ls -A "$PROJECT_DIR" 2>/dev/null)" ]; then
    print_error "Project directory exists and is not empty: $PROJECT_DIR"
    print_error "Please clean it first or use another path."
    exit 1
  fi
  sudo rm -rf "$PROJECT_DIR"
  sudo git clone -b "$GIT_BRANCH" "$GIT_REPO" "$PROJECT_DIR"
else
  cd "$PROJECT_DIR"
  if [ -n "$(git status --porcelain)" ]; then
    print_error "Local changes detected in $PROJECT_DIR. Commit/stash before deploy."
    exit 1
  fi
  sudo git fetch origin
  sudo git checkout "$GIT_BRANCH"
  sudo git pull --ff-only origin "$GIT_BRANCH"
fi
print_success "Source synced: $GIT_REPO ($GIT_BRANCH)"

# Step 2: Build frontend and deploy dist
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

# Step 3: Update nginx snippet
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

# Step 4: Restart backend via PM2
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

# Step 5: Reload nginx
if command_exists nginx; then
  print_status "Reloading nginx..."
  sudo systemctl reload nginx
  print_success "Nginx reloaded"
fi

echo "Deployment finished."
echo "Path prefix reserved: /AREK/"
echo "Backend port reserved: 8081"
