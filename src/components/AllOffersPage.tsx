import React, { useState, useEffect } from 'react';
import { Plus, Filter, Edit, ChevronLeft, ChevronRight, ChevronDown, X, Loader2 } from 'lucide-react';
import FilterPanel, { FilterData } from './FilterPanel';
import { apiService } from '../services/api';

interface Product {
  id: number;
  name: string;
  description?: string;
  price?: number;
  status: string;
  created_at: string;
  company_id?: number;
  image_url?: string;
  address?: string;
  // Discount-related fields
  discount_id?: number;
  discount_price?: number;
  discount_percent?: number;
  discount_start_date?: string;
  discount_end_date?: string;
  discount_status?: string;
  discount_created_at?: string;
  discount_updated_at?: string;
  primary_image_url?: string;
  effective_price?: number;
  discount_amount?: number;
}

interface AllOffersPageProps {
  onAddNew?: () => void;
  onProductCreated?: () => void;
}

const AllOffersPage: React.FC<AllOffersPageProps> = ({ onAddNew, onProductCreated }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterData>({
    title: '',
    category: '',
    subcategory: '',
    startDate: '',
    endDate: '',
    originalPrice: '',
    discountPercent: '',
    finalPrice: '',
    status: ''
  });

  const itemsPerPage = 15;
  
  // State for inline editing
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Bulk operations state
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Image management state
  const [selectedProductForImages, setSelectedProductForImages] = useState<number | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [productImages, setProductImages] = useState<any[]>([]);

  // Generate 50 sample offers for demonstration - moved outside component to prevent re-generation
  const generateOffers = () => {
    const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Toys'];
    const subcategories = ['Smartphones', 'Laptops', 'Accessories', 'Men', 'Women', 'Kids'];
    const statuses = ['Active', 'Inactive', 'Pending', 'Expired'];
    const locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];
    
    const offers = [];
    for (let i = 1; i <= 50; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const subcategory = subcategories[Math.floor(Math.random() * subcategories.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const originalPrice = Math.random() * 1000 + 100;
      const discountPercent = Math.floor(Math.random() * 50) + 10;
      const finalPrice = originalPrice * (1 - discountPercent / 100);
      
      offers.push({
        id: `#${i.toString().padStart(2, '0')}`,
        title: `${category} Deal ${i}`,
        category: category,
        subcategory: subcategory,
        location: location,
        startDate: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        endDate: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        originalPrice: `$${originalPrice.toFixed(2)}`,
        discountPercent: `${discountPercent}%`,
        finalPrice: `$${finalPrice.toFixed(2)}`,
        status: status,
        hasProfile: Math.random() > 0.5
      });
    }
    return offers;
  };

  // Fetch products from API instead of generating fake data
  const [allOffers, setAllOffers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getProducts();
      console.log('Products API response in AllOffersPage:', response);
      console.log('First product sample:', response?.[0]);
      console.log('Response type:', typeof response);
      console.log('Response length:', response?.length);
      if (response && response.length > 0) {
        console.log('Sample product fields:', Object.keys(response[0]));
        console.log('Sample product discount fields:', {
          discount_id: response[0].discount_id,
          discount_percent: response[0].discount_percent,
          effective_price: response[0].effective_price,
          price: response[0].price
        });
        // Log all products with their prices and effective prices
        response.forEach((product, index) => {
          console.log(`Product ${index + 1}:`, {
            name: product.name,
            price: product.price,
            discount_percent: product.discount_percent,
            effective_price: product.effective_price
          });
        });
      }
      setAllOffers(response || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  // Filter offers based on active filters
  const filterOffers = (offers: Product[], filters: FilterData) => {
    return offers.filter(offer => {
      // Title/Name filter
      if (filters.title && !offer.name.toLowerCase().includes(filters.title.toLowerCase())) {
        return false;
      }
      
      // Category filter (not implemented yet - Product interface doesn't have category field)
      // if (filters.category && offer.category !== filters.category) {
      //   return false;
      // }
      
      // Subcategory filter (not implemented yet - Product interface doesn't have subcategory field)
      // if (filters.subcategory && offer.subcategory !== filters.subcategory) {
      //   return false;
      // }
      
      // Start date filter (using discount start date if available)
      if (filters.startDate && offer.discount_start_date && offer.discount_start_date < filters.startDate) {
        return false;
      }
      
      // End date filter (using discount end date if available)
      if (filters.endDate && offer.discount_end_date && offer.discount_end_date > filters.endDate) {
        return false;
      }
      
      // Original price filter
      if (filters.originalPrice) {
        const offerPrice = offer.price || 0;
        const filterPrice = parseFloat(filters.originalPrice);
        if (offerPrice < filterPrice) {
          return false;
        }
      }
      
      // Discount percent filter
      if (filters.discountPercent) {
        const offerDiscount = offer.discount_percent || 0;
        const filterDiscount = parseFloat(filters.discountPercent);
        if (offerDiscount < filterDiscount) {
          return false;
        }
      }
      
      // Final price filter
      if (filters.finalPrice) {
        let finalPrice = offer.effective_price || offer.price || 0;
        const filterPrice = parseFloat(filters.finalPrice);
        if (finalPrice > filterPrice) {
          return false;
        }
      }
      
      // Status filter
      if (filters.status && offer.status !== filters.status) {
        return false;
      }
      
      return true;
    });
  };

  const filteredOffers = filterOffers(allOffers, activeFilters);
  const totalItems = filteredOffers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOffers = filteredOffers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleApplyFilters = (filters: FilterData) => {
    setActiveFilters(filters);
    setCurrentPage(1); // Reset to first page when filters are applied
  };

  const handleResetFilters = () => {
    setActiveFilters({
      title: '',
      category: '',
      subcategory: '',
      startDate: '',
      endDate: '',
      originalPrice: '',
      discountPercent: '',
      finalPrice: '',
      status: ''
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(activeFilters).some(value => value !== '');

  // Handle start editing price
  const handleStartEditPrice = (product: Product) => {
    setEditingProductId(product.id);
    setEditingPrice(product.price?.toString() || '');
  };

  // Handle save price
  const handleSavePrice = async (product: Product) => {
    const newPrice = parseFloat(editingPrice);
    if (isNaN(newPrice) || newPrice <= 0) {
      alert('Please enter a valid price greater than 0');
      return;
    }

    if (!product.company_id) {
      alert('Product company information is missing. Please refresh the page and try again.');
      return;
    }

    setIsUpdating(true);
    try {
      // Only send the necessary fields for a price update
      const updateData = {
        id: product.id,
        company_id: product.company_id,
        price: newPrice
      };

      console.log('Sending update data:', updateData);
      console.log('Product company_id:', product.company_id);
      console.log('Product data:', product);
      
      const updatedProduct = await apiService.upsertProduct(updateData);

      // Update the local state
      setAllOffers(prev => prev.map(p => 
        p.id === product.id ? { ...p, price: newPrice } : p
      ));

      setEditingProductId(null);
      setEditingPrice('');
      console.log('Price updated successfully:', updatedProduct);
    } catch (error: any) {
      console.error('Error updating price:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      alert('Failed to update price: ' + (error.message || 'Unknown error'));
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle cancel editing
  const handleCancelEditPrice = () => {
    setEditingProductId(null);
    setEditingPrice('');
  };

  // Handle key press in edit input
  const handlePriceKeyPress = (e: React.KeyboardEvent, product: Product) => {
    if (e.key === 'Enter') {
      handleSavePrice(product);
    } else if (e.key === 'Escape') {
      handleCancelEditPrice();
    }
  };

  // NEW: Handle product selection for bulk operations
  const handleProductSelection = (productId: number, checked: boolean) => {
    const newSelection = new Set(selectedProducts);
    if (checked) {
      newSelection.add(productId);
    } else {
      newSelection.delete(productId);
    }
    setSelectedProducts(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  // NEW: Handle select all products
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = currentOffers.map(product => product.id);
      setSelectedProducts(new Set(allIds));
      setShowBulkActions(true);
    } else {
      setSelectedProducts(new Set());
      setShowBulkActions(false);
    }
  };

  // NEW: Handle bulk status update
  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedProducts.size === 0) return;

    setIsBulkUpdating(true);
    try {
      const productIds = Array.from(selectedProducts);
      await apiService.bulkProductStatus(productIds, newStatus);

      // Update local state
      setAllOffers(prev => prev.map(product => 
        selectedProducts.has(product.id) ? { ...product, status: newStatus as 'active' | 'inactive' } : product
      ));

      // Clear selection
      setSelectedProducts(new Set());
      setShowBulkActions(false);
      
      alert(`Successfully updated ${productIds.length} products to ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating product statuses:', error);
      alert('Failed to update product statuses: ' + (error.message || 'Unknown error'));
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // NEW: Handle delete product
  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await apiService.deleteProduct(productId);
      
      // Remove from local state
      setAllOffers(prev => prev.filter(product => product.id !== productId));
      
      alert('Product deleted successfully');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product: ' + (error.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  // NEW: Handle view product images
  const handleViewImages = async (productId: number) => {
    setSelectedProductForImages(productId);
    setIsImageModalOpen(true);
    setIsLoadingImages(true);

    try {
      const response = await apiService.listProductImages(productId);
      setProductImages(response.images || []);
    } catch (error: any) {
      console.error('Error loading product images:', error);
      setProductImages([]);
    } finally {
      setIsLoadingImages(false);
    }
  };

  // NEW: Handle delete product image
  const handleDeleteImage = async (imageId: number) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await apiService.deleteProductImage(imageId);
      
      // Remove from local state
      setProductImages(prev => prev.filter(img => img.id !== imageId));
      
      alert('Image deleted successfully');
    } catch (error: any) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image: ' + (error.message || 'Unknown error'));
    }
  };

  // NEW: Handle add product image
  const handleAddImage = async (productId: number, file: File) => {
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1]; // Remove data:image/...;base64, prefix
        
        await apiService.addProductImage(productId, base64Data);
        
        // Refresh images
        const response = await apiService.listProductImages(productId);
        setProductImages(response.images || []);
        
        alert('Image added successfully');
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Error adding image:', error);
      alert('Failed to add image: ' + (error.message || 'Unknown error'));
    }
  };


  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="text-sm text-gray-500">
        <span className="hover:text-gray-700 cursor-pointer">Osen</span>
        <span className="mx-2">›</span>
        <span className="hover:text-gray-700 cursor-pointer">eCommerce</span>
        <span className="mx-2">›</span>
        <span className="text-gray-700">Add Products</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">All Offers</h1>
                 <div className="flex items-center space-x-4">
           <button 
             onClick={fetchProducts}
             disabled={loading}
             className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
           >
             <Loader2 size={16} className={loading ? 'animate-spin' : ''} />
             <span>Refresh</span>
           </button>
           <button 
             onClick={() => setIsFilterOpen(true)}
             className="flex items-center space-x-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors duration-200"
           >
             <Filter size={16} />
             <span>Filters</span>
             {hasActiveFilters && (
               <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">
                 {Object.values(activeFilters).filter(v => v !== '').length}
               </span>
             )}
           </button>
           <button 
             onClick={onAddNew}
             className="flex items-center space-x-2 bg-accent-purple hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
           >
             <Plus size={16} />
             <span>AddNew +</span>
           </button>
         </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900">Active Filters:</h3>
            <button
              onClick={handleResetFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(activeFilters).map(([key, value]) => {
              if (value) {
                return (
                  <span
                    key={key}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {key}: {value}
                    <button
                      onClick={() => {
                        const newFilters = { ...activeFilters, [key]: '' };
                        setActiveFilters(newFilters);
                      }}
                      className="ml-2 hover:bg-blue-200 rounded-full p-1"
                    >
                      <X size={12} />
                    </button>
                  </span>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            <span className="ml-2 text-gray-600">Loading products...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
            <p>Error: {error}</p>
            <button 
              onClick={fetchProducts}
              className="mt-2 text-sm text-red-700 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
                         <thead className="bg-gray-50">
               <tr>
                 <th className="table-header">ID</th>
                 <th className="table-header">Name</th>
                 <th className="table-header">Description</th>
                 <th className="table-header">Original Price</th>
                 <th className="table-header">Discount %</th>
                 <th className="table-header">Final Price</th>
                 <th className="table-header">Status</th>
                 <th className="table-header">Created</th>
                 <th className="table-header">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-200">
               {currentOffers.length === 0 ? (
                 <tr>
                   <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                     No products found. Create your first product to get started!
                   </td>
                 </tr>
               ) : (
                 currentOffers.map((product, index) => (
                   <tr key={startIndex + index} className="hover:bg-gray-50">
                     <td className="table-cell font-medium">#{product.id}</td>
                     <td className="table-cell font-medium">{product.name}</td>
                     <td className="table-cell text-sm text-gray-600 max-w-xs truncate">
                       {product.description || 'No description'}
                     </td>
                                           <td className="table-cell">
                        {editingProductId === product.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingPrice}
                              onChange={(e) => setEditingPrice(e.target.value)}
                              onKeyDown={(e) => handlePriceKeyPress(e, product)}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleSavePrice(product)}
                                disabled={isUpdating}
                                className="p-1 text-green-600 hover:bg-green-100 rounded disabled:opacity-50"
                                title="Save"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={handleCancelEditPrice}
                                disabled={isUpdating}
                                className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50"
                                title="Cancel"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            {isUpdating && (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            )}
                          </div>
                        ) : (
                          <div 
                            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 rounded px-2 py-1 -mx-2"
                            onClick={() => handleStartEditPrice(product)}
                            title="Click to edit price"
                          >
                            <span className={(() => {
                              try {
                                if (product.price !== null && product.price !== undefined) {
                                  const numPrice = Number(product.price);
                                  // Convert discount_percent to number if it's a string
                                  let discountPercent = product.discount_percent;
                                  if (typeof discountPercent === 'string') {
                                    discountPercent = parseFloat(discountPercent);
                                  }
                                  const hasDiscount = discountPercent && discountPercent > 0;
                                  const priceText = isNaN(numPrice) ? 'N/A' : `$${numPrice.toFixed(2)}`;
                                  return hasDiscount ? 'line-through text-gray-500' : '';
                                }
                                return '';
                              } catch (error) {
                                console.error('Error formatting price:', error, product.price);
                                return '';
                              }
                            })()}>
                              {(() => {
                                try {
                                  if (product.price !== null && product.price !== undefined) {
                                    const numPrice = Number(product.price);
                                    const priceText = isNaN(numPrice) ? 'N/A' : `$${numPrice.toFixed(2)}`;
                                    return priceText;
                                  }
                                  return 'N/A';
                                } catch (error) {
                                  console.error('Error formatting price:', error, product.price);
                                  return 'N/A';
                                }
                              })()}
                            </span>
                            <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </div>
                        )}
                      </td>
                                           <td className="table-cell">
                        {(() => {
                          try {
                            // Convert discount_percent to number if it's a string
                            let discountPercent = product.discount_percent;
                            if (typeof discountPercent === 'string') {
                              discountPercent = parseFloat(discountPercent);
                            }
                            
                            if (discountPercent !== null && discountPercent !== undefined && !isNaN(discountPercent) && discountPercent > 0) {
                              return (
                                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 font-medium">
                                  -{discountPercent}%
                                </span>
                              );
                            }
                            return <span className="text-gray-400">No discount</span>;
                          } catch (error) {
                            console.error('Error formatting discount:', error, product.discount_percent);
                            return <span className="text-gray-400">N/A</span>;
                          }
                        })()}
                      </td>
                                           <td className="table-cell font-medium">
                        {(() => {
                          try {
                            // Convert effective_price to number if it's a string
                            let effectivePrice = product.effective_price;
                            if (typeof effectivePrice === 'string') {
                              effectivePrice = parseFloat(effectivePrice);
                            }
                            
                            if (effectivePrice !== null && effectivePrice !== undefined && !isNaN(effectivePrice)) {
                              const hasDiscount = product.discount_percent && product.discount_percent > 0;
                              return (
                                <span className={hasDiscount ? 'text-green-600 font-semibold' : ''}>
                                  ${effectivePrice.toFixed(2)}
                                </span>
                              );
                            }
                            
                            // Fallback to original price if no effective price
                            if (product.price !== null && product.price !== undefined) {
                              const numPrice = Number(product.price);
                              if (!isNaN(numPrice)) {
                                // Calculate effective price manually if backend didn't provide it
                                if (product.discount_percent && product.discount_percent > 0) {
                                  const calculatedPrice = numPrice * (1 - product.discount_percent / 100);
                                  return (
                                    <span className="text-green-600 font-semibold">
                                      ${calculatedPrice.toFixed(2)}
                                    </span>
                                  );
                                }
                                return `$${numPrice.toFixed(2)}`;
                              }
                            }
                            return 'N/A';
                          } catch (error) {
                            console.error('Error formatting final price:', error, product.effective_price);
                            return 'N/A';
                          }
                        })()}
                      </td>
                     <td className="table-cell">
                       <span className={`px-2 py-1 text-xs rounded-full ${
                         product.status === 'active' ? 'bg-green-100 text-green-800' :
                         product.status === 'inactive' ? 'bg-red-100 text-red-800' :
                         'bg-gray-100 text-gray-800'
                       }`}>
                         {product.status}
                       </span>
                     </td>
                     <td className="table-cell text-sm text-gray-500">
                       {new Date(product.created_at).toLocaleDateString()}
                     </td>
                     <td className="table-cell">
                       <div className="flex items-center space-x-2">
                         <button className="p-1 hover:bg-gray-100 rounded">
                           <Edit size={16} className="text-gray-500" />
                         </button>
                       </div>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} Results
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className={`p-2 rounded-lg ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  page === currentPage
                    ? 'bg-accent-purple text-white'
                    : page === '...'
                    ? 'text-gray-400 cursor-default'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                onClick={() => typeof page === 'number' && handlePageChange(page)}
                disabled={page === '...'}
              >
                {page}
              </button>
            ))}
            
            <button 
              className={`p-2 rounded-lg ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilters={handleApplyFilters}
        onReset={handleResetFilters}
      />
    </div>
  );
};

export default AllOffersPage;
