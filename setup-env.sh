#!/bin/bash

# Photography Website Environment Setup Script
echo "🚀 Setting up environment variables for MongoDB Atlas..."

# Create .env.local file
cat > .env.local << EOF
MONGODB_URI=mongodb+srv://anpandey042_db_user:p3d4mQ91oBVssrol@ad.ynepvru.mongodb.net/photography-services?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development

# Email Configuration (Gmail SMTP)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_PASSWORD=hagbaiwzqltgfflz
EMAIL_HOST_USER=adityapandey.dev.in@gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EOF

echo "✅ Environment file created successfully!"
echo "📁 File: .env.local"
echo ""
echo "🔧 Next steps:"
echo "1. Update the cluster name in MONGODB_URI if needed"
echo "2. Change JWT_SECRET to a secure random string"
echo "3. Run: npm run dev"
echo ""
echo "🌐 Your MongoDB Atlas credentials:"
echo "Username: anpandey042_db_user"
echo "Password: p3d4mQ91oBVssrol"
echo ""
echo "📖 Check SETUP.md for complete instructions"
