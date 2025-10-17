import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  X, 
  ChevronDown,
  Calendar,
  DollarSign,
  Percent,
  Loader2
} from 'lucide-react';
import { apiService } from '../services/api';
import { useCompany } from '../contexts/CompanyContext';

interface AddOfferPageProps {
  onBack?: () => void;
  onProductCreated?: () => void;
}

const AddOfferPage: React.FC<AddOfferPageProps> = ({ onBack, onProductCreated }) => {
  const { company, loading: companyLoading, error: companyError } = useCompany();
  
  const [formData, setFormData] = useState({
    name: '',
    price: '125',
    description: '',
    category: '',
    subcategory: '',
    location: '',
    startDate: '',
    endDate: '',
    originalPrice: '',
    discountPercentage: '0',
    stock: '1',
    company_id: 1 // Default company ID - will be updated from context
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form data when company is loaded
  useEffect(() => {
    if (company) {
      setFormData(prev => ({ ...prev, company_id: company.id }));
    }
  }, [company]);

  const [categories, setCategories] = useState<{ id: number; name: string; slug: string; parent_id?: number; image_path?: string }[]>([]);
  const [subcategories, setSubcategories] = useState<{ id: number; name: string; slug: string; parent_id?: number; image_path?: string }[]>([]);
  const locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiService.listCategories({ parent_id: null, limit: 200 });
        if (!cancelled) setCategories(res.categories);
      } catch (e) {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!formData.category) { setSubcategories([]); return; }
      const root = categories.find(c => String(c.id) === String(formData.category) || c.slug === formData.category || c.name === formData.category);
      if (!root) { setSubcategories([]); return; }
      try {
        const res = await apiService.listCategories({ parent_id: root.id, limit: 200 });
        if (!cancelled) setSubcategories(res.categories);
      } catch (e) {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [formData.category, categories]);

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!company) {
      setError('Company information not available. Please try again.');
      return;
    }

    // Enforce: every product must have a discount
    if (!formData.discountPercentage || parseFloat(formData.discountPercentage) <= 0) {
      setError('Discount is required. Please set a discount percentage greater than 0.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare product data
      const quantity = Number(formData.stock || '0');
      const productData = {
        company_id: company.id,
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description || undefined,
        // Map stock to availability with existing status field
        status: quantity > 0 ? ('active' as const) : ('inactive' as const),
        // Add other fields as needed
      };

      // Create the product
      const createdProduct = await apiService.upsertProduct(productData);
      console.log('Product created:', createdProduct);

      // Assign categories if selected
      const catIds: number[] = [];
      if (formData.category) catIds.push(Number(formData.category));
      if (formData.subcategory) catIds.push(Number(formData.subcategory));
      if (catIds.length > 0 && createdProduct?.id) {
        try { await apiService.setProductCategories(createdProduct.id, catIds); } catch {}
      }

      // If there's a discount, create it
      if (parseFloat(formData.discountPercentage) > 0) {
        const discountData = {
          company_id: company.id,
          product_id: createdProduct.id,
          discount_percent: parseFloat(formData.discountPercentage),
          status: 'active' as const,
          start_date: formData.startDate || undefined,
          end_date: formData.endDate || undefined,
        };

        await apiService.upsertDiscount(discountData);
        console.log('Discount created for product:', createdProduct.id);
      }

      // Show success message and go back
      alert('Product created successfully!');
      if (onProductCreated) {
        onProductCreated();
      }
      handleCancel();
    } catch (err: any) {
      console.error('Error creating product:', err);
      setError(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form or navigate back
    setFormData({
      name: '',
      price: '125',
      description: '',
      category: '',
      subcategory: '',
      location: '',
      startDate: '',
      endDate: '',
      originalPrice: '',
      discountPercentage: '0',
      stock: '1',
      company_id: 1
    });
    setUploadedFiles([]);
    setError(null);
    if (onBack) {
      onBack();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Offer</h1>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Offer Information */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Offer information</h2>
            <p className="text-gray-600 text-sm">
              Product Information encompasses all data within an organization pertaining to the products it manufactures, procures, sells, or distributes.
            </p>
          </div>

          <div className="space-y-4">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter Product Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Product Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Short Description about the product"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Product Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Category</label>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={String(category.id)}>{category.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Product Subcategory */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Subcategory</label>
              <div className="relative">
                <select
                  value={formData.subcategory}
                  onChange={(e) => handleInputChange('subcategory', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  required
                >
                  <option value="">Select Category</option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory.id} value={String(subcategory.id)}>{subcategory.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <div className="relative">
                <select
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  required
                >
                  <option value="">Select Type</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Original Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Original Price</label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                  placeholder="Enter original price"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Discount Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount Percentage</label>
              <div className="relative">
                <Percent size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={formData.discountPercentage}
                  onChange={(e) => handleInputChange('discountPercentage', e.target.value)}
                  min="0"
                  max="100"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Product Gallery */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Gallery</h2>
            <p className="text-gray-600 text-sm">
              You need at least 4 images. Pay attention to the quality of the pictures you add (important)
            </p>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-gray-500 mb-4">
              (This is just a demo dropzone. Selected files are not actually uploads)
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
            >
              Choose Files
            </label>
          </div>

          {/* Uploaded Files Preview */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Uploaded Files:</h3>
              <div className="grid grid-cols-2 gap-3">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Creating Product...
                </>
              ) : (
                'Create Product'
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddOfferPage;
