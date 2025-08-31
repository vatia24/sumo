# Sumo Front - E-commerce Platform

A modern e-commerce platform built with React frontend and PHP backend API.

## 🚀 Features

- **User Authentication**: JWT-based login/registration system
- **Product Management**: Full CRUD operations for products
- **Company Management**: Business profile and settings
- **Discount System**: Create and manage product discounts
- **Analytics**: User behavior tracking and insights
- **File Management**: Gallery and document uploads
- **Geolocation**: Delivery zones and mapping
- **Responsive Design**: Modern UI with Tailwind CSS

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Context API** for state management

### Backend
- **PHP 8.2** with OOP architecture
- **FastRoute** for API routing
- **JWT** for authentication
- **MySQL** database
- **Composer** for dependency management

## 📁 Project Structure

```
sumo-front/
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   └── services/          # API services
├── dailyhub-main/         # PHP backend
│   ├── App/              # Application logic
│   │   ├── Controllers/  # API controllers
│   │   ├── Models/       # Database models
│   │   ├── Services/     # Business logic
│   │   └── Helpers/      # Utility classes
│   ├── Config/           # Configuration files
│   └── vendor/           # Composer dependencies
├── public/               # Static assets
└── package.json          # Node.js dependencies
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- PHP 8.2+
- MySQL 8.0+
- Composer

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd sumo-front
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd dailyhub-main
   composer install
   ```

4. **Set up the database**
   - Import `dailyhub-main/sumo.sql` into your MySQL database
   - Update database credentials in `dailyhub-main/Config/Db.php`

5. **Start the development servers**

   **Backend (PHP API):**
   ```bash
   cd dailyhub-main
   php -S localhost:8000
   ```

   **Frontend (React):**
   ```bash
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000/api

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `dailyhub-main` directory:

```env
APP_ENV=development
DB_HOST=localhost
DB_NAME=sumo
DB_USER=root
DB_PASS=your_password
DB_PORT=3306
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=3600
```

### API Configuration

The frontend is configured to connect to `http://localhost:8000/api` by default. You can change this in `src/services/api.ts`:

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/authorize` - User login
- `POST /api/registerUser` - User registration
- `POST /api/logout` - User logout

### Product Endpoints
- `GET /api/getProducts` - Get all products
- `GET /api/getProduct?id={id}` - Get single product
- `POST /api/upsertProduct` - Create/update product
- `POST /api/deleteProduct` - Delete product

### Company Endpoints
- `GET /api/getUserCompany` - Get user's company
- `POST /api/upsertCompany` - Create/update company

### Discount Endpoints
- `GET /api/listDiscounts` - Get all discounts
- `POST /api/upsertDiscount` - Create/update discount

## 🧪 Testing

### Test API Endpoints
You can use the provided test files:
- `test_api.html` - Basic API testing
- `test_api_fix.html` - API connectivity test
- `test_api_php_server.html` - PHP server test

### Manual Testing
1. Open `http://localhost:8000/test.php` to verify PHP server
2. Open `http://localhost:8000/api/getProducts` to test API (requires auth)
3. Use the React app at `http://localhost:3000` for full functionality

## 🔒 Security

- JWT token-based authentication
- CORS properly configured for development
- Input validation and sanitization
- SQL injection prevention with prepared statements

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions, please open an issue in the GitHub repository.
