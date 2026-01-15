# AlgoBot - Trading Platform

AlgoBot is a comprehensive cryptocurrency trading platform with web and mobile applications, featuring exchange API integration, real-time trading, and advanced analytics.

## 🏗️ Architecture

- **Frontend**: Next.js web application (Port 3006)
- **Backend**: Node.js/Express API server (Port 4006)
- **Mobile**: Flutter application
- **Database**: MongoDB
- **Authentication**: Firebase Auth

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Flutter SDK (for mobile development)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/mahesh42646/Algo.git
   cd algobot
   ```

2. **Install dependencies**
   ```bash
   # Install all dependencies
   npm install

   # Install backend dependencies
   cd backend && npm install && cd ..
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp .env.local.example .env.local
   cp backend/.env.local.example backend/.env.local
   cp algobot_app/.env.local.example algobot_app/.env.local
   ```

4. **Start development servers**
   ```bash
   # Start both frontend and backend
   npm run dev:full

   # Or start individually:
   # Backend (port 4006)
   npm run server:dev

   # Frontend (port 3006)
   npm run dev
   ```

5. **Start mobile app**
   ```bash
   cd algobot_app
   flutter pub get
   flutter run
   ```

## 🌐 Production Deployment

### VPS Deployment (Recommended)

1. **Server Prerequisites**
   ```bash
   # Ubuntu/Debian server with:
   - Node.js 18+
   - MongoDB
   - Nginx
   - PM2
   - SSL certificate (Let's Encrypt)
   ```

2. **Deploy using script**
   ```bash
   # Upload project to your VPS
   scp -r . user@your-server:/path/to/project/

   # Run deployment script
   ./deploy.sh
   ```

3. **Manual deployment**
   ```bash
   # Install dependencies
   npm install --production
   cd backend && npm install --production && cd ..

   # Build frontend
   npm run build:prod

   # Start with PM2
   pm2 start backend/server.js --name "algobot-backend" --env production
   pm2 start npm --name "algobot-frontend" -- start:prod
   pm2 save
   ```

### Environment URLs
- **Frontend**: https://algo.skylith.cloud (Port 3006)
- **Backend API**: https://algo.skylith.cloud/api (Port 4006)
- **Mobile App**: Uses live API endpoints automatically

## 🔧 Configuration

### Environment Files

#### Frontend (.env.local / .env.production)
```env
NEXT_PUBLIC_API_URL=https://algo.skylith.cloud/api
NEXT_PUBLIC_APP_URL=https://algo.skylith.cloud
NEXTAUTH_SECRET=your-secret-here
NODE_ENV=production
```

#### Backend (backend/.env.local / backend/.env.production)
```env
NODE_ENV=production
BACKEND_PORT=4006
MONGODB_URI=mongodb://localhost:27017/algobot_prod
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=https://algo.skylith.cloud
```

#### Mobile App (algobot_app/.env.local / algobot_app/.env.production)
```env
ENVIRONMENT=production
BACKEND_URL=https://algo.skylith.cloud/api
FIREBASE_API_KEY=your-firebase-key
```

## 📱 Mobile App

The Flutter app automatically detects the environment and uses the appropriate API endpoints:

- **Development**: `http://localhost:4006/api`
- **Production**: `https://algo.skylith.cloud/api`

## 🔒 Security

- CORS configured for specific origins
- Helmet.js security headers
- JWT authentication
- Input validation and sanitization
- HTTPS enforcement in production

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start frontend (port 3006)
npm run server:dev       # Start backend (port 4006)
npm run dev:full         # Start both frontend and backend

# Production
npm run build:prod       # Build for production
npm run start:prod       # Start production frontend
npm run server:prod      # Start production backend
npm run prod:full        # Build and start both services

# Utilities
npm run lint             # Run ESLint
```

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] Domain DNS configured
- [ ] MongoDB database created
- [ ] Firebase project configured
- [ ] PM2 processes running
- [ ] Nginx configured and running
- [ ] Firewall configured
- [ ] Backup strategy implemented

## 📊 Monitoring

```bash
# PM2 commands
pm2 status          # Check process status
pm2 logs            # View logs
pm2 restart all     # Restart all processes
pm2 monit          # Monitor processes

# Nginx commands
sudo nginx -t      # Test configuration
sudo nginx -s reload  # Reload configuration
```

## 🆘 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3006 and 4006 are available
2. **MongoDB connection**: Check MongoDB is running and credentials are correct
3. **CORS errors**: Verify allowed origins in backend configuration
4. **SSL issues**: Ensure certificates are properly installed

### Logs
- **PM2 logs**: `pm2 logs`
- **Nginx logs**: `/var/log/nginx/`
- **Application logs**: Check PM2 logs for detailed errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is private and proprietary.

---

For support or questions, contact the development team.
