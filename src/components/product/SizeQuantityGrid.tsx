"use client";

import React, { useState } from "react";
import { Input } from "../input/Input";

interface SizeQuantityGridProps {
  sizes?: string[];
  onQuantityChange: (sizeQuantities: Record<string, number>) => void;
  className?: string;
}

interface SizeQuantity {
  size: string;
  quantity: number;
}

const SizeQuantityGrid = ({
  sizes = ["Size 7", "Size 8", "Size 9", "Size 10"],
  onQuantityChange,
  className = "",
}: SizeQuantityGridProps): JSX.Element => {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    sizes.reduce((acc, size) => ({ ...acc, [size]: 0 }), {})
  );

  const handleQuantityChange = (size: string, quantity: number) => {
    const validQuantity = Math.max(0, quantity || 0);
    const newQuantities = { ...quantities, [size]: validQuantity };
    setQuantities(newQuantities);
    onQuantityChange(newQuantities);
  };

  return (
    <div className={className}>
      <h3 className="text-base font-medium text-gray-900 mb-3">Size</h3>
      
      {/* Grid Layout */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-4 bg-gray-50">
          {sizes.map((size) => (
            <div key={`header-${size}`} className="px-4 py-3 text-center border-r border-gray-200 last:border-r-0">
              <span className="text-sm font-medium text-gray-700">{size}</span>
            </div>
          ))}
        </div>
        
        {/* Quantity Row */}
        <div className="grid grid-cols-4 bg-white">
          {sizes.map((size) => (
            <div key={`quantity-${size}`} className="p-2 border-r border-gray-200 last:border-r-0">
              <Input
                type="number"
                min="0"
                value={quantities[size] || ""}
                onChange={(e) => handleQuantityChange(size, parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full text-center border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-gray-400 focus:ring-0"
                aria-label={`Quantity for ${size}`}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Summary */}
      {Object.values(quantities).some(qty => qty > 0) && (
        <div className="mt-3 text-sm text-gray-600">
          Total items: {Object.values(quantities).reduce((sum, qty) => sum + qty, 0)}
        </div>
      )}
    </div>
  );
};

export default SizeQuantityGrid;