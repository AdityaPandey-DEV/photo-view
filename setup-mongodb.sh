#!/bin/bash

echo "🔧 Setting up MongoDB connection for VIP Photography Platform"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "📁 .env.local file already exists"
    echo "Current content:"
    cat .env.local
    echo ""
    echo "Do you want to overwrite it? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "Overwriting .env.local..."
    else
        echo "Keeping existing .env.local"
        exit 0
    fi
fi

echo "📝 Creating .env.local file with MongoDB configuration..."
echo ""

# Create .env.local file
cat > .env.local << EOF
# MongoDB Atlas Connection String
# Replace CLUSTER_ID with your actual MongoDB Atlas cluster identifier
MONGODB_URI=mongodb+srv://adityabro925_db_user:pfOFqGYte57M8a0l@CLUSTER_ID.mongodb.net/photography-services?retryWrites=true&w=majority

# JWT Secret for authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Environment
NODE_ENV=development
EOF

echo "✅ .env.local file created successfully!"
echo ""
echo "⚠️  IMPORTANT: You need to update the MONGODB_URI with your actual cluster ID"
echo ""
echo "🔍 To find your cluster ID:"
echo "1. Go to MongoDB Atlas dashboard"
echo "2. Click on your cluster"
echo "3. Look for the connection string"
echo "4. Replace 'CLUSTER_ID' in .env.local with your actual cluster identifier"
echo ""
echo "📱 Example: If your connection string shows 'cluster0.abc123.mongodb.net'"
echo "   Then replace CLUSTER_ID with 'cluster0.abc123'"
echo ""
echo "🔄 After updating, restart your development server:"
echo "   npm run dev"
echo ""
echo "📁 Current .env.local content:"
cat .env.local
