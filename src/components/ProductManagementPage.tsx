import React, { useState, useEffect } from 'react';
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

// Helper function to get the base URL for serving static files
const getBaseUrl = () => {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  return apiUrl.replace('/api', '');
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
}

const ProductManagementPage: React.FC<ProductManagementPageProps> = ({ onAddNew, onProductCreated }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
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

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, []);

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
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
      console.error('Error deleting product:', err);
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

  // Pagination
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
                      <h1 className="text-2xl font-bold text-gray-900">პროდუქტის მართვა</h1>
        <p className="text-gray-600 mt-1">Manage your products, images, and bulk operations</p>
            </div>
            <button
              onClick={onAddNew}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Product
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Bulk Operations */}
        {selectedProducts.size > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-blue-200">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">
                {selectedProducts.size} product(s) selected
              </span>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value as 'active' | 'inactive')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="active">Set Active</option>
                <option value="inactive">Set Inactive</option>
              </select>
              <button
                onClick={handleBulkStatusUpdate}
                disabled={isBulkUpdating}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isBulkUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Update Status'
                )}
              </button>
              <button
                onClick={() => setSelectedProducts(new Set())}
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ფასი
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    სტატუსი
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    შექმნის თარიღი
                  </th>
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
                      >
                        {selectedProducts.has(product.id) ? (
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.primary_image_url && (
                          <img
                            className="h-10 w-10 rounded-lg object-cover mr-3"
                            src={product.primary_image_url}
                            alt={product.name}
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-gray-500">{product.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.effective_price ? (
                          <span className="text-green-600 font-medium">
                            ${formatPrice(product.effective_price)}
                          </span>
                        ) : (
                          <span>${formatPrice(product.price)}</span>
                        )}
                      </div>
                      {product.discount_percent && (
                        <div className="text-xs text-gray-500">
                          {product.discount_percent}% off
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : product.status === 'inactive'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.status === 'active' ? 'აქტიური' : product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.company_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(product.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, products.length)} of {products.length} results
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
    </div>
  );
};

export default ProductManagementPage;
