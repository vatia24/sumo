# Sumo Frontend - Backend Services Testing

This project provides a comprehensive frontend interface to test all the implemented backend services for product and company management.

## 🚀 Quick Start

### Backend Setup
1. Navigate to the `dailyhub-main` directory
2. Ensure you have PHP 8.0+ and Composer installed
3. Install dependencies: `composer install`
4. Configure your database in `Config/Db.php`
5. Import the database schema from `sumo.sql`
6. Start the PHP server: `php -S localhost:8000`

### Frontend Setup
1. Install dependencies: `npm install`
2. Start the development server: `npm start`
3. Open http://localhost:3000 in your browser

## 🧪 Testing Backend Services

### 1. Product Management Testing

Navigate to **Product Management** in the sidebar to test:

#### ✅ Delete Product
- View products in the table
- Click the **Delete** button on any product
- Confirm deletion in the popup
- **Backend API**: `POST /api/deleteProduct`

#### ✅ Bulk Product Status
- Select multiple products using checkboxes
- Choose status (Active/Inactive) from dropdown
- Click **Update Status** button
- **Backend API**: `POST /api/bulkProductStatus`

#### ✅ Add Product Image
- Click **Images** button on any product
- Upload an image file
- **Backend API**: `POST /api/addProductImage`

#### ✅ List Product Images
- Click **Images** button to view all product images
- **Backend API**: `GET /api/listProductImages`

#### ✅ Delete Product Image
- In the image gallery, hover over images
- Click the delete button (trash icon)
- **Backend API**: `POST /api/deleteProductImage`

### 2. Company Management Testing

Navigate to **Company Management** in the sidebar to test:

#### ✅ Company Profile Management
- **Profile Tab**: Edit company details (name, address, status, etc.)
- **Backend API**: `POST /api/upsertCompany`

#### ✅ Business Hours Management
- **Business Hours Tab**: Set opening/closing times for each day
- **Backend API**: `POST /api/setCompanyHours`

#### ✅ Social Media Management
- **Social Media Tab**: Add/remove social media platforms and URLs
- **Backend API**: 
  - `POST /api/addCompanySocial`
  - `GET /api/listCompanySocials`
  - `POST /api/deleteCompanySocial`

#### ✅ Company Gallery Management
- **Gallery Tab**: Upload and manage company images
- **Backend API**:
  - `POST /api/addCompanyGallery`
  - `GET /api/listCompanyGallery`
  - `POST /api/deleteCompanyGallery`

#### ✅ Document Management
- **Documents Tab**: Upload and manage company documents
- **Backend API**:
  - `POST /api/addCompanyDocument`
  - `GET /api/listCompanyDocuments`
  - `POST /api/reviewCompanyDocument`

#### ✅ Delivery Zone Management
- **Delivery Zones Tab**: Create radius-based or polygon-based delivery zones
- **Backend API**:
  - `POST /api/upsertDeliveryZone`
  - `GET /api/listDeliveryZones`
  - `POST /api/deleteDeliveryZone`

#### ✅ Branch Management
- **Branches Tab**: Add/remove company branches
- **Backend API**:
  - `POST /api/upsertBranch`
  - `GET /api/listBranches`
  - `POST /api/deleteBranch`

#### ✅ Contact Management
- **Contacts Tab**: Add/remove company contact information
- **Backend API**:
  - `POST /api/addContact`
  - `GET /api/listContacts`
  - `POST /api/deleteContact`

## 🔧 Backend API Endpoints

### Product Management
- `GET /api/getProducts` - Get all products with discounts
- `GET /api/getProduct` - Get single product
- `GET /api/listProducts` - List products with filters
- `POST /api/upsertProduct` - Create/update product
- `POST /api/deleteProduct` - Delete product
- `POST /api/bulkProductStatus` - Bulk update product statuses
- `POST /api/addProductImage` - Add product image
- `GET /api/listProductImages` - List product images
- `POST /api/deleteProductImage` - Delete product image

### Company Management
- `POST /api/upsertCompany` - Create/update company
- `GET /api/getCompany` - Get company details
- `POST /api/setCompanyStatus` - Set company status
- `POST /api/setCompanyHours` - Set business hours
- `GET /api/getCompanyHours` - Get business hours
- `POST /api/addCompanySocial` - Add social media
- `GET /api/listCompanySocials` - List social media
- `POST /api/deleteCompanySocial` - Delete social media
- `POST /api/addCompanyGallery` - Add gallery image
- `GET /api/listCompanyGallery` - List gallery images
- `POST /api/deleteCompanyGallery` - Delete gallery image
- `POST /api/addCompanyDocument` - Add document
- `GET /api/listCompanyDocuments` - List documents
- `POST /api/reviewCompanyDocument` - Review document
- `POST /api/upsertDeliveryZone` - Create/update delivery zone
- `GET /api/listDeliveryZones` - List delivery zones
- `POST /api/deleteDeliveryZone` - Delete delivery zone
- `POST /api/upsertBranch` - Create/update branch
- `GET /api/listBranches` - List branches
- `POST /api/deleteBranch` - Delete branch
- `POST /api/addContact` - Add contact
- `GET /api/listContacts` - List contacts
- `POST /api/deleteContact` - Delete contact

## 🗄️ Database Schema

The backend uses the following main tables:
- `product` - Product information
- `product_images` - Product image storage
- `companies` - Company profiles
- `company_hours` - Business hours
- `company_socials` - Social media links
- `company_gallery` - Company images
- `company_documents` - Company documents
- `delivery_zones` - Delivery zone definitions
- `company_branches` - Company branch locations
- `contact` - Company contact information

## 🔐 Authentication

All API endpoints require JWT authentication:
- Login via `/api/authorize`
- Include `Authorization: Bearer <token>` header
- Tokens are automatically managed by the frontend

## 🐛 Troubleshooting

### Backend Issues
1. Check PHP error logs
2. Verify database connection in `Config/Db.php`
3. Ensure all required tables exist
4. Check file permissions for upload directories

### Frontend Issues
1. Check browser console for API errors
2. Verify backend server is running on port 8000
3. Check CORS configuration in backend
4. Ensure authentication tokens are valid

## 📁 Project Structure

```
dailyhub-main/          # Backend PHP application
├── App/
│   ├── Controllers/    # API controllers
│   ├── Models/         # Database models
│   ├── Services/       # Business logic
│   └── Helpers/        # Utility functions
├── Config/             # Configuration files
├── uploads/            # File upload directories
└── sumo.sql           # Database schema

src/                    # Frontend React application
├── components/         # React components
├── services/           # API service layer
└── contexts/           # React contexts
```

## 🎯 Testing Checklist

- [ ] Product deletion works
- [ ] Bulk product status updates work
- [ ] Product image upload works
- [ ] Product image listing works
- [ ] Product image deletion works
- [ ] Company profile updates work
- [ ] Business hours management works
- [ ] Social media management works
- [ ] Company gallery management works
- [ ] Document management works
- [ ] Delivery zone management works
- [ ] Branch management works
- [ ] Contact management works

All backend services are fully implemented and ready for testing through the frontend interface!
