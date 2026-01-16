#!/bin/bash

# AlgoBot Production Deployment Script
# Run this script on your VPS server to deploy the application

set -e  # Exit on any error

echo "🚀 Starting AlgoBot Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo access."
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ if not installed
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
fi

# Install MongoDB if not installed
if ! command -v mongod &> /dev/null; then
    print_status "Installing MongoDB..."
    sudo apt-get install gnupg curl
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
       sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
       --dearmor
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org
    sudo systemctl start mongod
    sudo systemctl enable mongod
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    sudo apt install -y nginx
fi

# Install Certbot for SSL
if ! command -v certbot &> /dev/null; then
    print_status "Installing Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
fi

# Create application directory
APP_DIR="/var/www/algobot"
if [ ! -d "$APP_DIR" ]; then
    print_status "Creating application directory..."
    sudo mkdir -p $APP_DIR
    sudo chown -R $USER:$USER $APP_DIR
fi

# Clone or update the repository
if [ ! -d "$APP_DIR/.git" ]; then
    print_status "Cloning repository..."
    git clone https://github.com/mahesh42646/Algo.git $APP_DIR
else
    print_status "Updating repository..."
    cd $APP_DIR
    git pull origin main
fi

cd $APP_DIR

# Install dependencies
print_status "Installing backend dependencies..."
cd backend
npm install --production

print_status "Installing frontend dependencies..."
cd ..
npm install --production

# Build frontend
print_status "Building frontend..."
npm run build:prod

# Create environment files (you need to update these with your actual values)
print_status "Setting up environment files..."

# Backend production environment
# Generate encryption key for production
ENCRYPTION_KEY=$(openssl rand -base64 32)

cat > backend/.env.production << EOL
NODE_ENV=production
BACKEND_PORT=4006
MONGODB_URI=mongodb://localhost:27017/algobot_prod
JWT_SECRET=your-production-jwt-secret-change-this-$(openssl rand -hex 32)
SESSION_SECRET=your-production-session-secret-change-this-$(openssl rand -hex 32)
ENCRYPTION_KEY=${ENCRYPTION_KEY}
CORS_ORIGIN=https://algo.skylith.cloud
ENABLE_REQUEST_LOGGING=false
API_BASE_URL=https://algo.skylith.cloud/api
RATE_LIMIT_WINDOW_MS=15
RATE_LIMIT_MAX_REQUESTS=100
EOL

print_status "Generated ENCRYPTION_KEY for production (saved to backend/.env.production)"

# Frontend production environment
cat > .env.production << EOL
NEXT_PUBLIC_API_URL=https://algo.skylith.cloud/api
NEXT_PUBLIC_APP_URL=https://algo.skylith.cloud
NEXTAUTH_SECRET=your-production-nextauth-secret-change-this-$(openssl rand -hex 32)
NEXTAUTH_URL=https://algo.skylith.cloud
NODE_ENV=production
NEXT_OUTPUT_MODE=standalone
EOL

print_warning "IMPORTANT: Update the .env files with your actual secrets and configuration!"

# Setup PM2 processes
print_status "Setting up PM2 processes..."

# Backend process
pm2 delete algobot-backend 2>/dev/null || true
pm2 start backend/server.js --name "algobot-backend" --env production
pm2 save

# Frontend process
pm2 delete algobot-frontend 2>/dev/null || true
pm2 start npm --name "algobot-frontend" -- start:prod
pm2 save

# Setup Nginx
print_status "Configuring Nginx..."

sudo tee /etc/nginx/sites-available/algobot << EOL
# Upstream for backend
upstream backend_server {
    server 127.0.0.1:4006;
}

# Frontend server
server {
    listen 80;
    server_name algo.skylith.cloud;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend files
    location / {
        proxy_pass http://127.0.0.1:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API routes
    location /api/ {
        proxy_pass http://backend_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Redirect HTTP to HTTPS (uncomment after SSL setup)
# server {
#     listen 80;
#     server_name algo.skylith.cloud;
#     return 301 https://\$server_name\$request_uri;
# }
EOL

# Enable the site
sudo ln -sf /etc/nginx/sites-available/algobot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL with Certbot (optional)
read -p "Do you want to setup SSL with Let's Encrypt? (y/n): " setup_ssl
if [[ $setup_ssl =~ ^[Yy]$ ]]; then
    print_status "Setting up SSL..."
    sudo certbot --nginx -d algo.skylith.cloud
    print_success "SSL setup complete!"
fi

# Setup firewall
print_status "Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Setup log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/algobot << EOL
/var/www/algobot/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOL

print_success "🎉 AlgoBot deployment completed!"
echo ""
echo "Next steps:"
echo "1. Update the .env files with your actual secrets"
echo "2. Configure your domain DNS to point to this server"
echo "3. Test the application: https://algo.skylith.cloud"
echo "4. Setup SSL if not done already: sudo certbot --nginx -d algo.skylith.cloud"
echo ""
echo "Useful commands:"
echo "- Check PM2 status: pm2 status"
echo "- View logs: pm2 logs"
echo "- Restart services: pm2 restart all"
echo "- Update app: cd $APP_DIR && git pull && npm run prod:full"