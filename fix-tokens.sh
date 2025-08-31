#!/bin/bash

echo "🔧 Fixing JWT token format in all APIs..."

# Function to replace admin-token with manager-token
replace_tokens() {
    local file=$1
    echo "Fixing $file..."
    
    # Replace admin-token with manager-token
    sed -i '' 's/admin-token/manager-token/g' "$file"
    
    # Replace adminId with managerId
    sed -i '' 's/adminId/managerId/g' "$file"
    
    # Replace Admin.findById with Manager.findById
    sed -i '' 's/Admin\.findById/Manager.findById/g' "$file"
    
    # Replace admin with manager in variable names
    sed -i '' 's/const admin =/const manager =/g' "$file"
    
    # Replace admin.isActive with manager.isActive
    sed -i '' 's/admin\.isActive/manager.isActive/g' "$file"
    
    # Replace admin with manager in error messages
    sed -i '' 's/Access denied/Manager access denied/g' "$file"
}

# List of files to fix
files=(
    "src/app/api/admin/create/route.ts"
    "src/app/api/admin/managers/setup/route.ts"
    "src/app/api/admin/notifications/send/route.ts"
    "src/app/api/admin/delete/route.ts"
    "src/app/api/admin/withdrawals/review/route.ts"
    "src/app/api/admin/managers/assign-vips/route.ts"
    "src/app/api/admin/assign-vip/route.ts"
    "src/app/api/admin/managers/test/route.ts"
    "src/app/api/admin/list/route.ts"
)

# Fix each file
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        replace_tokens "$file"
    else
        echo "⚠️  File not found: $file"
    fi
done

echo "✅ Token format fixes completed!"
echo ""
echo "🔍 Next steps:"
echo "1. Restart your development server"
echo "2. Test the login flow again"
echo "3. Check if all APIs are working"
