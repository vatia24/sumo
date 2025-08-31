import React, { useState } from 'react';
import { 
  RotateCcw, 
  Filter, 
  ChevronDown,
  X
} from 'lucide-react';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterData) => void;
  onReset: () => void;
}

export interface FilterData {
  title: string;
  category: string;
  subcategory: string;
  startDate: string;
  endDate: string;
  originalPrice: string;
  discountPercent: string;
  finalPrice: string;
  status: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ 
  isOpen, 
  onClose, 
  onApplyFilters, 
  onReset 
}) => {
  const [filters, setFilters] = useState<FilterData>({
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

  const [showDropdowns, setShowDropdowns] = useState({
    title: false,
    category: false,
    subcategory: false,
    startDate: false,
    endDate: false,
    originalPrice: false,
    discountPercent: false,
    finalPrice: false,
    status: false
  });

  const categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Toys'];
  const subcategories = ['Smartphones', 'Laptops', 'Accessories', 'Men', 'Women', 'Kids'];
  const statuses = ['Active', 'Inactive', 'Pending', 'Expired'];

  const handleFilterChange = (field: keyof FilterData, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleDropdownToggle = (field: keyof typeof showDropdowns) => {
    setShowDropdowns(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
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
    onReset();
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Filter Offers</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Filter Content */}
        <div className="p-6">
          {/* First Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            {/* Title */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.title}
                  onChange={(e) => handleFilterChange('title', e.target.value)}
                  placeholder="Search title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                />
                <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Category */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div className="relative">
                <button
                  onClick={() => handleDropdownToggle('category')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between"
                >
                  <span className={filters.category ? 'text-gray-900' : 'text-gray-500'}>
                    {filters.category || 'Category'}
                  </span>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
                {showDropdowns.category && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          handleFilterChange('category', category);
                          handleDropdownToggle('category');
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Subcategory */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
              <div className="relative">
                <button
                  onClick={() => handleDropdownToggle('subcategory')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between"
                >
                  <span className={filters.subcategory ? 'text-gray-900' : 'text-gray-500'}>
                    {filters.subcategory || 'Subcategory'}
                  </span>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
                {showDropdowns.subcategory && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    {subcategories.map((subcategory) => (
                      <button
                        key={subcategory}
                        onClick={() => {
                          handleFilterChange('subcategory', subcategory);
                          handleDropdownToggle('subcategory');
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {subcategory}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Original Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Original price</label>
              <div className="relative">
                <input
                  type="number"
                  value={filters.originalPrice}
                  onChange={(e) => handleFilterChange('originalPrice', e.target.value)}
                  placeholder="Min price"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                />
                <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Discount % */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount %</label>
              <div className="relative">
                <input
                  type="number"
                  value={filters.discountPercent}
                  onChange={(e) => handleFilterChange('discountPercent', e.target.value)}
                  placeholder="Min discount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                />
                <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Final Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Final price</label>
              <div className="relative">
                <input
                  type="number"
                  value={filters.finalPrice}
                  onChange={(e) => handleFilterChange('finalPrice', e.target.value)}
                  placeholder="Max price"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                />
                <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Status */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="relative">
                <button
                  onClick={() => handleDropdownToggle('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between"
                >
                  <span className={filters.status ? 'text-gray-900' : 'text-gray-500'}>
                    {filters.status || 'status'}
                  </span>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
                {showDropdowns.status && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    {statuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          handleFilterChange('status', status);
                          handleDropdownToggle('status');
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Active Filters:</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (value) {
                    return (
                      <span
                        key={key}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {key}: {value}
                        <button
                          onClick={() => handleFilterChange(key as keyof FilterData, '')}
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
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyFilters}
              className="flex items-center space-x-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <Filter size={16} />
              <span>Filters</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
