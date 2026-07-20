#!/bin/bash

echo "🚀 Setting up DevOps Pipeline Generator with Admin Access"
echo "=================================================="

# Step 1: Create admin user
echo "📝 Creating admin user..."
node createAdmin.js

# Step 2: Seed sample documentation
echo "📚 Seeding sample DevOps documentation..."
node seedDevOpsDocs.js

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "🔐 Admin Login Credentials:"
echo "   Username: admin"
echo "   Password: admin"
echo "   Role: admin"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://43.205.177.102:5001"
echo ""
echo "📋 Next Steps:"
echo "   1. Start backend: cd backend && npm start"
echo "   2. Start frontend: cd frontend && npm run dev"
echo "   3. Login with admin/admin"
echo "   4. Access Admin menu to manage documentation"
echo "   5. Access DevOps Documentation to view guides"
echo ""
