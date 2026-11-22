'use client';

import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function UploadProductPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploadedProduct, setUploadedProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Form field mirrors for live preview
  const [previewName, setPreviewName] = useState('');
  const [previewPrice, setPreviewPrice] = useState('');
  const [previewCategory, setPreviewCategory] = useState('Streaming');
  const [previewPlatform, setPreviewPlatform] = useState('');
  const [previewDesc, setPreviewDesc] = useState('');

  // Handle image preview
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPreviewImages([]);
    const files = e.target.files;
    
    if (files) {
      const newPreviews: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          newPreviews.push(URL.createObjectURL(file));
        }
      }
      setPreviewImages(newPreviews);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setUploadedProduct(null);
    
    try {
      const formData = new FormData(e.currentTarget);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      const response = await fetch('/api/products/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Asset ingestion rejected by database.');
      }
      
      setSuccess('Asset registered successfully in PostgreSQL database.');
      setUploadedProduct(data.product);
      formRef.current?.reset();
      setPreviewImages([]);
      setPreviewName('');
      setPreviewPrice('');
      setPreviewDesc('');
      setPreviewPlatform('');
      
    } catch (err: any) {
      setError(err.message || 'Ingestion failed: verify server connectivity.');
    } finally {
      setIsSubmitting(false);
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
              <span className="text-white">Ingestion Terminal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-normal text-white tracking-tight">
              Ingest Digital Asset
            </h1>
            <p className="text-xs text-neutral-400 font-light max-w-xl">
              Catalogue software licenses, subscriptions, and accounts. Photography is automatically saved locally to disk.
            </p>
          </div>

          <Link
            href="/products"
            className="font-data text-xs uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
          >
            &larr; Return to Inventory
          </Link>
        </section>

        {/* Feedback Messages */}
        {error && (
          <div className="border border-rose-900/60 bg-rose-950/20 p-4 font-data text-xs text-rose-300">
            <span className="font-semibold block mb-0.5 text-rose-200">[ ERROR ]</span>
            {error}
          </div>
        )}

        {success && (
          <div className="border border-emerald-900/60 bg-emerald-950/20 p-4 font-data text-xs text-emerald-300">
            <span className="font-semibold block mb-0.5 text-emerald-200">[ INGESTION CONFIRMED ]</span>
            {success}
          </div>
        )}

        {/* Studio Intake Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Ingestion Form (7 Cols) */}
          <div className="lg:col-span-7">
            <form 
              ref={formRef}
              onSubmit={handleSubmit} 
              className="border border-[#1E2126] bg-[#101215] p-6 sm:p-8 space-y-8"
            >
              {/* Fieldset 1: Identity */}
              <div className="space-y-4">
                <span className="font-data text-[10px] uppercase tracking-[0.25em] text-neutral-500 block border-b border-[#1A1D22] pb-2">
                  01 / Core Identification
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label htmlFor="name" className="block font-data text-[11px] uppercase tracking-wider text-neutral-400">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={previewName}
                      onChange={(e) => setPreviewName(e.target.value)}
                      placeholder="e.g., Netflix Ultra UHD 4K (Private Account)"
                      className="w-full bg-[#0C0E11] border border-[#252830] px-3.5 py-2.5 text-xs font-data text-white placeholder-neutral-600 focus:border-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="price" className="block font-data text-[11px] uppercase tracking-wider text-neutral-400">
                      Price (DZD) *
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      min="0"
                      step="0.01"
                      required
                      value={previewPrice}
                      onChange={(e) => setPreviewPrice(e.target.value)}
                      placeholder="3500"
                      className="w-full bg-[#0C0E11] border border-[#252830] px-3.5 py-2.5 text-xs font-data text-white placeholder-neutral-600 focus:border-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Fieldset 2: Classification */}
              <div className="space-y-4">
                <span className="font-data text-[10px] uppercase tracking-[0.25em] text-neutral-500 block border-b border-[#1A1D22] pb-2">
                  02 / Taxonomy & Protocol
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="category" className="block font-data text-[11px] uppercase tracking-wider text-neutral-400">
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      required
                      value={previewCategory}
                      onChange={(e) => setPreviewCategory(e.target.value)}
                      className="w-full bg-[#0C0E11] border border-[#252830] px-3.5 py-2.5 text-xs font-data text-white focus:border-white focus:outline-none transition-colors"
                    >
                      <option value="Streaming">Streaming</option>
                      <option value="Gaming">Gaming</option>
                      <option value="Software">Software</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="productType" className="block font-data text-[11px] uppercase tracking-wider text-neutral-400">
                      Product Type *
                    </label>
                    <select
                      id="productType"
                      name="productType"
                      required
                      className="w-full bg-[#0C0E11] border border-[#252830] px-3.5 py-2.5 text-xs font-data text-white focus:border-white focus:outline-none transition-colors"
                    >
                      <option value="account">Account</option>
                      <option value="subscription">Subscription</option>
                      <option value="license">License</option>
                      <option value="gift-card">Gift Card</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="platform" className="block font-data text-[11px] uppercase tracking-wider text-neutral-400">
                      Platform *
                    </label>
                    <input
                      type="text"
                      id="platform"
                      name="platform"
                      placeholder="e.g., Windows, Steam"
                      required
                      value={previewPlatform}
                      onChange={(e) => setPreviewPlatform(e.target.value)}
                      className="w-full bg-[#0C0E11] border border-[#252830] px-3.5 py-2.5 text-xs font-data text-white placeholder-neutral-600 focus:border-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label htmlFor="subscriptionDuration" className="block font-data text-[11px] uppercase tracking-wider text-neutral-400">
                      Duration
                    </label>
                    <select
                      id="subscriptionDuration"
                      name="subscriptionDuration"
                      className="w-full bg-[#0C0E11] border border-[#252830] px-3.5 py-2.5 text-xs font-data text-white focus:border-white focus:outline-none transition-colors"
                    >
                      <option value="N/A">N/A</option>
                      <option value="1-month">1 Month</option>
                      <option value="3-months">3 Months</option>
                      <option value="6-months">6 Months</option>
                      <option value="1-year">1 Year</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="deliveryMethod" className="block font-data text-[11px] uppercase tracking-wider text-neutral-400">
                      Delivery Method
                    </label>
                    <select
                      id="deliveryMethod"
                      name="deliveryMethod"
                      className="w-full bg-[#0C0E11] border border-[#252830] px-3.5 py-2.5 text-xs font-data text-white focus:border-white focus:outline-none transition-colors"
                    >
                      <option value="email">Email</option>
                      <option value="instant">Instant</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 flex flex-col justify-end pb-1">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        id="inStock"
                        name="inStock"
                        defaultChecked
                        className="w-4 h-4 bg-[#0C0E11] border border-[#252830] rounded-none accent-white cursor-pointer"
                      />
                      <span className="font-data text-xs text-neutral-300">Set Immediately In Stock</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Fieldset 3: Editorial Copy */}
              <div className="space-y-4">
                <span className="font-data text-[10px] uppercase tracking-[0.25em] text-neutral-500 block border-b border-[#1A1D22] pb-2">
                  03 / Curatorial Description
                </span>

                <div className="space-y-1.5">
                  <label htmlFor="desc" className="block font-data text-[11px] uppercase tracking-wider text-neutral-400">
                    Brief Index Summary *
                  </label>
                  <input
                    type="text"
                    id="desc"
                    name="desc"
                    required
                    value={previewDesc}
                    onChange={(e) => setPreviewDesc(e.target.value)}
                    placeholder="Short one-line description for catalog ledger"
                    className="w-full bg-[#0C0E11] border border-[#252830] px-3.5 py-2.5 text-xs font-data text-white placeholder-neutral-600 focus:border-white focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="fullDesc" className="block font-data text-[11px] uppercase tracking-wider text-neutral-400">
                    Comprehensive Asset Specs *
                  </label>
                  <textarea
                    id="fullDesc"
                    name="fullDesc"
                    required
                    rows={4}
                    placeholder="Enter full license terms, redemption procedures, and account specifications..."
                    className="w-full bg-[#0C0E11] border border-[#252830] p-3 text-xs font-data text-white placeholder-neutral-600 focus:border-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Fieldset 4: Photography */}
              <div className="space-y-4">
                <span className="font-data text-[10px] uppercase tracking-[0.25em] text-neutral-500 block border-b border-[#1A1D22] pb-2">
                  04 / Visual Asset Photography
                </span>

                <div className="space-y-2">
                  <label htmlFor="pictures" className="block font-data text-[11px] uppercase tracking-wider text-neutral-400">
                    Upload Images (Saved locally to /public/uploads) *
                  </label>
                  <input
                    type="file"
                    id="pictures"
                    name="pictures"
                    accept="image/*"
                    multiple
                    required
                    onChange={handleImageChange}
                    className="w-full bg-[#0C0E11] border border-[#252830] px-3 py-2 text-xs font-data text-neutral-400 file:mr-4 file:py-1 file:px-3 file:border-0 file:text-[10px] file:uppercase file:font-data file:tracking-wider file:bg-white file:text-black file:font-semibold hover:file:bg-neutral-200 transition-colors cursor-pointer"
                  />
                </div>

                {previewImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                    {previewImages.map((preview, index) => (
                      <div 
                        key={index} 
                        className="relative aspect-video w-full border border-[#252830] bg-[#0C0D10] overflow-hidden cursor-pointer group"
                        onClick={() => setSelectedImage(preview)}
                      >
                        <img
                          src={preview}
                          alt={`Asset draft ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <span className="absolute bottom-1 right-1 font-data text-[8px] bg-black/80 px-1 text-white">
                          #{index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ingest Action Button */}
              <div className="pt-4 border-t border-[#1C1F25]">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-white text-black font-data text-xs uppercase tracking-[0.2em] font-semibold hover:bg-neutral-200 focus:outline-none transition-all duration-150 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <span>RECORDING INTO ARCHIVE...</span>
                  ) : (
                    <span>CONFIRM & REGISTER ASSET &rarr;</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Inspector & Confirmation Receipt (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Preview Card */}
            <div className="border border-[#1E2126] bg-[#101215] p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-[#1C1F24] pb-3">
                <span className="font-data text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                  Live Terminal Preview
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </div>

              {/* Mockup Card */}
              <div className="border border-[#252830] bg-[#0E1012] overflow-hidden">
                <div className="relative aspect-[4/3] w-full bg-[#08090A] flex items-center justify-center overflow-hidden">
                  {previewImages.length > 0 ? (
                    <img
                      src={previewImages[0]}
                      alt="Primary asset"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="font-data text-[11px] text-neutral-600 uppercase tracking-widest text-center px-4">
                      [ Awaiting Image Selection ]
                    </div>
                  )}

                  <div className="absolute top-2 left-2">
                    <span className="font-data text-[9px] uppercase tracking-widest px-2 py-0.5 bg-[#0B0C0E]/90 border border-[#2B2F37] text-neutral-300">
                      {previewCategory}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-baseline gap-2">
                    <h4 className="font-display text-base text-white truncate font-normal">
                      {previewName || 'Untitled Asset Record'}
                    </h4>
                    <span className="font-data text-xs text-white font-semibold shrink-0">
                      {previewPrice ? Number(previewPrice).toLocaleString() : '0'} DZD
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 font-light line-clamp-2">
                    {previewDesc || 'Short description will appear in catalog index and client dispatch notes.'}
                  </p>

                  <div className="pt-2 border-t border-[#1C1F24] flex items-center justify-between font-data text-[10px] text-neutral-500">
                    <span>PLATFORM: {previewPlatform || 'GENERIC'}</span>
                    <span className="text-emerald-400">READY</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ingestion Receipt Block (Shows after successful upload) */}
            {uploadedProduct && (
              <div className="border border-emerald-900/60 bg-[#0E1410] p-6 space-y-4 font-data text-xs">
                <div className="flex justify-between items-center border-b border-emerald-900/40 pb-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-400">
                    Ingestion Receipt
                  </span>
                  <span className="text-emerald-300 font-mono">RECORD #{uploadedProduct.id}</span>
                </div>

                <div className="space-y-2 text-neutral-300">
                  <div className="flex justify-between py-0.5 border-b border-emerald-950">
                    <span className="text-neutral-500">Title:</span>
                    <span className="text-white font-medium">{uploadedProduct.name}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-emerald-950">
                    <span className="text-neutral-500">Settlement Price:</span>
                    <span className="text-emerald-400">{uploadedProduct.price} DZD</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-emerald-950">
                    <span className="text-neutral-500">Category:</span>
                    <span>{uploadedProduct.category}</span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-emerald-950">
                    <span className="text-neutral-500">Local Images Stored:</span>
                    <span>{uploadedProduct.pictures?.length || 0} file(s)</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <Link
                    href="/products"
                    className="text-white underline underline-offset-4 hover:text-emerald-300"
                  >
                    View in Catalog &rarr;
                  </Link>
                  <button
                    onClick={() => setUploadedProduct(null)}
                    className="text-neutral-500 hover:text-white"
                  >
                    Clear Receipt
                  </button>
                </div>
              </div>
            )}

            {/* Guidelines Checklist */}
            <div className="border border-[#1E2126] bg-[#101215] p-6 space-y-3 font-data text-xs text-neutral-400">
              <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 block">
                Atelier Ingestion Protocol
              </span>
              <ul className="space-y-2 text-[11px] leading-relaxed">
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400">&bull;</span>
                  <span>Images are written directly to <code className="text-neutral-300 font-mono">public/uploads</code>.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400">&bull;</span>
                  <span>JWT session authorizes this write transaction to PostgreSQL.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-emerald-400">&bull;</span>
                  <span>Public marketplace API endpoint reflects updates immediately.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Enlarged Image Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-3xl max-h-[85vh] border border-[#2B2F37] overflow-hidden">
            <img src={selectedImage} alt="Enlarged preview" className="w-full h-full object-contain" />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#1E2126] mt-12 py-6 bg-[#0B0C0E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-neutral-500 font-data text-[11px] tracking-wider uppercase gap-4">
          <div>Velurian Asset Ingestion Protocol</div>
          <div>Strict Validation Enabled</div>
        </div>
      </footer>
    </div>
  );
}
