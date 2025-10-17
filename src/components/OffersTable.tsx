import React from 'react';
import { useI18n } from '../i18n';
import { Plus, Edit, ChevronLeft, ChevronRight, Loader2, Check, X } from 'lucide-react';
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
  // Extended fields for discounts and images
  primary_image_url?: string;
  discount_percent?: number | string;
  effective_price?: number;
  discount_status?: string;
  discount_id?: number;
  discount_end_date?: string;
}

interface OffersTableProps {
  products?: Product[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onEdit?: (productId: number) => void;
  onAdd?: () => void;
}

const OffersTable: React.FC<OffersTableProps> = ({ 
  products = [], 
  loading = false, 
  error = null, 
  onRefresh,
  onEdit,
  onAdd
}) => {
  const { t } = useI18n();
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(10);
  const [search, setSearch] = React.useState('');
  const [discountFilter, setDiscountFilter] = React.useState<'all' | 'active' | 'inactive'>('active');
  const [editingPercentId, setEditingPercentId] = React.useState<number | null>(null);
  const [editingPercentValue, setEditingPercentValue] = React.useState<string>('');
  // selection removed per request

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

  // Keyboard shortcut: R to refresh
  React.useEffect(() => {
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

  // Filtering
  const filteredProducts = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => {
      if (q && !(p.name || '').toLowerCase().includes(q)) return false;
      // Determine discount state
      let dp: any = (p as any).discount_percent;
      if (typeof dp === 'string') dp = parseFloat(dp);
      const hasPositivePercent = typeof dp === 'number' && !isNaN(dp) && dp > 0;
      const hasDiscount = Boolean((p as any).discount_id) || hasPositivePercent;
      const isActive = hasDiscount && ((p as any).discount_status === 'active' || hasPositivePercent);
      if (discountFilter === 'active' && !isActive) return false;
      if (discountFilter === 'inactive' && isActive) return false;
      return true;
    });
  }, [products, search, discountFilter]);

  // Persist discount filter between visits
  React.useEffect(() => {
    const saved = localStorage.getItem('ui:discountFilter');
    if (saved === 'all' || saved === 'active' || saved === 'inactive') {
      setDiscountFilter(saved as any);
    } else {
      // default to active when nothing saved
      setDiscountFilter('active');
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('ui:discountFilter', discountFilter);
  }, [discountFilter]);

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const pageProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (next: number) => {
    if (next >= 1 && next <= totalPages) setCurrentPage(next);
  };

  // no-op placeholders removed

  // No product availability toggle anymore (by request)

  const savePercent = async (product: Product) => {
    try {
      if (!(product as any).discount_id) return;
      const val = parseFloat(editingPercentValue || '0');
      await apiService.upsertDiscount({ id: (product as any).discount_id as number, discount_percent: val, status: (product as any).discount_status || 'active' });
      setEditingPercentId(null);
      onRefresh?.();
    } catch (e) {
      console.error('Failed updating percent', e);
      alert('Failed to update percent');
    }
  };

  const toggleDiscountStatus = async (product: Product) => {
    try {
      const did = (product as any).discount_id as number | undefined;
      if (!did) return;
      const newStatus = ((product as any).discount_status === 'active') ? 'inactive' : 'active';
      await apiService.upsertDiscount({ id: did, status: newStatus as any });
      onRefresh?.();
    } catch (e) {
      console.error('Failed toggling discount status', e);
      alert('Failed to toggle discount status');
    }
  };

  const [confirmDiscountToggle, setConfirmDiscountToggle] = React.useState<Product | null>(null);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.discounts')}</h2>
        <div className="flex items-center space-x-3">
          {/* Search */}
          <input
            className="hidden md:block input w-56"
            placeholder={t('common.searchByName')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
          <div className="hidden md:flex items-center gap-1 text-sm text-gray-700" role="tablist" aria-label="Discount filter">
            <button
              role="tab"
              aria-selected={discountFilter === 'all'}
              className={`px-2 py-1 rounded ${discountFilter === 'all' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              onClick={() => { setDiscountFilter('all'); setCurrentPage(1); }}
            >
              {t('common.all')}
            </button>
            <button
              role="tab"
              aria-selected={discountFilter === 'active'}
              className={`px-2 py-1 rounded ${discountFilter === 'active' ? 'bg-green-100 text-green-800' : 'hover:bg-gray-100'}`}
              onClick={() => { setDiscountFilter('active'); setCurrentPage(1); }}
            >
              {t('common.active')}
            </button>
            <button
              role="tab"
              aria-selected={discountFilter === 'inactive'}
              className={`px-2 py-1 rounded ${discountFilter === 'inactive' ? 'bg-red-100 text-red-800' : 'hover:bg-gray-100'}`}
              onClick={() => { setDiscountFilter('inactive'); setCurrentPage(1); }}
            >
              {t('common.inactive')}
            </button>
          </div>
          <button 
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh"
            title={t('common.refresh')}
            className="btn btn-ghost disabled:opacity-50"
          >
            <Loader2 size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={onAdd} className="btn btn-primary">
            <Plus size={16} />
            <span>{t('common.addOffer')}</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          <span className="ml-2 text-gray-600">{t('common.loading')}</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="px-6 py-4 text-red-600 bg-red-50 border border-red-200 rounded-lg">
          <p>{t('common.error') || 'შეცდომა'}: {error}</p>
          <button 
            onClick={onRefresh}
            className="mt-2 text-sm text-red-700 underline hover:no-underline"
          >
            {t('common.retry') || 'კიდევ სცადე'}
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh] min-h-[60vh] stable-scroll">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="table-header">{t('table.discount')}</th>
                <th className="table-header">{t('table.description')}</th>
                <th className="table-header text-right">{t('table.price')}</th>
                <th className="table-header">{t('table.status')}</th>
                <th className="table-header text-right">{t('table.created')}</th>
                <th className="table-header">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pageProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {t('common.noResults') || 'შედეგი არ მოიძებნა'}
                  </td>
                </tr>
              ) : (
                pageProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-base animate-fade">
                    <td className="table-cell font-medium">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 text-gray-500 flex items-center justify-center transition-base hover:scale-[1.03]">
                          {product.primary_image_url ? (
                            <img className="h-full w-full object-cover" src={getProductListThumbUrl(product.primary_image_url as string)} alt={product.name || 'Product'} />
                          ) : (
                            <span className="text-sm font-medium">{(product.name || 'NA').split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          {/* Inline percent editor */}
                          {editingPercentId === product.id ? (
                            <div className="flex items-center gap-1 text-xs">
                              <input
                                className="w-14 border border-gray-300 rounded px-1 py-0.5"
                                type="number"
                                min={0}
                                max={100}
                                value={editingPercentValue}
                                onChange={(e) => setEditingPercentValue(e.target.value)}
                              />
                              <button className="p-1 text-green-600 hover:bg-green-50 rounded" onClick={() => savePercent(product)} title={t('common.save')}>
                                <Check size={14} />
                              </button>
                              <button className="p-1 text-red-600 hover:bg-red-50 rounded" onClick={() => setEditingPercentId(null)} title={t('common.cancel')}>
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            (() => {
                              let dp: any = (product as any).discount_percent;
                              if (typeof dp === 'string') dp = parseFloat(dp);
                              return (
                                <button
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-rose-50 text-rose-700 hover:bg-rose-100"
                                  onClick={() => { setEditingPercentId(product.id); setEditingPercentValue(isNaN(dp) ? '' : String(dp)); }}
                                  title={t('common.edit')}
                                >
                                  {dp && !isNaN(dp) && dp > 0 ? `-${dp}%` : t('offers.setPercent')}
                                </button>
                              );
                            })()
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-sm text-gray-600 max-w-xs truncate">
                      {product.description || t('common.descriptionMissing')}
                    </td>
                    <td className="table-cell text-right">
                       {(() => {
                         try {
                          // Prefer effective (discounted) price
                          let effective = product.effective_price as any;
                          if (typeof effective === 'string') effective = parseFloat(effective);
                          if (effective !== null && effective !== undefined && !isNaN(effective)) {
                            return <span className="text-green-600 font-semibold tabular-nums">${effective.toFixed(2)}</span>;
                          }
                          if (product.price !== null && product.price !== undefined) {
                            const numPrice = Number(product.price);
                            return isNaN(numPrice) ? t('common.na') : <span className="tabular-nums">${numPrice.toFixed(2)}</span>;
                           }
                           return t('common.na');
                         } catch (error) {
                           console.error('Error formatting price:', error, product.price);
                           return t('common.na');
                         }
                       })()}
                     </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {(product as any).discount_id ? (
                          <button
                            onClick={() => setConfirmDiscountToggle(product)}
                            className={`px-2 py-1 text-xs rounded-full ${((product as any).discount_status === 'active') ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}
                            title={t('discount.toggleTitle')}
                          >
                            {((product as any).discount_status === 'active') ? t('common.active') : t('common.inactive')}
                          </button>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{t('common.inactive')}</span>
                        )}
                      </div>
                    </td>
                    <td className="table-cell text-sm text-gray-500 text-right tabular-nums">
                      {new Date(product.created_at).toLocaleDateString()}
                    </td>
                    <td className="table-cell">
                      <button className="p-1 hover:bg-gray-100 rounded" onClick={() => onEdit && onEdit(product.id)}>
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

      {/* Confirm discount toggle modal */}
      {confirmDiscountToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('common.confirm')}</h3>
            <p className="text-sm text-gray-700 mb-4">
              {((confirmDiscountToggle as any).discount_status === 'active')
                ? t('discount.turnOffConfirm')
                : t('discount.turnOnConfirm')}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setConfirmDiscountToggle(null)}>{t('common.cancel')}</button>
              <button
                className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => { const p = confirmDiscountToggle; setConfirmDiscountToggle(null); if (p) toggleDiscountStatus(p); }}
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-gray-700">
            <span>
            {t('common.showing')} {startIndex + 1} {t('common.of')} {endIndex} {t('common.of')} {totalItems} {t('common.results')}
          </span>
          <label className="flex items-center gap-2">
            <span className="text-gray-500">{t('common.perPage')}</span>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(parseInt(e.target.value) || 10); setCurrentPage(1); }}
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <button className={`p-2 rounded-lg ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`} onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
          <button className="px-3 py-2 bg-accent-purple text-white rounded-lg text-sm font-medium">{currentPage}</button>
          <button className={`p-2 rounded-lg ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`} onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OffersTable;
