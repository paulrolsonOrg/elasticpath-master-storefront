"use client";

import React, { useState, useEffect } from "react";
import { Input } from "../../input/Input";
import { useVariationProduct } from "../../../react-shopper-hooks";
import type { CatalogsProductVariation } from "@elasticpath/js-sdk";

interface VariationOption {
  id: string;
  description: string;
  name: string;
}

interface VariationQuantity {
  variationId: string;
  optionId: string;
  optionName: string;
  quantity: number;
}

interface VariationQuantityGridProps {
  onQuantitiesChange: (quantities: VariationQuantity[]) => void;
  className?: string;
}

const VariationQuantityGrid = ({
  onQuantitiesChange,
  className = "",
}: VariationQuantityGridProps): JSX.Element => {
  const { variations, variationsMatrix } = useVariationProduct();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Find the variation that represents sizes (usually the first one or one that contains size-related terms)
  const sizeVariation = variations.find((v: CatalogsProductVariation) => 
    v.name.toLowerCase().includes('size') || 
    v.name.toLowerCase().includes('dimension') ||
    variations.length === 1 // If there's only one variation, assume it's size
  ) || variations[0]; // Fallback to first variation

  // Get all possible combinations (child products) from the variations matrix
  const getAllCombinations = () => {
    if (!variationsMatrix || !sizeVariation) return [];
    
    const combinations: Array<{
      optionId: string;
      optionName: string;
      productId: string;
    }> = [];

    // For single variation (size only)
    if (variations.length === 1) {
      sizeVariation.options.forEach((option: VariationOption) => {
        const productId = variationsMatrix[option.id];
        if (productId && typeof productId === 'string') {
          combinations.push({
            optionId: option.id,
            optionName: option.description,
            productId,
          });
        }
      });
    } else {
      // For multiple variations, we need to get all combinations
      // This is more complex and would require iterating through all possible combinations
      // For now, let's focus on the size variation
      sizeVariation.options.forEach((option: VariationOption) => {
        combinations.push({
          optionId: option.id,
          optionName: option.description,
          productId: `${sizeVariation.id}_${option.id}`, // Temporary ID for multi-variation
        });
      });
    }

    return combinations;
  };

  const combinations = getAllCombinations();

  const handleQuantityChange = (optionId: string, quantity: number) => {
    const validQuantity = Math.max(0, quantity || 0);
    const newQuantities = { ...quantities, [optionId]: validQuantity };
    setQuantities(newQuantities);

    // Convert to the format expected by parent component
    const variationQuantities: VariationQuantity[] = combinations
      .filter(combo => newQuantities[combo.optionId] > 0)
      .map(combo => ({
        variationId: sizeVariation.id,
        optionId: combo.optionId,
        optionName: combo.optionName,
        quantity: newQuantities[combo.optionId],
      }));

    
    onQuantitiesChange(variationQuantities);
  };

  if (!sizeVariation || combinations.length === 0) {
    return (
      <div className={className}>
        <p className="text-gray-500">No variations available for grid display.</p>
      </div>
    );
  }

  // Determine grid columns based on number of options
  const gridCols = Math.min(combinations.length, 6); // Max 6 columns
  const gridColsClass = {
    1: "grid-cols-1",
    2: "grid-cols-2", 
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  }[gridCols] || "grid-cols-4";

  return (
    <div className={className}>
      <h3 className="text-base font-medium text-gray-900 mb-3">{sizeVariation.name}</h3>
      
      {/* Grid Layout */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Header Row */}
        <div className={`grid ${gridColsClass} bg-gray-50`}>
          {combinations.map((combo) => (
            <div key={`header-${combo.optionId}`} className="px-4 py-3 text-center border-r border-gray-200 last:border-r-0">
              <span className="text-sm font-medium text-gray-700">{combo.optionName}</span>
            </div>
          ))}
        </div>
        
        {/* Quantity Row */}
        <div className={`grid ${gridColsClass} bg-white`}>
          {combinations.map((combo) => (
            <div key={`quantity-${combo.optionId}`} className="p-2 border-r border-gray-200 last:border-r-0">
              <Input
                type="number"
                min="0"
                value={quantities[combo.optionId] || ""}
                onChange={(e) => handleQuantityChange(combo.optionId, parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full text-center border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-gray-400 focus:ring-0"
                aria-label={`Quantity for ${combo.optionName}`}
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

export default VariationQuantityGrid;