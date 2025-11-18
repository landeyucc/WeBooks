# Webooks - Modern Bookmark Management Tool

#### Document Language: English | [中文](./README.md)

A powerful modern bookmark management tool with support for import/export, categorization, search, and tagging systems. Designed to improve browsing efficiency with support for multiple browser bookmark formats.

## 1. Program Overview

### Core Features
- **Smart Bookmark Import**: Supports NETSCAPE-Bookmark-file-1 format, automatically recognizes bookmarks exported from Chrome, Edge, Firefox, and other browsers
- **Category Management**: Flexible Space and Folder organizational structure
- **Advanced Search**: Full-text search across bookmark titles, descriptions, and URLs
- **Tagging System**: Multi-tag categorization with quick filtering support
- **Batch Operations**: Bulk editing, moving, and deleting bookmarks
- **Responsive Design**: Perfect adaptation for desktop and mobile devices
- **Multi-language Support**: Built-in Chinese and English bilingual interface

## 2. Quick Start

### Environment Requirements
- Node.js 18.0+
- npm 8.0+ or pnpm 7.0+
- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Installation Steps

```bash
# 1. Clone the project
git clone https://github.com/yourusername/webooks.git
cd webooks

# 2. Install dependencies
npm install
# or use pnpm
pnpm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env file, configure database connection and other information

# 4. Initialize database
npx prisma migrate dev
npx prisma generate
```

### One-click Start

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Installation Verification
After successful startup, visit http://localhost:3000. If you see the initialization page, the installation is successful.

## 3. Core Features

### Bookmark Management
- **Import Function**: Supports dragging or selecting HTML bookmark files for import
- **Export Function**: One-click export of all bookmarks to standard format
- **Category Management**: Create and manage bookmark spaces and folder structures
- **Search Function**: Real-time search of bookmark content

### User Management
- **User Authentication**: Secure login and registration system
- **Admin Dashboard**: Powerful management interface
- **Permission Control**: Role-based access control

### System Features
- **Multi-language Support**: Chinese and English interface switching
- **Responsive Design**: Adapted to various device sizes
- **Performance Optimization**: Fast loading and smooth operation

## 4. Usage Guide

### Basic Operation Flow

#### First-time Use
1. Visit the application homepage
2. Complete system initialization
3. Create the first bookmark space

#### Importing Bookmarks
1. Enter the admin dashboard
2. Select "Import Bookmarks" function
3. Drag or select bookmark files exported by browsers
4. System automatically parses and categorizes bookmarks

#### Managing Bookmarks
- **Create Folders**: Right-click or use management panel
- **Move Bookmarks**: Drag to target folders
- **Add Tags**: Assign multiple tags to bookmarks
- **Search Bookmarks**: Use search box for real-time searching


## 5. Configuration Details

### Configuration File Paths
- **Environment Configuration**: `.env` file
- **Application Configuration**: `lib/server-config.ts`
- **Database Configuration**: `prisma/schema.prisma`

### Main Configuration Items

#### Database Configuration
```env
DATABASE_URL="postgresql://username:password@localhost:5432/webooks"
```

#### Application Configuration
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

## 6. API Documentation

### RESTful API

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

#### Bookmark Management
- `GET /api/bookmarks` - Get bookmark list
- `POST /api/bookmarks` - Create bookmark
- `PUT /api/bookmarks/:id` - Update bookmark
- `DELETE /api/bookmarks/:id` - Delete bookmark
- `POST /api/bookmarks/import` - Import bookmarks
- `GET /api/bookmarks/export` - Export bookmarks

#### Folder Management
- `GET /api/folders` - Get folder list
- `POST /api/folders` - Create folder
- `PUT /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder

#### Space Management
- `GET /api/spaces` - Get space list
- `POST /api/spaces` - Create space
- `PUT /api/spaces/:id` - Update space
- `DELETE /api/spaces/:id` - Delete space

### Request Format Examples

#### Creating a Bookmark
```json
POST /api/bookmarks
{
  "title": "Example Website",
  "url": "https://example.com",
  "description": "This is an example website",
  "tags": ["development", "tools"],
  "folderId": "folder-123",
  "spaceId": "space-456"
}
```

#### Response Format
```json
{
  "success": true,
  "data": {
    "id": "bookmark-789",
    "title": "Example Website",
    "url": "https://example.com",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

## 7. Deployment & Ops

### Deployment Environment Requirements
- **Operating System**: Linux/macOS/Windows
- **Node.js**: Version 18.0 or higher
- **Database**: PostgreSQL 13+ or SQLite
- **Memory**: Minimum 512MB, recommended 2GB+
- **Disk Space**: Minimum 1GB

### Deployment Steps

#### Using Vercel (Recommended)
1. Fork project to GitHub
2. Connect Vercel account
3. Import project and configure environment variables
4. Auto-deployment

#### Custom Server Deployment
```bash
# 1. Build application
npm run build

# 2. Start production service
npm start

# 3. Use PM2 to manage processes (optional)
npm install -g pm2
pm2 start npm --name "webooks" -- start
```

## 8. Development Guide

### Development Environment Setup
```bash
# 1. Clone project
git clone https://github.com/yourusername/webooks.git

# 2. Install dependencies
npm install

# 3. Start development service
npm run dev
```

### Code Directory Structure
```
webooks/
├── app/                    # Next.js application directory
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   └── page.tsx           # Homepage
├── components/             # React components
│   ├── admin/             # Admin components
│   ├── ui/                # UI components
│   └── HomePage.tsx       # Homepage component
├── lib/                   # Utility libraries
│   ├── auth.ts            # Authentication logic
│   ├── i18n.ts            # Internationalization
│   └── prisma.ts          # Database connection
├── prisma/                # Database related
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
└── chrome-extension/      # Chrome extension
```

### Coding Standards
- **TypeScript**: Strict mode
- **ESLint**: Use Next.js recommended configuration
- **Prettier**: Code formatting
- **Naming Convention**: Use camelCase

### Build Commands
```bash
npm run build              # Build production version
npm run dev                # Development mode
npm run lint               # Code checking
npm run type-check         # Type checking
```

### Local Debugging
1. Use VS Code debugging configuration
2. Set breakpoints to debug TypeScript code
3. Use browser developer tools for frontend debugging
4. Use Prisma Studio to view database

## 9. Dependencies

### Main Dependencies
- **Next.js 14**: React framework
- **React 18**: Frontend library
- **TypeScript**: Type safety
- **Prisma**: Database ORM
- **NextAuth.js**: Authentication system
- **Tailwind CSS**: Styling framework

### Development Dependencies
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **@types/node**: Node.js type definitions

### Dependency Installation
```bash
# Install production dependencies
npm install

# Install development dependencies
npm install --save-dev

# Update dependencies
npm update
```