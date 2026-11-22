'use client';

import Image from 'next/image';
import { useState } from 'react';

export type Product = {
  id?: number | string;
  _id?: string;
  name: string;
  price: number;
  desc: string;
  fullDesc: string;
  category: string;
  productType: string;
  platform: string;
  subscriptionDuration?: string;
  deliveryMethod?: string;
  views: number;
  stars: number;
  sold: number;
  pictures: string[];
  inStock: boolean;
};

type ProductCardProps = {
  product: Product;
  onDelete: (productId: string) => void;
  onInspect?: (product: Product) => void;
};

export default function ProductCard({ product, onDelete, onInspect }: ProductCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const productId = (product.id ?? product._id)?.toString() || '';

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    await onDelete(productId);
    setIsDeleting(false);
    setShowConfirmation(false);
  };

  const handleCancelDelete = () => {
    setShowConfirmation(false);
  };

  const handleCardClick = () => {
    if (onInspect) {
      onInspect(product);
    }
  };

  return (
    <article 
      onClick={handleCardClick}
      className="border border-[#1E2126] bg-[#111316] hover:border-neutral-400 transition-all duration-200 flex flex-col justify-between group relative cursor-pointer"
    >
      <div>
        {/* Gallery Image Display */}
        <div className="relative aspect-[4/3] w-full bg-[#0C0D10] border-b border-[#1E2126] overflow-hidden">
          {product.pictures && product.pictures.length > 0 ? (
            <Image
              src={product.pictures[0]}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300"
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center font-data text-xs text-neutral-500">
              <span>[ NO VISUAL ATTACHED ]</span>
            </div>
          )}

          {/* Type / Platform Tag Overlay */}
          <div className="absolute top-2.5 left-2.5 flex space-x-1.5">
            <span className="font-data text-[9px] uppercase tracking-widest px-2 py-0.5 bg-[#0B0C0E]/90 border border-[#2B2F37] text-neutral-300 backdrop-blur-sm">
              {product.category}
            </span>
            {product.platform && (
              <span className="font-data text-[9px] uppercase tracking-widest px-2 py-0.5 bg-[#0B0C0E]/90 border border-[#2B2F37] text-neutral-400 backdrop-blur-sm">
                {product.platform}
              </span>
            )}
          </div>

          {/* Stock Indicator Top-Right */}
          <div className="absolute top-2.5 right-2.5">
            <span
              className={`font-data text-[9px] uppercase tracking-widest px-2 py-0.5 border backdrop-blur-sm ${
                product.inStock
                  ? 'bg-[#0B0C0E]/90 border-emerald-500/40 text-emerald-400'
                  : 'bg-[#0B0C0E]/90 border-neutral-700 text-neutral-500'
              }`}
            >
              {product.inStock ? 'Available' : 'Depleted'}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-display text-base font-normal text-white group-hover:underline underline-offset-4 truncate">
              {product.name}
            </h3>
            <span className="font-data text-xs font-semibold text-white tracking-tight shrink-0">
              {product.price.toLocaleString()} <span className="text-[10px] text-neutral-400 font-normal">DZD</span>
            </span>
          </div>

          <p className="text-xs text-neutral-400 font-light line-clamp-2 leading-relaxed">
            {product.desc}
          </p>
        </div>
      </div>

      {/* Footer / Meta Specs & Actions */}
      <div className="px-4 py-3 border-t border-[#1C1F24] bg-[#0E1012] flex items-center justify-between font-data text-[10px] text-neutral-400">
        <div className="flex items-center space-x-2">
          <span>SOLD: {product.sold || 0}</span>
          <span>&bull;</span>
          <span className="uppercase">{product.deliveryMethod || 'Instant'}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="text-neutral-300 hover:text-white uppercase tracking-wider transition-colors"
          >
            Inspect
          </button>
          <span className="text-neutral-700">|</span>
          <button
            onClick={handleDeleteClick}
            className="text-neutral-500 hover:text-rose-400 uppercase tracking-wider transition-colors cursor-pointer"
            title="Delete product record"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Minimalist Confirmation Overlay */}
      {showConfirmation && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border border-[#2B2F37] bg-[#121418] max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            <div className="space-y-1">
              <span className="font-data text-[10px] uppercase tracking-[0.2em] text-rose-400 block">
                Confirm Purge
              </span>
              <h4 className="font-display text-lg text-white font-normal">
                Delete &ldquo;{product.name}&rdquo;?
              </h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-light">
              This will permanently revoke this item from the catalog and delete any locally hosted asset photography. This operation cannot be reversed.
            </p>
            <div className="flex justify-end space-x-3 pt-2 font-data text-xs">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 border border-[#2B2F37] text-neutral-300 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white uppercase tracking-wider font-semibold transition-colors cursor-pointer disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Purging...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
