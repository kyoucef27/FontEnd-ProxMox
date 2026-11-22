'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { formatDistanceToNow } from 'date-fns';

// Define Order type
interface OrderItem {
  productId: string;
  quantity: number;
  product?: any;
}

interface Customer {
  name?: string;
  email?: string;
  address?: string;
  city?: string;
  phone?: string;
}

interface Order {
  id?: number | string;
  _id: string;
  items: OrderItem[];
  total: number;
  customer: Customer;
  timestamp: string;
  status: 'pending' | 'delivered' | 'returned';
  deliveryDate?: string;
  returnDate?: string;
  statusHistory: {
    status: string;
    timestamp: string;
    note?: string;
  }[];
  createdAt: string;
}

// Define Analytics type
interface Analytics {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  returnedOrders: number;
  weeklyData: {
    date: string;
    orders: number;
    revenue: number;
  }[];
  monthlyData: {
    month: string;
    orders: number;
    revenue: number;
  }[];
}

export default function OrdersPage() {
  // State variables
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  
  // Filter states
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders();
    fetchAnalytics();
  }, []);

  // Apply filters when tab or search changes
  useEffect(() => {
    applyFilters();
  }, [orders, activeTab, searchTerm, startDate, endDate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('/api/order', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch order records');
      }
      
      // Fetch product details for each order item
      const ordersWithProducts = await Promise.all(
        (data.orders || []).map(async (rawOrder: any) => {
          const orderIdStr = (rawOrder.id ?? rawOrder._id ?? '').toString();
          const order = { ...rawOrder, _id: orderIdStr, id: rawOrder.id ?? rawOrder._id };
          const itemsWithDetails = await Promise.all(
            (order.items || []).map(async (item: any) => {
              try {
                const productResponse = await fetch(`/api/products/${item.productId}`);
                const productData = await productResponse.json();
                return {
                  ...item,
                  product: productResponse.ok ? productData.product : null
                };
              } catch (error) {
                console.error(`Error fetching product ${item.productId}:`, error);
                return item;
              }
            })
          );
          
          return {
            ...order,
            items: itemsWithDetails
          };
        })
      );
      
      setOrders(ordersWithProducts);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching orders.');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/order/analytics');
      const data = await response.json();
      
      if (!response.ok) {
        setAnalytics({
          totalOrders: 0,
          pendingOrders: 0,
          deliveredOrders: 0,
          returnedOrders: 0,
          weeklyData: [],
          monthlyData: []
        });
        return;
      }
      
      setAnalytics(data.statistics);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setAnalytics({
        totalOrders: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        returnedOrders: 0,
        weeklyData: [],
        monthlyData: []
      });
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];
    
    // Filter by tab (status)
    if (activeTab !== 'all') {
      filtered = filtered.filter(order => order.status === activeTab);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.customer?.name?.toLowerCase().includes(term) ||
        order.customer?.email?.toLowerCase().includes(term) ||
        order._id.toLowerCase().includes(term)
      );
    }
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= start && orderDate <= end;
      });
    } else if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= start;
      });
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate <= end;
      });
    }
    
    setFilteredOrders(filtered);
  };

  const handleStatusChange = async (orderId: string, newStatus: 'pending' | 'delivered' | 'returned') => {
    try {
      const response = await fetch(`/api/order/status/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          note: `Order marked as ${newStatus} by admin`
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Failed to update order to ${newStatus}`);
      }
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? { ...order, ...data.order, _id: order._id } : order
        )
      );
      
      fetchAnalytics();
      
      if (showModal && selectedOrder?._id === orderId) {
        setSelectedOrder({ ...data.order, _id: orderId });
      }
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating order status.');
      console.error('Error updating order status:', err);
    }
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const setDateRange = (range: 'today' | 'week' | 'month') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setEndDate(todayStr);
    
    if (range === 'today') {
      setStartDate(todayStr);
    } else if (range === 'week') {
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);
      setStartDate(lastWeek.toISOString().split('T')[0]);
    } else if (range === 'month') {
      const lastMonth = new Date();
      lastMonth.setMonth(today.getMonth() - 1);
      setStartDate(lastMonth.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#EDEDED] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Editorial Section Header */}
        <section className="border-b border-[#1E2126] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 font-data text-[11px] uppercase tracking-[0.2em] text-neutral-500">
              <Link href="/" className="hover:text-white transition-colors">Console</Link>
              <span className="text-neutral-700">/</span>
              <span className="text-white">Transaction Ledger</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-normal text-white tracking-tight">
              Order Fulfillment Desk
            </h1>
            <p className="text-xs text-neutral-400 font-light max-w-xl">
              Audit client checkouts, dispatch digital licenses, and review chronological status history.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="font-data text-xs text-neutral-500 border border-[#1E2126] px-3 py-2 bg-[#101215]">
              MATCHED: <span className="text-white font-semibold">{filteredOrders.length}</span>
            </span>
          </div>
        </section>

        {/* Executive Analytics Ticker Bar */}
        {analytics && (
          <section className="grid grid-cols-2 md:grid-cols-4 border border-[#1E2126] bg-[#101215] divide-y md:divide-y-0 md:divide-x divide-[#1E2126]">
            <div className="p-5 space-y-1">
              <span className="font-data text-[10px] uppercase tracking-widest text-neutral-500">Total Volume</span>
              <div className="text-2xl font-data font-semibold text-white tracking-tight">
                {analytics.totalOrders}
              </div>
              <p className="font-data text-[10px] text-neutral-500">Cumulative logged orders</p>
            </div>

            <div className="p-5 space-y-1">
              <span className="font-data text-[10px] uppercase tracking-widest text-amber-500">Pending Clearance</span>
              <div className="text-2xl font-data font-semibold text-amber-400 tracking-tight">
                {analytics.pendingOrders}
              </div>
              <p className="font-data text-[10px] text-neutral-500">Requires fulfillment</p>
            </div>

            <div className="p-5 space-y-1">
              <span className="font-data text-[10px] uppercase tracking-widest text-emerald-500">Delivered</span>
              <div className="text-2xl font-data font-semibold text-emerald-400 tracking-tight">
                {analytics.deliveredOrders}
              </div>
              <p className="font-data text-[10px] text-neutral-500">Completed & confirmed</p>
            </div>

            <div className="p-5 space-y-1">
              <span className="font-data text-[10px] uppercase tracking-widest text-rose-500">Returned</span>
              <div className="text-2xl font-data font-semibold text-rose-400 tracking-tight">
                {analytics.returnedOrders}
              </div>
              <p className="font-data text-[10px] text-neutral-500">Revoked / refunded</p>
            </div>
          </section>
        )}

        {/* Error Notification */}
        {error && (
          <div className="border border-rose-900/60 bg-rose-950/20 p-4 font-data text-xs text-rose-300 flex justify-between items-center">
            <span>[ ERROR ]: {error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-white uppercase font-bold text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Unified Control Console (Status Tabs + Filter Strip) */}
        <div className="border border-[#1E2126] bg-[#101215] divide-y divide-[#1E2126]">
          {/* Status Tabs Bar */}
          <div className="flex flex-wrap items-center justify-between p-3 gap-2">
            <div className="flex items-center space-x-1 font-data text-xs">
              {(['all', 'pending', 'delivered', 'returned'] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 uppercase tracking-wider transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-white text-black font-semibold'
                        : 'text-neutral-400 hover:text-white hover:bg-[#15171B]'
                    }`}
                  >
                    {tab === 'all' ? 'All Orders' : tab}
                  </button>
                );
              })}
            </div>

            {/* Quick Date Presets */}
            <div className="flex items-center space-x-1.5 font-data text-[11px]">
              <span className="text-neutral-600 uppercase text-[10px] tracking-wider mr-1 hidden sm:inline">Range:</span>
              <button
                onClick={() => setDateRange('today')}
                className="px-2.5 py-1 bg-[#141619] border border-[#23262D] text-neutral-400 hover:text-white hover:border-neutral-500 uppercase transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setDateRange('week')}
                className="px-2.5 py-1 bg-[#141619] border border-[#23262D] text-neutral-400 hover:text-white hover:border-neutral-500 uppercase transition-colors"
              >
                7 Days
              </button>
              <button
                onClick={() => setDateRange('month')}
                className="px-2.5 py-1 bg-[#141619] border border-[#23262D] text-neutral-400 hover:text-white hover:border-neutral-500 uppercase transition-colors"
              >
                30 Days
              </button>
              {(startDate || endDate || searchTerm || activeTab !== 'all') && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setSearchTerm('');
                    setActiveTab('all');
                  }}
                  className="px-2.5 py-1 border border-rose-900/50 text-rose-400 hover:bg-rose-950/30 uppercase transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Search & Custom Date Inputs Bar */}
          <div className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="w-full md:max-w-md">
              <input
                type="text"
                placeholder="Search by client name, email, or order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0C0E11] border border-[#252830] px-3.5 py-2 text-xs font-data text-white placeholder-neutral-500 focus:border-white focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center space-x-2 font-data text-xs">
              <span className="text-neutral-500 text-[10px] uppercase">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#0C0E11] border border-[#252830] px-2.5 py-1.5 text-xs font-data text-neutral-300 focus:border-white focus:outline-none"
              />
              <span className="text-neutral-500 text-[10px] uppercase">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#0C0E11] border border-[#252830] px-2.5 py-1.5 text-xs font-data text-neutral-300 focus:border-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Financial Orders Table */}
        <div className="border border-[#1E2126] bg-[#101215] overflow-hidden">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3 font-data text-xs text-neutral-500">
              <span className="h-2 w-2 bg-white animate-ping" />
              <p className="uppercase tracking-widest">[ LOADING ORDER REGISTRY... ]</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-16 text-center space-y-2 font-data text-xs text-neutral-500">
              <p className="uppercase tracking-widest">No order transactions found matching the active query.</p>
              <p className="text-[11px] text-neutral-600">Try adjusting your filters or date boundaries.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-data text-xs">
                <thead>
                  <tr className="border-b border-[#1E2126] text-neutral-500 text-[10px] uppercase tracking-wider bg-[#0C0E10]">
                    <th className="py-3 px-4 font-normal">Reference</th>
                    <th className="py-3 px-4 font-normal">Client</th>
                    <th className="py-3 px-4 font-normal">Payload</th>
                    <th className="py-3 px-4 font-normal">Settlement</th>
                    <th className="py-3 px-4 font-normal">Recorded</th>
                    <th className="py-3 px-4 font-normal">Status</th>
                    <th className="py-3 px-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1D22]">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-[#14171A] transition-colors group">
                      {/* Reference ID */}
                      <td 
                        onClick={() => openOrderDetails(order)}
                        className="py-3.5 px-4 text-white font-mono cursor-pointer hover:underline underline-offset-4"
                      >
                        #{order._id.length > 8 ? order._id.substring(order._id.length - 8) : order._id}
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <div className="text-white font-medium">
                          {order.customer?.name || 'Guest Client'}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {order.customer?.email || 'No email attached'}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4 text-neutral-300">
                        {order.items?.length || 0} {(order.items?.length === 1 ? 'asset' : 'assets')}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-white">
                        {order.total.toLocaleString()} <span className="text-[10px] text-neutral-500 font-normal">DZD</span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-neutral-400">
                        <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-neutral-600">
                          {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] tracking-wider uppercase ${
                            order.status === 'delivered'
                              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                              : order.status === 'returned'
                              ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                              : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => openOrderDetails(order)}
                          className="px-2.5 py-1 border border-[#23262D] text-neutral-300 hover:text-white hover:border-neutral-500 text-[10px] uppercase transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(order._id, 'delivered')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] uppercase font-semibold transition-colors cursor-pointer"
                          >
                            Deliver
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <button
                            onClick={() => handleStatusChange(order._id, 'returned')}
                            className="px-2.5 py-1 border border-rose-900/50 text-rose-400 hover:bg-rose-950/40 text-[10px] uppercase transition-colors cursor-pointer"
                          >
                            Return
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Order Inspection Dossier Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="border border-[#282C34] bg-[#111317] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#1E2126] flex justify-between items-start">
              <div>
                <span className="font-data text-[10px] uppercase tracking-[0.25em] text-neutral-500 block">
                  Transaction Audit Dossier
                </span>
                <h3 className="font-display text-2xl text-white font-normal mt-1">
                  Order #{selectedOrder._id}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="font-data text-xs text-neutral-500 hover:text-white uppercase tracking-wider cursor-pointer"
              >
                [ ESC / CLOSE ]
              </button>
            </div>

            {/* Dossier Body */}
            <div className="p-6 space-y-6">
              {/* Client & Settlement Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-[#1E2126] pb-6">
                <div className="space-y-2">
                  <span className="font-data text-[10px] uppercase tracking-widest text-neutral-500 block">
                    Client Profile
                  </span>
                  <div className="bg-[#0C0E11] border border-[#20232A] p-4 space-y-1.5 font-data text-xs">
                    <p><span className="text-neutral-500">Name:</span> <span className="text-white font-medium">{selectedOrder.customer?.name || 'N/A'}</span></p>
                    <p><span className="text-neutral-500">Email:</span> <span className="text-neutral-300">{selectedOrder.customer?.email || 'N/A'}</span></p>
                    <p><span className="text-neutral-500">Phone:</span> <span className="text-neutral-300">{selectedOrder.customer?.phone || 'N/A'}</span></p>
                    <p><span className="text-neutral-500">City:</span> <span className="text-neutral-300">{selectedOrder.customer?.city || 'N/A'}</span></p>
                    <p><span className="text-neutral-500">Address:</span> <span className="text-neutral-300">{selectedOrder.customer?.address || 'N/A'}</span></p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-data text-[10px] uppercase tracking-widest text-neutral-500 block">
                    Settlement Parameters
                  </span>
                  <div className="bg-[#0C0E11] border border-[#20232A] p-4 space-y-1.5 font-data text-xs">
                    <p className="flex justify-between">
                      <span className="text-neutral-500">Status:</span>
                      <span className={`uppercase font-semibold ${
                        selectedOrder.status === 'delivered' ? 'text-emerald-400' :
                        selectedOrder.status === 'returned' ? 'text-rose-400' : 'text-amber-400'
                      }`}>
                        {selectedOrder.status}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-neutral-500">Order Date:</span>
                      <span className="text-neutral-300">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                    </p>
                    {selectedOrder.deliveryDate && (
                      <p className="flex justify-between">
                        <span className="text-neutral-500">Delivered On:</span>
                        <span className="text-neutral-300">{new Date(selectedOrder.deliveryDate).toLocaleString()}</span>
                      </p>
                    )}
                    {selectedOrder.returnDate && (
                      <p className="flex justify-between">
                        <span className="text-neutral-500">Returned On:</span>
                        <span className="text-neutral-300">{new Date(selectedOrder.returnDate).toLocaleString()}</span>
                      </p>
                    )}
                    <div className="border-t border-[#1C1F25] pt-2 mt-2 flex justify-between font-medium">
                      <span className="text-white">Total Amount:</span>
                      <span className="text-emerald-400 font-mono text-sm">{selectedOrder.total.toLocaleString()} DZD</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items Registry */}
              <div className="space-y-3">
                <span className="font-data text-[10px] uppercase tracking-widest text-neutral-500 block">
                  Allocated Assets ({selectedOrder.items?.length || 0})
                </span>
                <div className="border border-[#20232A] bg-[#0C0E11] overflow-hidden">
                  <table className="w-full text-left font-data text-xs">
                    <thead>
                      <tr className="border-b border-[#1E2126] text-neutral-500 text-[10px] uppercase tracking-wider">
                        <th className="py-2.5 px-4 font-normal">Asset Item</th>
                        <th className="py-2.5 px-4 font-normal">Unit Price</th>
                        <th className="py-2.5 px-4 font-normal text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1D22]">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              {item.product?.pictures && item.product.pictures[0] && (
                                <img
                                  src={item.product.pictures[0]}
                                  alt="Product thumbnail"
                                  className="h-8 w-8 object-cover border border-[#23262D]"
                                />
                              )}
                              <div>
                                <div className="text-white font-medium">
                                  {item.product?.name || `Product ID: ${item.productId}`}
                                </div>
                                <div className="text-[10px] text-neutral-500 uppercase">
                                  {item.product?.category || 'Digital'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-neutral-300 font-mono">
                            {item.product?.price ? `${item.product.price.toLocaleString()} DZD` : 'Included'}
                          </td>
                          <td className="py-3 px-4 text-right text-white font-mono">
                            &times;{item.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status Audit History Timeline */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div className="space-y-3">
                  <span className="font-data text-[10px] uppercase tracking-widest text-neutral-500 block">
                    Status Audit Trail
                  </span>
                  <div className="border border-[#20232A] bg-[#0C0E11] p-4 space-y-3 font-data text-xs">
                    {selectedOrder.statusHistory.map((hist, index) => (
                      <div key={index} className="flex items-start space-x-3 border-l-2 border-[#262A32] pl-3 py-0.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="uppercase text-white font-semibold">{hist.status}</span>
                            <span className="text-[10px] text-neutral-500">
                              {new Date(hist.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {hist.note && (
                            <p className="text-neutral-400 text-[11px] font-light">{hist.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-6 border-t border-[#1E2126] bg-[#0C0E11] flex justify-between items-center font-data text-xs">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-[#23262D] text-neutral-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close Dossier
              </button>

              <div className="flex space-x-3">
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder._id, 'delivered')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                  >
                    Mark as Delivered &rarr;
                  </button>
                )}
                {selectedOrder.status === 'delivered' && (
                  <button
                    onClick={() => handleStatusChange(selectedOrder._id, 'returned')}
                    className="px-4 py-2 border border-rose-900/60 bg-rose-950/20 text-rose-300 hover:bg-rose-900/40 uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Mark as Returned
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#1E2126] mt-12 py-6 bg-[#0B0C0E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-neutral-500 font-data text-[11px] tracking-wider uppercase gap-4">
          <div>Velurian Transaction Ledger</div>
          <div>All records logged with audit timestamps</div>
        </div>
      </footer>
    </div>
  );
}
