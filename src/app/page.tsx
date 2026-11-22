import Link from "next/link";
import Navbar from "@/components/Navbar";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export default async function Home() {
  let productCount = 0;
  let pendingOrderCount = 0;
  let totalRevenue = 0;
  let recentOrders: any[] = [];
  let recentProducts: any[] = [];

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const authHeaders: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const [analyticsRes, ordersRes, productsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/order/analytics`, {
        headers: authHeaders,
        cache: "no-store",
      }).catch(() => null),
      fetch(`${BACKEND_URL}/api/order`, {
        headers: authHeaders,
        cache: "no-store",
      }).catch(() => null),
      fetch(`${BACKEND_URL}/api/products`, {
        cache: "no-store",
      }).catch(() => null),
    ]);

    if (analyticsRes && analyticsRes.ok) {
      const data = await analyticsRes.json();
      if (data.statistics) {
        pendingOrderCount = data.statistics.pendingOrders ?? 0;
        totalRevenue = data.statistics.totalRevenue ?? 0;
      }
    }

    if (ordersRes && ordersRes.ok) {
      const data = await ordersRes.json();
      const allOrders: any[] = data.orders || [];
      recentOrders = allOrders.slice(0, 4);
      if (!totalRevenue && allOrders.length > 0) {
        totalRevenue = allOrders
          .filter((o: any) => o.status === "delivered")
          .reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
      }
      if (!pendingOrderCount) {
        pendingOrderCount = allOrders.filter((o: any) => o.status === "pending").length;
      }
    }

    if (productsRes && productsRes.ok) {
      const data = await productsRes.json();
      const allProducts: any[] = data.products || [];
      productCount = data.count ?? allProducts.length;
      recentProducts = allProducts.slice(0, 3);
    }
  } catch (error) {
    console.error("Error fetching dashboard stats from backend API:", error);
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#EDEDED] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        {/* Editorial Masthead */}
        <section className="border-b border-[#1E2126] pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 font-data text-[11px] uppercase tracking-[0.2em] text-neutral-500">
              <span>Velurian Atelier</span>
              <span className="text-neutral-700">/</span>
              <span>Ledger Index</span>
              <span className="text-neutral-700">/</span>
              <span className="text-neutral-400">{currentDate}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-display tracking-tight text-white font-normal">
              Console Overview
            </h1>
            <p className="text-sm text-neutral-400 max-w-xl font-light leading-relaxed">
              Real-time settlement balance, digital license allocations, and pending order clearance.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/upload"
              className="px-4 py-2 bg-white text-black text-xs font-data uppercase tracking-wider font-semibold hover:bg-neutral-200 transition-colors"
            >
              + Ingest Asset
            </Link>
            <Link
              href="/orders"
              className="px-4 py-2 border border-[#23262D] text-xs font-data uppercase tracking-wider text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
            >
              View Ledger
            </Link>
          </div>
        </section>

        {/* Executive Metrics Ledger (Structured Ledger Grid, No bubbly cards) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#1E2126] bg-[#101215] divide-y sm:divide-y-0 sm:divide-x divide-[#1E2126]">
          <div className="p-6 space-y-2">
            <span className="font-data text-[10px] uppercase tracking-widest text-neutral-500">
              Delivered Volume
            </span>
            <div className="text-2xl sm:text-3xl font-data font-semibold text-white tracking-tight">
              {totalRevenue.toLocaleString()} <span className="text-xs text-neutral-400 font-normal">DZD</span>
            </div>
            <p className="font-data text-[11px] text-neutral-500">
              Cumulative completed revenue
            </p>
          </div>

          <div className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-data text-[10px] uppercase tracking-widest text-neutral-500">
                Action Required
              </span>
              {pendingOrderCount > 0 && (
                <span className="inline-block px-1.5 py-0.5 text-[9px] font-data bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase tracking-widest">
                  Live
                </span>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-data font-semibold text-white tracking-tight">
              {pendingOrderCount} <span className="text-xs text-neutral-400 font-normal">Orders</span>
            </div>
            <p className="font-data text-[11px] text-amber-500/80">
              Pending fulfillment clearance
            </p>
          </div>

          <div className="p-6 space-y-2">
            <span className="font-data text-[10px] uppercase tracking-widest text-neutral-500">
              Active Inventory
            </span>
            <div className="text-2xl sm:text-3xl font-data font-semibold text-white tracking-tight">
              {productCount} <span className="text-xs text-neutral-400 font-normal">Units</span>
            </div>
            <p className="font-data text-[11px] text-neutral-500">
              Catalog products in database
            </p>
          </div>

          <div className="p-6 space-y-2">
            <span className="font-data text-[10px] uppercase tracking-widest text-neutral-500">
              System Architecture
            </span>
            <div className="text-lg font-data font-medium text-emerald-400 tracking-tight pt-1">
              POSTGRESQL + PRISMA
            </div>
            <p className="font-data text-[11px] text-neutral-500">
              Local images & JWT bearer auth
            </p>
          </div>
        </section>

        {/* Asymmetrical Operations Layout: 2/3 Operational Registry + 1/3 Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Column: Live Dispatch & Recent Activity */}
          <div className="lg:col-span-8 space-y-8">
            {/* Primary Navigation Portals (Editorial split panes) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link
                href="/products"
                className="group border border-[#1E2126] bg-[#101215] p-6 hover:border-neutral-500 transition-all duration-200 block space-y-4"
              >
                <div className="flex justify-between items-start">
                  <span className="font-data text-[10px] uppercase tracking-[0.25em] text-neutral-500">
                    ARCHIVE 01
                  </span>
                  <span className="text-neutral-500 group-hover:text-white transition-colors text-xs font-data">
                    ENTER &rarr;
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-display text-white group-hover:underline underline-offset-4 font-normal">
                    Inventory Catalog
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1 font-light leading-relaxed">
                    Audit software licenses, subscription tiers, and inventory stock availability.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#1C1F24] flex items-center justify-between font-data text-[11px] text-neutral-500">
                  <span>Total Managed</span>
                  <span className="text-neutral-300 font-semibold">{productCount} items</span>
                </div>
              </Link>

              <Link
                href="/orders"
                className="group border border-[#1E2126] bg-[#101215] p-6 hover:border-neutral-500 transition-all duration-200 block space-y-4"
              >
                <div className="flex justify-between items-start">
                  <span className="font-data text-[10px] uppercase tracking-[0.25em] text-neutral-500">
                    QUEUE 02
                  </span>
                  <span className="text-neutral-500 group-hover:text-white transition-colors text-xs font-data">
                    ENTER &rarr;
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-display text-white group-hover:underline underline-offset-4 font-normal">
                    Orders & Fulfillment
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1 font-light leading-relaxed">
                    Process incoming checkouts, review history logs, and manage delivered states.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#1C1F24] flex items-center justify-between font-data text-[11px] text-neutral-500">
                  <span>Pending Action</span>
                  <span className="text-amber-400 font-semibold">{pendingOrderCount} orders</span>
                </div>
              </Link>
            </div>

            {/* Recent Orders Ledger Table */}
            <div className="border border-[#1E2126] bg-[#101215]">
              <div className="p-5 border-b border-[#1E2126] flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base text-white">Recent Transactions</h3>
                  <p className="font-data text-[11px] text-neutral-500 mt-0.5">Most recent customer order dispatches</p>
                </div>
                <Link
                  href="/orders"
                  className="font-data text-xs text-neutral-400 hover:text-white transition-colors uppercase tracking-wider"
                >
                  Full Register &rarr;
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="p-8 text-center font-data text-xs text-neutral-500">
                  No order transactions recorded in the database.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-data text-xs">
                    <thead>
                      <tr className="border-b border-[#1E2126] text-neutral-500 text-[10px] uppercase tracking-wider bg-[#0C0E10]">
                        <th className="py-2.5 px-4 font-normal">ID</th>
                        <th className="py-2.5 px-4 font-normal">Customer</th>
                        <th className="py-2.5 px-4 font-normal">Amount</th>
                        <th className="py-2.5 px-4 font-normal">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1D22]">
                      {recentOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#14171A] transition-colors">
                          <td className="py-3 px-4 text-neutral-400 font-mono">#{ord.id}</td>
                          <td className="py-3 px-4 text-white">
                            {ord.customer?.name || ord.customer?.email || 'Guest Client'}
                          </td>
                          <td className="py-3 px-4 text-neutral-300 font-mono">
                            {ord.total.toLocaleString()} DZD
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 text-[10px] tracking-wider uppercase ${
                                ord.status === 'delivered'
                                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                                  : ord.status === 'returned'
                                  ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                                  : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Side Column: Studio Ingest Terminal & Inventory Preview */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Ingest Panel */}
            <div className="border border-[#1E2126] bg-[#101215] p-6 space-y-5">
              <div className="flex justify-between items-center">
                <span className="font-data text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  INGEST 03
                </span>
                <span className="h-1.5 w-1.5 bg-white rounded-full" />
              </div>

              <div>
                <h3 className="font-display text-xl text-white">Asset Cataloging</h3>
                <p className="text-xs text-neutral-400 mt-1 font-light leading-relaxed">
                  Register newly procured digital products, subscriptions, software serials, or license packages.
                </p>
              </div>

              <div className="space-y-2 border-t border-[#1C1F24] pt-4 font-data text-xs text-neutral-400">
                <div className="flex justify-between py-1">
                  <span className="text-neutral-500">Storage Target</span>
                  <span className="text-neutral-300">/public/uploads</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-neutral-500">Supported Media</span>
                  <span className="text-neutral-300">WEBP, PNG, JPG</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-neutral-500">Validation Mode</span>
                  <span className="text-emerald-400">Prisma Strict</span>
                </div>
              </div>

              <Link
                href="/upload"
                className="w-full block text-center py-2.5 bg-[#17191D] border border-[#2B2F37] text-white hover:bg-white hover:text-black hover:border-white transition-all duration-150 font-data text-xs uppercase tracking-wider font-medium"
              >
                Launch Ingestion Terminal &rarr;
              </Link>
            </div>

            {/* Catalog Snippet / Recently Indexed */}
            <div className="border border-[#1E2126] bg-[#101215] p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-[#1C1F24] pb-3">
                <span className="font-data text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  Recent Catalog Additions
                </span>
                <Link
                  href="/products"
                  className="font-data text-[10px] text-neutral-400 hover:text-white uppercase"
                >
                  All &rarr;
                </Link>
              </div>

              {recentProducts.length === 0 ? (
                <p className="font-data text-xs text-neutral-500">No products cataloged yet.</p>
              ) : (
                <div className="space-y-3 font-data text-xs">
                  {recentProducts.map((p) => (
                    <div key={p.id} className="flex justify-between items-center py-1 border-b border-[#1A1D22] last:border-0">
                      <div>
                        <div className="text-white font-medium truncate max-w-[150px]">{p.name}</div>
                        <span className="text-[10px] text-neutral-500 uppercase">{p.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-neutral-200">{p.price} DZD</div>
                        <span className={`text-[9px] uppercase ${p.inStock ? 'text-emerald-400' : 'text-neutral-500'}`}>
                          {p.inStock ? 'In Stock' : 'Out'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Editorial Colophon / Footer */}
      <footer className="border-t border-[#1E2126] mt-12 py-6 bg-[#0B0C0E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-neutral-500 font-data text-[11px] tracking-wider uppercase gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-white font-semibold">VELURIAN</span>
            <span className="text-neutral-700">|</span>
            <span>Atelier Core Registry v2.4</span>
          </div>
          <div>All rights reserved &bull; Encrypted Session</div>
        </div>
      </footer>
    </div>
  );
}
