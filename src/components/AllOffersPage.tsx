import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import { Plus, Filter, Edit, ChevronLeft, ChevronRight, ChevronDown, X, Loader2, ArrowUpDown, CheckSquare, Square } from 'lucide-react';
import FilterPanel, { FilterData } from './FilterPanel';
import { apiService } from '../services/api';
import { useCompany } from '../contexts/CompanyContext';

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
  products?: Product[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

const AllOffersPage: React.FC<AllOffersPageProps> = ({ 
  onAddNew, 
  onProductCreated, 
  products = [], 
  loading = false, 
  error = null, 
  onRefresh 
}) => {
  const { company, refreshCompany } = useCompany();
  const { t } = useI18n();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [isCompact, setIsCompact] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
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
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'discount' | 'created_at'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Keyboard shortcut: R to refresh
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea';
      if (!isTyping && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        onRefresh?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onRefresh]);
  
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

  // Discount modal state
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [selectedProductForDiscount, setSelectedProductForDiscount] = useState<Product | null>(null);
  const [discountPercent, setDiscountPercent] = useState<string>('');
  const [discountStartDate, setDiscountStartDate] = useState<string>('');
  const [discountEndDate, setDiscountEndDate] = useState<string>('');
  const [discountStatus, setDiscountStatus] = useState<string>('active');
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

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

  // Use products from props instead of fetching
  const allOffers = products;

  // Build suggestions based on product names
  const suggestions = React.useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    if (!q) return [] as string[];
    const names = Array.from(new Set(products.map(p => p.name)));
    return names.filter(n => n.toLowerCase().includes(q)).slice(0, 8);
  }, [debouncedSearch, products]);

  // Filter offers based on active filters
  const filterOffers = (offers: Product[], filters: FilterData) => {
    return offers.filter(offer => {
      // Quick search (name or description)
      if (debouncedSearch) {
        const hay = `${offer.name || ''} ${offer.description || ''}`.toLowerCase();
        if (!hay.includes(debouncedSearch.toLowerCase())) {
          return false;
        }
      }
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
  const sortedOffers = React.useMemo(() => {
    const list = [...filteredOffers];
    list.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name) * dir;
        case 'price': {
          const ap = Number(a.price || 0);
          const bp = Number(b.price || 0);
          return (ap - bp) * dir;
        }
        case 'discount': {
          const ad = Number(a.discount_percent || 0);
          const bd = Number(b.discount_percent || 0);
          return (ad - bd) * dir;
        }
        case 'created_at':
        default:
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      }
    });
    return list;
  }, [filteredOffers, sortBy, sortDir]);
  const totalItems = filteredOffers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOffers = sortedOffers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleApplyFilters = (filters: FilterData) => {
    setActiveFilters(filters);
    setCurrentPage(1); // Reset to first page when filters are applied
  };

  const handleSuggestionClick = (text: string) => {
    setSearchInput(text);
    setDebouncedSearch(text);
    setShowSuggestions(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions && suggestions.length > 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setShowSuggestions(true);
      return;
    }
    if (!showSuggestions) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
        e.preventDefault();
        handleSuggestionClick(suggestions[highlightIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
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

      // Refresh data from parent component
      if (onRefresh) {
        onRefresh();
      }

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

      // Refresh data from parent component
      if (onRefresh) {
        onRefresh();
      }

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
      
      // Refresh data from parent component
      if (onRefresh) {
        onRefresh();
      }
      
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

  // Discount handlers
  const openDiscountModal = async (product: Product) => {
    if (!company) {
      await refreshCompany();
    }
    setSelectedProductForDiscount(product);
    const existingPercent = typeof product.discount_percent === 'string' ? parseFloat(product.discount_percent) : (product.discount_percent || 0);
    setDiscountPercent(existingPercent ? String(existingPercent) : '');
    setDiscountStartDate(product.discount_start_date || '');
    setDiscountEndDate(product.discount_end_date || '');
    setDiscountStatus(product.discount_status || 'active');
    setDiscountError(null);
    setIsDiscountModalOpen(true);
  };

  const closeDiscountModal = () => {
    setIsDiscountModalOpen(false);
    setSelectedProductForDiscount(null);
    setIsSavingDiscount(false);
    setDiscountError(null);
  };

  const handleSaveDiscount = async () => {
    try {
      if (!selectedProductForDiscount) return;
      if (!company?.id) {
        setDiscountError('Company not loaded. Please try again.');
        return;
      }
      const percent = parseFloat(discountPercent);
      if (isNaN(percent) || percent <= 0 || percent > 100) {
        setDiscountError('Please enter a valid discount percent (1-100).');
        return;
      }
      setIsSavingDiscount(true);

      const payload: any = {
        company_id: company.id,
        product_id: selectedProductForDiscount.id,
        discount_percent: percent,
        status: discountStatus || 'active',
        start_date: discountStartDate || undefined,
        end_date: discountEndDate || undefined,
      };
      if (selectedProductForDiscount.discount_id) {
        payload.id = selectedProductForDiscount.discount_id;
      }

      await apiService.upsertDiscount(payload);

      if (onRefresh) onRefresh();
      closeDiscountModal();
      alert('Discount saved successfully');
    } catch (e: any) {
      console.error('Failed to save discount', e);
      setDiscountError(e?.message || 'Failed to save discount');
    } finally {
      setIsSavingDiscount(false);
    }
  };

  // Helper to resolve product thumbnail URL
  const getBaseUrl = () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
    return apiUrl.replace('/api', '');
  };

  const getProductListThumbUrl = (path?: string) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const filename = path.split(/[\\/]/).pop() || path;
    return `${getBaseUrl()}/uploads/products/${filename}`;
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
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.discounts')}</h1>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          <div className="relative">
            <input
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setShowSuggestions(true); setHighlightIndex(-1); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
              onKeyDown={handleSearchKeyDown}
              placeholder={t('common.searchByName')}
              className="input w-64"
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              aria-controls="offers-search-suggestions"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul id="offers-search-suggestions" className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-auto">
                {suggestions.map((s, i) => (
                  <li key={s}>
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm ${i === highlightIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSuggestionClick(s)}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button 
            onClick={onRefresh}
            disabled={loading}
            aria-label={t('common.refresh')}
            title={t('common.refresh')}
            className="btn btn-ghost disabled:opacity-50"
          >
             <Loader2 size={16} className={loading ? 'animate-spin' : ''} />
           </button>
           <button 
            onClick={() => setIsCompact(v => !v)}
            className="btn btn-ghost"
            title={t('common.toggleDensity')}
           >
             {isCompact ? t('common.comfortable') : t('common.compact')}
           </button>
           <button 
             onClick={() => setIsFilterOpen(true)}
            className="btn btn-primary"
           >
             <Filter size={16} />
            <span>{t('common.filters') || 'ფილტრები'}</span>
             {hasActiveFilters && (
              <span className="badge bg-red-500 text-white ml-1">
                 {Object.values(activeFilters).filter(v => v !== '').length}
               </span>
             )}
           </button>
           <div className="relative">
            <label className="sr-only" htmlFor="sortBy">{t('common.sortBy')}</label>
             <select
               id="sortBy"
               className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
               value={sortBy}
               onChange={(e) => setSortBy(e.target.value as any)}
              aria-label={t('common.sortBy')}
             >
               <option value="created_at">{t('common.newest') || 'უახლესი'}</option>
              <option value="name">{t('table.discount')}</option>
              <option value="price">{t('table.price')}</option>
               <option value="discount">%-ი</option>
             </select>
           </div>
           <button
             className="btn btn-ghost"
            aria-label={t('common.toggleSortDirection')}
            title={t('common.toggleSortDirection')}
             onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
           >
             <ArrowUpDown size={16} />
             <span className="hidden sm:inline">{sortDir === 'asc' ? '↑' : '↓'}</span>
           </button>
           <button 
             onClick={onAddNew}
            className="btn btn-primary"
           >
             <Plus size={16} />
            <span>{t('common.addOffer')}</span>
           </button>
         </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900">{t('common.activeFilters')}</h3>
            <button
              onClick={handleResetFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {t('common.clearAll')}
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
        <div className="card p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            <span className="ml-2 text-gray-600">Loading products...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
          <div className="card p-6">
          <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
            <p>{t('common.error')}: {error}</p>
            <button 
              onClick={onRefresh}
              className="mt-2 text-sm text-red-700 underline hover:no-underline"
            >
              {t('common.retry')}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className={`card p-0 ${isCompact ? 'table-compact' : ''}`}>
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh] min-h-[60vh] stable-scroll">
          <table className="w-full">
             <thead className="bg-gray-50 sticky top-0 z-10">
               <tr>
                <th className="table-header">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    onChange={(e) => handleSelectAll((e.target as HTMLInputElement).checked)}
                    checked={currentOffers.length > 0 && currentOffers.every((p) => selectedProducts.has(p.id))}
                  />
                </th>
                <th className="table-header">{t('table.discount')}</th>
                <th className="table-header">{t('table.description')}</th>
                <th className="table-header text-right">{t('table.price')}</th>
                <th className="table-header">{t('table.discountPercent')}</th>
                <th className="table-header text-right">{t('table.finalPrice')}</th>
                <th className="table-header">{t('table.status')}</th>
                <th className="table-header">{t('table.created')}</th>
                <th className="table-header">{t('table.actions')}</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-200">
               {currentOffers.length === 0 ? (
                 <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {t('products.empty')}
                   </td>
                 </tr>
               ) : (
                 currentOffers.map((product, index) => (
                   <tr key={startIndex + index} className="hover:bg-gray-50">
                   <td className="table-cell">
                      <input
                        type="checkbox"
                        aria-label={`Select product ${product.name}`}
                        onChange={(e) => handleProductSelection(product.id, (e.target as HTMLInputElement).checked)}
                        checked={selectedProducts.has(product.id)}
                      />
                    </td>
                   <td className="table-cell font-medium">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 text-gray-500 flex items-center justify-center">
                          {product.primary_image_url ? (
                            <img
                              className="h-full w-full object-cover"
                              src={getProductListThumbUrl(product.primary_image_url as string)}
                              alt={product.name || 'Product'}
                            />
                          ) : (
                            <span className="text-sm font-medium">
                              {(product.name || 'NA').split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          {(() => {
                            let dp: any = (product as any).discount_percent;
                            if (typeof dp === 'string') dp = parseFloat(dp);
                            if (dp && !isNaN(dp) && dp > 0) {
                              return <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-rose-50 text-rose-700 mt-0.5">-{dp}%</div>;
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </td>
                     <td className="table-cell text-sm text-gray-600 max-w-xs truncate">
                       {product.description || 'No description'}
                     </td>
                     <td className="table-cell text-right">
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
                          (() => {
                            try {
                              let effective = product.effective_price as any;
                              if (typeof effective === 'string') effective = parseFloat(effective);
                              if (effective !== null && effective !== undefined && !isNaN(effective)) {
                                return <span className="text-green-600 font-semibold tabular-nums">${effective.toFixed(2)}</span>;
                              }
                              if (product.price !== null && product.price !== undefined) {
                                const numPrice = Number(product.price);
                                return isNaN(numPrice) ? 'N/A' : <span className="tabular-nums">${numPrice.toFixed(2)}</span>;
                              }
                              return 'N/A';
                            } catch (error) {
                              console.error('Error formatting price:', error, product.price);
                              return 'N/A';
                            }
                          })()
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
                                <span className="px-2 py-1 text-xs rounded-full bg-rose-50 text-rose-700 font-medium">
                                  -{discountPercent}%
                                </span>
                              );
                            }
                            return <span className="text-gray-400">—</span>;
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
                        product.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                        product.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                        'bg-gray-100 text-gray-700'
                       }`}>
                         {product.status === 'active' ? t('common.active') : t('common.inactive')}
                       </span>
                     </td>
                     <td className="table-cell text-sm text-gray-500">
                       {new Date(product.created_at).toLocaleDateString()}
                     </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openDiscountModal(product)}
                          className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                          title={t('discount.edit')}
                        >
                          {t('discount.edit')}
                        </button>
                      </div>
                    </td>
                   </tr>
                 ))
               )}
             </tbody>
          </table>
        </div>

        {/* Bulk actions + Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <span>
              {t('common.showing')} {startIndex + 1}–{Math.min(endIndex, totalItems)} {t('common.of')} {totalItems} {t('common.results')}
            </span>
            <label className="flex items-center gap-2">
              <span className="text-gray-500">{t('common.perPage')}</span>
              <select
                className="border border-gray-300 rounded px-2 py-1 text-sm"
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(parseInt(e.target.value) || 15); setCurrentPage(1); }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
          </div>
          {showBulkActions && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">{selectedProducts.size} {t('common.selected')}</span>
              <button
                className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
                disabled={isBulkUpdating}
                onClick={() => handleBulkStatusUpdate('active')}
              >
                {t('common.setActive')}
              </button>
              <button
                className="px-3 py-1 rounded bg-gray-700 text-white text-sm hover:bg-gray-800 disabled:opacity-50"
                disabled={isBulkUpdating}
                onClick={() => handleBulkStatusUpdate('inactive')}
              >
                {t('common.setInactive')}
              </button>
            </div>
          )}
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

      {/* Discount Modal */}
      {isDiscountModalOpen && selectedProductForDiscount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedProductForDiscount.name} — Discount</h3>
              <button onClick={closeDiscountModal} className="p-1 hover:bg-gray-100 rounded">
                <X size={18} />
              </button>
            </div>

            {discountError && (
              <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                {discountError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Discount Percent</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 25"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={discountStartDate}
                    onChange={(e) => setDiscountStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={discountEndDate}
                    onChange={(e) => setDiscountEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Status</label>
                <select
                  value={discountStatus}
                  onChange={(e) => setDiscountStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                  <option value="scheduled">scheduled</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={closeDiscountModal}
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={isSavingDiscount}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDiscount}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center"
                disabled={isSavingDiscount}
              >
                {isSavingDiscount && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllOffersPage;
