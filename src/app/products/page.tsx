'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import ProductCard, { Product } from '@/components/ProductCard';
import Navbar from '@/components/Navbar';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'sold'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Inspector Dossier modal state
  const [inspectingProduct, setInspectingProduct] = useState<Product | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('/api/products', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch product records');
      }
      
      const data = await response.json();
      setProducts(data.products || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load inventory. Please verify database connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDeleteProduct = async (productId: string) => {
    try {
      setDeleteError(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product record');
      }

      if (inspectingProduct && (inspectingProduct.id ?? inspectingProduct._id)?.toString() === productId) {
        setInspectingProduct(null);
      }

      fetchProducts();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setDeleteError(err.message || 'Failed to delete product.');
    }
  };

  const handleToggleStock = async (product: Product) => {
    const pId = (product.id ?? product._id)?.toString();
    if (!pId) return;

    try {
      setIsUpdatingStock(true);
      const newStockState = !product.inStock;
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`/api/products/${pId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ inStock: newStockState }),
      });

      if (!response.ok) {
        throw new Error('Failed to update availability status');
      }

      const data = await response.json();
      const updated = data.product;

      // Update in state
      setProducts(prev => 
        prev.map(p => (p.id ?? p._id)?.toString() === pId ? { ...p, inStock: updated.inStock } : p)
      );

      if (inspectingProduct && (inspectingProduct.id ?? inspectingProduct._id)?.toString() === pId) {
        setInspectingProduct(prev => prev ? { ...prev, inStock: updated.inStock } : null);
      }

    } catch (err: any) {
      console.error('Error updating stock status:', err);
      alert(err.message || 'Error updating stock.');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const handleOpenInspect = (product: Product) => {
    setInspectingProduct(product);
    setActivePhotoIndex(0);
  };

  // Filtered & Sorted list
  const processedProducts = useMemo(() => {
    let result = products.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        p.name.toLowerCase().includes(q) ||
        p.desc?.toLowerCase().includes(q) ||
        p.platform?.toLowerCase().includes(q) ||
        p.productType?.toLowerCase().includes(q);
      
      const matchesCat = 
        selectedCategory === 'ALL' || 
        p.category?.toUpperCase() === selectedCategory;

      const matchesStock = 
        stockFilter === 'ALL' ? true :
        stockFilter === 'IN_STOCK' ? p.inStock === true :
        p.inStock === false;

      return matchesSearch && matchesCat && matchesStock;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'sold') return (b.sold || 0) - (a.sold || 0);
      // 'newest' default
      return Number(b.id || 0) - Number(a.id || 0);
    });

    return result;
  }, [products, searchQuery, selectedCategory, stockFilter, sortBy]);

  // Overall catalog metrics
  const catalogStats = useMemo(() => {
    const totalCount = products.length;
    const inStockCount = products.filter(p => p.inStock).length;
    const depletedCount = totalCount - inStockCount;
    const valuation = products
      .filter(p => p.inStock)
      .reduce((sum, p) => sum + p.price, 0);

    return { totalCount, inStockCount, depletedCount, valuation };
  }, [products]);

  const categories = ['ALL', 'STREAMING', 'GAMING', 'SOFTWARE', 'OTHER'];

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#EDEDED] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Editorial Section Header */}
        <section className="border-b border-[#1E2126] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 font-data text-[11px] uppercase tracking-[0.2em] text-neutral-500">
              <Link href="/" className="hover:text-white transition-colors">Console</Link>
              <span className="text-neutral-700">/</span>
              <span className="text-white">Inventory Index</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-normal text-white tracking-tight">
              Catalog Registry
            </h1>
            <p className="text-xs text-neutral-400 font-light max-w-xl">
              Central asset management console for license allocations, customer subscriptions, and digital credentials.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex border border-[#1E2126] bg-[#101215] p-0.5 font-data text-[11px]">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 uppercase tracking-wider transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
                title="Visual Card Grid"
              >
                [::] Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 uppercase tracking-wider transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
                title="Dense Archival Ledger"
              >
                [=] Ledger
              </button>
            </div>

            <Link
              href="/upload"
              className="px-4 py-2 bg-white text-black font-data text-xs uppercase tracking-wider font-semibold hover:bg-neutral-200 transition-colors"
            >
              + Ingest New Asset
            </Link>
          </div>
        </section>

        {/* Executive Valuation Ticker Bar */}
        <section className="grid grid-cols-2 md:grid-cols-4 border border-[#1E2126] bg-[#101215] divide-y md:divide-y-0 md:divide-x divide-[#1E2126]">
          <div className="p-5 space-y-1">
            <span className="font-data text-[10px] uppercase tracking-widest text-neutral-500">Total Catalog Assets</span>
            <div className="text-2xl font-data font-semibold text-white tracking-tight">
              {catalogStats.totalCount} <span className="text-xs text-neutral-500 font-normal">Units</span>
            </div>
            <p className="font-data text-[10px] text-neutral-500">Indexed in PostgreSQL database</p>
          </div>

          <div className="p-5 space-y-1">
            <span className="font-data text-[10px] uppercase tracking-widest text-emerald-500">Live Inventory Value</span>
            <div className="text-2xl font-data font-semibold text-emerald-400 tracking-tight">
              {catalogStats.valuation.toLocaleString()} <span className="text-xs text-neutral-400 font-normal">DZD</span>
            </div>
            <p className="font-data text-[10px] text-neutral-500">Cumulative retail inventory value</p>
          </div>

          <div className="p-5 space-y-1">
            <span className="font-data text-[10px] uppercase tracking-widest text-neutral-400">Available For Checkout</span>
            <div className="text-2xl font-data font-semibold text-white tracking-tight">
              {catalogStats.inStockCount} <span className="text-xs text-neutral-500 font-normal">Active</span>
            </div>
            <p className="font-data text-[10px] text-neutral-500">Instant digital dispatch enabled</p>
          </div>

          <div className="p-5 space-y-1">
            <span className="font-data text-[10px] uppercase tracking-widest text-rose-500">Depleted / Depleted</span>
            <div className="text-2xl font-data font-semibold text-rose-400 tracking-tight">
              {catalogStats.depletedCount} <span className="text-xs text-neutral-500 font-normal">Units</span>
            </div>
            <p className="font-data text-[10px] text-neutral-500">Awaiting procurement restock</p>
          </div>
        </section>

        {/* Delete Error Notification */}
        {deleteError && (
          <div className="border border-rose-900/60 bg-rose-950/20 p-4 font-data text-xs text-rose-300 flex justify-between items-center">
            <span>[ ERROR ]: {deleteError}</span>
            <button 
              onClick={() => setDeleteError(null)}
              className="text-rose-400 hover:text-white uppercase font-bold text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Search, Filter & Sort Console */}
        <div className="border border-[#1E2126] bg-[#101215] divide-y divide-[#1E2126]">
          {/* Top Filter Bar: Categories + Availability Presets */}
          <div className="p-3.5 flex flex-wrap items-center justify-between gap-3">
            {/* Category Segmented Control */}
            <div className="flex flex-wrap items-center gap-1.5 font-data text-[11px]">
              <span className="text-neutral-500 text-[10px] uppercase tracking-wider mr-1 hidden sm:inline">Category:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 uppercase tracking-wider transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-white text-black font-semibold'
                      : 'bg-[#15171B] border border-[#23262D] text-neutral-400 hover:text-white hover:border-neutral-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Availability Filter Tabs */}
            <div className="flex items-center space-x-1.5 font-data text-[11px]">
              <span className="text-neutral-500 text-[10px] uppercase tracking-wider mr-1 hidden sm:inline">Stock:</span>
              {(['ALL', 'IN_STOCK', 'OUT_OF_STOCK'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStockFilter(filter)}
                  className={`px-2.5 py-1 uppercase tracking-wider transition-colors cursor-pointer ${
                    stockFilter === filter
                      ? 'border border-neutral-300 text-white bg-[#1A1D22]'
                      : 'border border-[#23262D] text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {filter === 'ALL' ? 'All' : filter === 'IN_STOCK' ? 'Available' : 'Depleted'}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Filter Bar: Search + Sort Dropdown */}
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="w-full sm:max-w-md">
              <input
                type="text"
                placeholder="Search catalog by title, platform, license type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0C0E11] border border-[#252830] px-3.5 py-2 text-xs font-data text-white placeholder-neutral-500 focus:border-white focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center space-x-3 font-data text-xs">
              <span className="text-neutral-500 uppercase text-[10px] tracking-wider shrink-0">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#0C0E11] border border-[#252830] px-3 py-2 text-xs font-data text-white focus:border-white focus:outline-none transition-colors cursor-pointer"
              >
                <option value="newest">Recently Cataloged</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="sold">Most Volume Sold</option>
              </select>

              {(searchQuery || selectedCategory !== 'ALL' || stockFilter !== 'ALL' || sortBy !== 'newest') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                    setStockFilter('ALL');
                    setSortBy('newest');
                  }}
                  className="px-2.5 py-1.5 border border-rose-900/40 text-rose-400 hover:bg-rose-950/30 uppercase text-[10px] transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Container (Grid vs Table) */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3 font-data text-xs text-neutral-500">
            <span className="h-2 w-2 bg-white animate-ping" />
            <p className="uppercase tracking-widest">[ SYNCHRONIZING WITH DATABASE... ]</p>
          </div>
        ) : error ? (
          <div className="border border-[#262A32] bg-[#121417] p-8 text-center space-y-3 font-data text-xs">
            <p className="text-rose-400">{error}</p>
            <button
              onClick={fetchProducts}
              className="px-4 py-2 border border-[#2B2F37] text-white hover:bg-white hover:text-black transition-colors uppercase tracking-wider cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : processedProducts.length === 0 ? (
          <div className="border border-dashed border-[#22252C] bg-[#0E1013] p-16 text-center space-y-3 font-data text-xs text-neutral-500">
            <p className="uppercase tracking-widest">No matching assets found in this view.</p>
            {(searchQuery || selectedCategory !== 'ALL' || stockFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                  setStockFilter('ALL');
                }}
                className="text-white underline underline-offset-4 hover:text-neutral-300 uppercase text-[11px]"
              >
                Clear All Search & Category Filters
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Visual Gallery Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {processedProducts.map((product) => {
              const pId = (product.id ?? product._id)?.toString() || '';
              return (
                <ProductCard
                  key={pId}
                  product={product as any}
                  onDelete={handleDeleteProduct}
                  onInspect={handleOpenInspect}
                />
              );
            })}
          </div>
        ) : (
          /* Archival Ledger Table */
          <div className="border border-[#1E2126] bg-[#101215] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-data text-xs">
                <thead>
                  <tr className="border-b border-[#1E2126] text-neutral-500 text-[10px] uppercase tracking-wider bg-[#0C0E10]">
                    <th className="py-3 px-4 font-normal">Asset Item</th>
                    <th className="py-3 px-4 font-normal">Classification</th>
                    <th className="py-3 px-4 font-normal">Platform</th>
                    <th className="py-3 px-4 font-normal">Valuation</th>
                    <th className="py-3 px-4 font-normal">Sold</th>
                    <th className="py-3 px-4 font-normal">Status</th>
                    <th className="py-3 px-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1D22]">
                  {processedProducts.map((p) => {
                    const pId = (p.id ?? p._id)?.toString() || '';
                    return (
                      <tr 
                        key={pId} 
                        onClick={() => handleOpenInspect(p)}
                        className="hover:bg-[#14171A] transition-colors cursor-pointer group"
                      >
                        {/* Title & Thumbnail */}
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-[#0C0D10] border border-[#23262D] shrink-0 overflow-hidden relative">
                              {p.pictures && p.pictures[0] ? (
                                <img
                                  src={p.pictures[0]}
                                  alt={p.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-[9px] text-neutral-600">
                                  N/A
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-white font-medium group-hover:underline underline-offset-4">
                                {p.name}
                              </div>
                              <div className="text-[10px] text-neutral-500 line-clamp-1 max-w-xs">
                                {p.desc}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4 text-neutral-300 uppercase text-[11px]">
                          {p.category}
                        </td>

                        {/* Platform */}
                        <td className="py-3 px-4 text-neutral-400">
                          {p.platform || 'Cross-Platform'}
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4 font-mono font-semibold text-white">
                          {p.price.toLocaleString()} <span className="text-[10px] text-neutral-500 font-normal">DZD</span>
                        </td>

                        {/* Sold */}
                        <td className="py-3 px-4 text-neutral-400 font-mono">
                          {p.sold || 0}
                        </td>

                        {/* Stock */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 text-[9px] uppercase tracking-wider border ${
                              p.inStock
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-neutral-800 border-neutral-700 text-neutral-500'
                            }`}
                          >
                            {p.inStock ? 'In Stock' : 'Depleted'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td 
                          className="py-3 px-4 text-right space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleToggleStock(p)}
                            disabled={isUpdatingStock}
                            className="px-2.5 py-1 border border-[#23262D] text-neutral-300 hover:text-white hover:border-neutral-500 text-[10px] uppercase transition-colors cursor-pointer"
                          >
                            {p.inStock ? 'Deplete' : 'Restock'}
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(pId)}
                            className="px-2.5 py-1 border border-rose-900/50 text-rose-400 hover:bg-rose-950/40 text-[10px] uppercase transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Asset Dossier Inspector Modal */}
      {inspectingProduct && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setInspectingProduct(null)}
        >
          <div 
            className="border border-[#282C34] bg-[#111317] w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-[#1E2126] flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 font-data text-[10px] uppercase tracking-[0.25em] text-neutral-500">
                  <span>Velurian Asset Dossier</span>
                  <span className="text-neutral-700">/</span>
                  <span className="text-white font-mono">RECORD #{inspectingProduct.id ?? inspectingProduct._id}</span>
                </div>
                <h3 className="font-display text-2xl text-white font-normal">
                  {inspectingProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setInspectingProduct(null)}
                className="font-data text-xs text-neutral-500 hover:text-white uppercase tracking-wider cursor-pointer"
              >
                [ ESC / CLOSE ]
              </button>
            </div>

            {/* Dossier Content */}
            <div className="p-6 space-y-8">
              {/* Photo Strip & Gallery */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Main Hero Photo (8 Cols) */}
                <div className="md:col-span-8 bg-[#0C0D10] border border-[#23262D] aspect-video relative overflow-hidden flex items-center justify-center">
                  {inspectingProduct.pictures && inspectingProduct.pictures.length > 0 ? (
                    <img
                      src={inspectingProduct.pictures[activePhotoIndex] || inspectingProduct.pictures[0]}
                      alt={inspectingProduct.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="font-data text-xs text-neutral-600 uppercase tracking-widest">
                      [ NO PHOTOGRAPHY AVAILABLE ]
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex space-x-2">
                    <span className="font-data text-[10px] uppercase tracking-widest px-2.5 py-0.5 bg-black/80 border border-[#2A2E35] text-white">
                      {inspectingProduct.category}
                    </span>
                    <span className="font-data text-[10px] uppercase tracking-widest px-2.5 py-0.5 bg-black/80 border border-[#2A2E35] text-neutral-300">
                      {inspectingProduct.platform}
                    </span>
                  </div>
                </div>

                {/* Thumbnails + Specs Quick Column (4 Cols) */}
                <div className="md:col-span-4 space-y-4">
                  {/* Thumbnails */}
                  {inspectingProduct.pictures && inspectingProduct.pictures.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {inspectingProduct.pictures.map((pic, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActivePhotoIndex(idx)}
                          className={`aspect-square border bg-[#0C0D10] cursor-pointer overflow-hidden ${
                            activePhotoIndex === idx ? 'border-white' : 'border-[#23262D] opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={pic} alt="Thumb" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Core Valuation Box */}
                  <div className="border border-[#20232A] bg-[#0C0E11] p-4 space-y-3 font-data text-xs">
                    <div className="flex justify-between items-baseline border-b border-[#1A1D22] pb-2">
                      <span className="text-neutral-500 uppercase text-[10px]">Price:</span>
                      <span className="text-white font-mono text-base font-semibold">
                        {inspectingProduct.price.toLocaleString()} DZD
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-neutral-500">Stock Status:</span>
                      <span className={`uppercase font-semibold text-[10px] ${
                        inspectingProduct.inStock ? 'text-emerald-400' : 'text-neutral-500'
                      }`}>
                        {inspectingProduct.inStock ? 'Available' : 'Depleted'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-neutral-500">Product Type:</span>
                      <span className="text-neutral-300 uppercase">{inspectingProduct.productType || 'account'}</span>
                    </div>

                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-neutral-500">Delivery:</span>
                      <span className="text-neutral-300 uppercase">{inspectingProduct.deliveryMethod || 'email'}</span>
                    </div>

                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-neutral-500">Duration:</span>
                      <span className="text-neutral-300">{inspectingProduct.subscriptionDuration || 'N/A'}</span>
                    </div>

                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-neutral-500">Units Sold:</span>
                      <span className="text-neutral-300 font-mono">{inspectingProduct.sold || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Curatorial Copy & Descriptions */}
              <div className="space-y-4 border-t border-[#1E2126] pt-6 font-data text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-neutral-500 block mb-1">
                    Short Summary
                  </span>
                  <p className="text-neutral-300 leading-relaxed font-light">
                    {inspectingProduct.desc}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-widest text-neutral-500 block mb-1">
                    Comprehensive License Documentation & Terms
                  </span>
                  <div className="bg-[#0C0E11] border border-[#20232A] p-4 text-neutral-300 font-light leading-relaxed whitespace-pre-line">
                    {inspectingProduct.fullDesc || 'No extended documentation provided for this asset.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-6 border-t border-[#1E2126] bg-[#0C0E11] flex flex-wrap justify-between items-center font-data text-xs gap-3">
              <button
                onClick={() => setInspectingProduct(null)}
                className="px-4 py-2 border border-[#23262D] text-neutral-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close Dossier
              </button>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleToggleStock(inspectingProduct)}
                  disabled={isUpdatingStock}
                  className={`px-4 py-2 border uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                    inspectingProduct.inStock
                      ? 'border-neutral-600 text-neutral-300 hover:bg-neutral-800'
                      : 'border-emerald-500/50 bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isUpdatingStock ? 'Updating...' : inspectingProduct.inStock ? 'Mark As Depleted' : 'Restock Asset'}
                </button>

                <button
                  onClick={() => {
                    const pId = (inspectingProduct.id ?? inspectingProduct._id)?.toString();
                    if (pId && confirm(`Are you sure you want to permanently delete "${inspectingProduct.name}"?`)) {
                      handleDeleteProduct(pId);
                    }
                  }}
                  className="px-4 py-2 border border-rose-900/60 bg-rose-950/20 text-rose-300 hover:bg-rose-900/40 uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Purge Asset Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#1E2126] mt-12 py-6 bg-[#0B0C0E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-neutral-500 font-data text-[11px] tracking-wider uppercase gap-4">
          <div>Velurian Inventory Register</div>
          <div>All assets synchronized with PostgreSQL</div>
        </div>
      </footer>
    </div>
  );
}
