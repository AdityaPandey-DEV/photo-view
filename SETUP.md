# Photography Website Setup Guide

## 🚀 **Complete Setup Instructions**

### **1. Environment Configuration**

Create a `.env.local` file in the root directory with:

```bash
MONGODB_URI=mongodb://localhost:27017/photography-services
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
```

### **2. MongoDB Setup**

#### **Option A: Local MongoDB**
1. Install MongoDB locally
2. Start MongoDB service
3. Create database: `photography-services`

#### **Option B: MongoDB Atlas (Recommended)**
1. Go to [MongoDB Atlas](https://mongodb.com/atlas)
2. Create free cluster
3. Get connection string
4. Replace `MONGODB_URI` in `.env.local`

### **3. Install Dependencies**

```bash
npm install
```

### **4. Start Development Server**

```bash
npm run dev
```

## 🌐 **Available Routes**

- **`/`** - Home page with photography services
- **`/register`** - User registration page
- **`/login`** - User login page  
- **`/dashboard`** - User dashboard (requires authentication)

## 🔐 **Authentication Features**

- **User Registration** with photography preferences
- **Secure Login** with JWT tokens
- **Protected Dashboard** for authenticated users
- **User Profiles** with photography types and bio
- **Secure Logout** functionality

## 📊 **Database Schema**

### **User Model**
- Name, Email, Password (hashed)
- Photography Types (Portrait, Landscape, Events, etc.)
- Bio, Location, Phone
- Role (user/admin)
- Timestamps

## 🛠️ **API Endpoints**

- **`POST /api/auth/register`** - User registration
- **`POST /api/auth/login`** - User authentication
- **`POST /api/auth/logout`** - User logout
- **`GET /api/auth/me`** - Get current user

## 🎨 **Features**

- **Responsive Design** for all devices
- **Modern UI** with Tailwind CSS
- **Smooth Animations** with Framer Motion
- **Professional Photography** aesthetic
- **User Management** system
- **Secure Authentication** with JWT

## 🔧 **Customization**

- Update colors in `src/app/globals.css`
- Modify content in `src/app/page.tsx`
- Add new API endpoints in `src/app/api/`
- Customize user fields in `src/models/User.ts`

## 🚀 **Deployment**

1. Set production environment variables
2. Use MongoDB Atlas for production database
3. Deploy to Vercel, Netlify, or your preferred platform
4. Update `MONGODB_URI` and `JWT_SECRET` for production

## 📱 **Mobile Responsive**

- Mobile-first design approach
- Touch-friendly interactions
- Optimized for all screen sizes
- Professional mobile experience

---

**Your photography services website is now fully functional with user authentication!** 🎉📸
