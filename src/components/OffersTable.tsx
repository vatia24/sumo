import React, { useState, useEffect } from 'react';
import { Plus, Edit, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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
}

interface OffersTableProps {
  products?: Product[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

const OffersTable: React.FC<OffersTableProps> = ({ 
  products = [], 
  loading = false, 
  error = null, 
  onRefresh 
}) => {

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">All Products</h2>
        <div className="flex items-center space-x-3">
          <button 
            onClick={onRefresh}
            disabled={loading}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50"
          >
            <Loader2 size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="bg-accent-purple hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200">
            <Plus size={16} />
            <span>Add New +</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          <span className="ml-2 text-gray-600">Loading products...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="px-6 py-4 text-red-600 bg-red-50 border border-red-200 rounded-lg">
          <p>Error: {error}</p>
          <button 
            onClick={onRefresh}
            className="mt-2 text-sm text-red-700 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">ID</th>
                <th className="table-header">Name</th>
                <th className="table-header">Description</th>
                <th className="table-header">Price</th>
                <th className="table-header">Status</th>
                <th className="table-header">Created</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No products found. Create your first product to get started!
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">#{product.id}</td>
                    <td className="table-cell font-medium">{product.name}</td>
                    <td className="table-cell text-sm text-gray-600 max-w-xs truncate">
                      {product.description || 'No description'}
                    </td>
                                         <td className="table-cell">
                       {(() => {
                         try {
                           if (product.price !== null && product.price !== undefined) {
                             const numPrice = Number(product.price);
                             return isNaN(numPrice) ? 'N/A' : `$${numPrice.toFixed(2)}`;
                           }
                           return 'N/A';
                         } catch (error) {
                           console.error('Error formatting price:', error, product.price);
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
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Edit size={16} className="text-gray-500" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing 7 of 1,234 Results
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50">
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
          <button className="px-3 py-2 bg-accent-purple text-white rounded-lg text-sm font-medium">1</button>
          <button className="px-3 py-2 hover:bg-gray-100 rounded-lg text-sm text-gray-600">2</button>
          <button className="px-3 py-2 hover:bg-gray-100 rounded-lg text-sm text-gray-600">3</button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OffersTable;
