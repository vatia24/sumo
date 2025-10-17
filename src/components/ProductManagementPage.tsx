import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  X, 
  Loader2, 
  CheckSquare, 
  Square,
  Download,
  Upload
} from 'lucide-react';
import { apiService, Product, ProductImage } from '../services/api';
import { Edit } from 'lucide-react';

// Helper function to get the base URL for serving static files
const getBaseUrl = () => {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  return apiUrl.replace('/api', '');
};

// Normalize a product image path to a browser-accessible URL (prefer images table)
const getProductListThumbUrl = (path?: string) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const filename = path.split(/[\\\/]/).pop() || path;
  return `${getBaseUrl()}/uploads/products/${filename}`;
};

// Helper function to safely format price values
const formatPrice = (price: any): string => {
  if (price === null || price === undefined) return '0.00';
  const numPrice = Number(price);
  return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
};

interface ProductManagementPageProps {
  onAddNew?: () => void;
  onProductCreated?: () => void;
  products?: Product[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  autoEditProductId?: number | null;
  embedded?: boolean;
}

const ProductManagementPage: React.FC<ProductManagementPageProps> = ({ 
  onAddNew, 
  onProductCreated, 
  products: propProducts = [], 
  loading: propLoading = false, 
  error: propError = null, 
  onRefresh,
  autoEditProductId = null,
  embedded = false,
}) => {
  const { t } = useI18n();
  // Use local state as fallback if props are not provided
  const [products, setProducts] = useState<Product[]>(propProducts);
  const [loading, setLoading] = useState(propLoading);
  const [error, setError] = useState<string | null>(propError);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<'active' | 'inactive'>('active');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  
  // Image management state
  const [selectedProductImages, setSelectedProductImages] = useState<ProductImage[]>([]);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; price: string; description: string; stock?: string } | null>(null);
  const [discountForm, setDiscountForm] = useState<{ id?: number; percent: string; start_date: string; end_date: string; status: 'active' | 'inactive' } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setProducts(propProducts);
    setLoading(propLoading);
    setError(propError);
  }, [propProducts, propLoading, propError]);

  // Auto open edit modal if requested
  useEffect(() => {
    if (autoEditProductId && products.length > 0) {
      const p = products.find(pr => pr.id === autoEditProductId);
      if (p) openEditModal(p);
    }
  }, [autoEditProductId, products]);

  // Only fetch products if no props are provided (fallback for standalone usage)
  useEffect(() => {
    if (!onRefresh && propProducts.length === 0 && !propLoading && !propError) {
      fetchProducts();
    }
  }, [onRefresh, propProducts.length, propLoading, propError]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.listProducts({});
      setProducts(response.products || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete product functionality
  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      // Remove from selected products if it was selected
      setSelectedProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
      
      // Trigger parent refresh if available
      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
      console.error('Error deleting product:', err);
    }
  };

  // Edit product handlers
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name || '',
      price: String(product.price ?? ''),
      description: product.description || '',
      stock: product.status === 'active' ? '1' : '0',
    });
    setDiscountForm({
      id: product.discount_id,
      percent: product.discount_percent !== undefined && product.discount_percent !== null ? String(product.discount_percent) : '0',
      start_date: product.discount_start_date || '',
      end_date: product.discount_end_date || '',
      status: (product.discount_status as 'active' | 'inactive') || 'inactive',
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingProduct(null);
    setEditForm(null);
    setDiscountForm(null);
  };

  const handleEditFormChange = (field: keyof NonNullable<typeof editForm>, value: string) => {
    setEditForm(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleDiscountFormChange = (field: keyof NonNullable<typeof discountForm>, value: string) => {
    setDiscountForm(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct || !editForm) return;
    try {
      setSavingEdit(true);
      setError(null);

      // Derive status from stock only: 0 => inactive, >0 => active
      const normalizedStock = editForm.stock !== undefined ? Number(editForm.stock || '0') : undefined;
      const nextStatus: 'active' | 'inactive' = normalizedStock !== undefined && normalizedStock <= 0 ? 'inactive' : 'active';

      // Upsert product
      await apiService.upsertProduct({
        id: editingProduct.id,
        name: editForm.name,
        price: Number(editForm.price),
        description: editForm.description || undefined,
        status: nextStatus,
      });

      // Upsert discount
      if (discountForm) {
        const percentNum = Number(discountForm.percent || '0');
        if ((discountForm.id && (percentNum >= 0)) || (!discountForm.id && percentNum > 0)) {
          if (discountForm.id) {
            await apiService.upsertDiscount({
              id: discountForm.id,
              // company_id cannot change on update
              // product_id cannot change on update
              discount_percent: percentNum,
              status: discountForm.status,
              start_date: discountForm.start_date || undefined,
              end_date: discountForm.end_date || undefined,
            });
          } else if (percentNum > 0) {
            await apiService.upsertDiscount({
              company_id: editingProduct.company_id,
              product_id: editingProduct.id,
              discount_percent: percentNum,
              status: 'active',
              start_date: discountForm.start_date || undefined,
              end_date: discountForm.end_date || undefined,
            });
          }
        }
        // If percent is 0 and discount exists, deactivate it
        if (discountForm.id && percentNum === 0) {
          await apiService.upsertDiscount({
            id: discountForm.id,
            status: 'inactive',
          } as any);
        }
      }

      // Refresh list
      if (onRefresh) {
        onRefresh();
      } else {
        await fetchProducts();
      }

      closeEditModal();
    } catch (err: any) {
      setError(err.message || 'Failed to update');
      console.error('Error updating product/discount:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  // Bulk operations functionality
  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedProducts.size === 0) {
      setError('Please select at least one product');
      return;
    }

    try {
      setIsBulkUpdating(true);
      const productIds = Array.from(selectedProducts);
      await apiService.bulkProductStatus(productIds, bulkAction);
      
      // Update local state
      setProducts(prev => prev.map(p => 
        selectedProducts.has(p.id) ? { ...p, status: bulkAction } : p
      ));
      
      // Clear selection
      setSelectedProducts(new Set());
      setError(null);
      
      // Trigger parent refresh if available
      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update product statuses');
      console.error('Error updating product statuses:', err);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Image management functionality
  const handleViewImages = async (productId: number) => {
    try {
      setSelectedProductId(productId);
      const response = await apiService.listProductImages(productId);
      setSelectedProductImages(response.images || []);
      setImageModalOpen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch product images');
      console.error('Error fetching product images:', err);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile || !selectedProductId) return;

    try {
      setUploadingImage(true);
      // Convert file to base64
      const base64Data = await fileToBase64(imageFile);
      await apiService.addProductImage(selectedProductId, base64Data);
      
      // Refresh images
      const response = await apiService.listProductImages(selectedProductId);
      setSelectedProductImages(response.images || []);
      
      // Clear form
      setImageFile(null);
      setImagePreview(null);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      console.error('Error uploading image:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await apiService.deleteProductImage(imageId);
      setSelectedProductImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete image');
      console.error('Error deleting image:', err);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Keep the full data URL format (data:image/jpeg;base64,...)
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtering + Pagination
  const filteredProducts = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => {
      if (q && !(`${p.name || ''} ${p.description || ''}`.toLowerCase().includes(q))) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      return true;
    });
  }, [products, search, statusFilter]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  if (!embedded && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className={embedded ? '' : ''}>
      <div className={embedded ? '' : ''}>
        {/* Header */}
        {!embedded && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('products.title')}</h1>
              <p className="text-gray-600 mt-1">{t('products.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                className="input w-56"
                placeholder={t('common.searchByName')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
              <div className="flex items-center gap-1 text-sm text-gray-700" role="tablist" aria-label="Status filter">
                <button role="tab" aria-selected={statusFilter==='all'} className={`px-2 py-1 rounded ${statusFilter==='all'?'bg-gray-200':'hover:bg-gray-100'}`} onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}>{t('common.all')}</button>
                <button role="tab" aria-selected={statusFilter==='active'} className={`px-2 py-1 rounded ${statusFilter==='active'?'bg-emerald-50 text-emerald-700':'hover:bg-gray-100'}`} onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}>{t('common.active')}</button>
                <button role="tab" aria-selected={statusFilter==='inactive'} className={`px-2 py-1 rounded ${statusFilter==='inactive'?'bg-gray-100 text-gray-700':'hover:bg-gray-100'}`} onClick={() => { setStatusFilter('inactive'); setCurrentPage(1); }}>{t('common.inactive')}</button>
              </div>
              <button onClick={onAddNew} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {t('common.addProduct')}
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Bulk operations UI removed to match main table */}

        {/* Products Table (hidden in embedded edit mode) */}
        {!embedded && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[60vh] min-h-[60vh] stable-scroll">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 hover:text-gray-700"
                    >
                      {selectedProducts.size === products.length ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                      Select All
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ქმედებები
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleSelectProduct(product.id)}
                        className="flex items-center gap-2 hover:text-gray-700"
                        aria-label={`Select ${product.name}`}
                      >
                        {selectedProducts.has(product.id) ? (
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 text-gray-500 flex items-center justify-center">
                          {product.primary_image_url ? (
                            <img className="h-full w-full object-cover" src={getProductListThumbUrl(product.primary_image_url as string)} alt={product.name || 'Product'} />
                          ) : (
                            <span className="text-sm font-medium">{(product.name || 'NA').split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          {(() => { let dp: any = (product as any).discount_percent; if (typeof dp === 'string') dp = parseFloat(dp); if (dp && !isNaN(dp) && dp > 0) { return <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-rose-50 text-rose-700 mt-0.5">-{dp}%</div>; } return null; })()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate">{product.description || 'No description'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{(() => { const effective = Number(product.effective_price); const price = Number(product.price); const hasDiscount = !isNaN(effective) && effective > 0; if (hasDiscount) { return <span className="text-green-600 font-semibold tabular-nums">${formatPrice(effective)}</span>; } return <span className="tabular-nums">${formatPrice(price)}</span>; })()}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>{product.status}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right tabular-nums">{new Date(product.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleViewImages(product.id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          title="View Images"
                        >
                          <ImageIcon className="h-4 w-4" />
                          Images
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Pagination (hidden in embedded edit mode) */}
        {!embedded && totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Management Modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Product Images</h2>
                <button
                  onClick={() => setImageModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Image Upload Section */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upload New Image</h3>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-20 w-20 object-cover rounded-lg"
                    />
                  )}
                  <button
                    onClick={handleImageUpload}
                    disabled={!imageFile || uploadingImage}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Upload
                  </button>
                </div>
              </div>

              {/* Image Gallery */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedProductImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={`${getBaseUrl()}/uploads/products/${image.path.split(/[/\\]/).pop()}`}
                      alt={`Product ${image.id}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                        <button
                          onClick={() => handleDeleteImage(image.id)}
                          className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                          title="Delete Image"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <a
                          href={`${getBaseUrl()}/uploads/products/${image.path.split(/[/\\]/).pop()}`}
                          download={`product-image-${image.id}.jpg`}
                          className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
                          title="Download Image"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedProductImages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No images uploaded yet. Upload your first image above.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Product UI: modal for standalone; inline card for embedded */}
      {((embedded && editingProduct && editForm) || (editModalOpen && editingProduct && editForm)) && (
        <div className={embedded ? '' : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'}>
          <div className={embedded ? 'bg-white rounded-lg max-w-2xl w-full mx-auto' : 'bg-white rounded-lg max-w-2xl w-full mx-4'}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Product #{editingProduct.id}</h2>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => handleEditFormChange('price', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => handleEditFormChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                {/* Availability derived from stock; field removed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.stock ?? ''}
                    onChange={(e) => handleEditFormChange('stock', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Discount Section */}
              {discountForm && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Discount</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Percent</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={discountForm.percent}
                        onChange={(e) => handleDiscountFormChange('percent', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">Set a value greater than 0 to make the product usable.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={discountForm.status}
                        onChange={(e) => handleDiscountFormChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={discountForm.start_date}
                        onChange={(e) => handleDiscountFormChange('start_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={discountForm.end_date}
                        onChange={(e) => handleDiscountFormChange('end_date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={savingEdit}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagementPage;
