"use client";

import React, { useState, useEffect } from "react";
import { Input } from "../../input/Input";
import { useVariationProduct } from "../../../react-shopper-hooks";
import type { CatalogsProductVariation } from "@elasticpath/js-sdk";
import { getSkuIdFromOptions } from "../../../lib/product-helper";

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
  optionCombination?: string[]; // For multiple variations, store the option combination
}

interface VariationQuantityGridProps {
  onQuantitiesChange: (quantities: VariationQuantity[]) => void;
  className?: string;
}

interface ProductCombination {
  options: string[];
  optionLabels: string[];
  productId?: string;
  key: string;
}

const VariationQuantityGrid = ({
  onQuantitiesChange,
  className = "",
}: VariationQuantityGridProps): JSX.Element => {
  const { variations, variationsMatrix } = useVariationProduct();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Identify variation types
  const getVariationTypes = () => {
    const sizeVariation = variations.find((v: CatalogsProductVariation) => 
      v.name.toLowerCase().includes('size') || 
      v.name.toLowerCase().includes('dimension')
    );
    
    const colorVariation = variations.find((v: CatalogsProductVariation) => 
      v.name.toLowerCase().includes('color') || 
      v.name.toLowerCase().includes('colour')
    );
    
    return { sizeVariation, colorVariation };
  };

  const { sizeVariation, colorVariation } = getVariationTypes();

  // Get all possible combinations
  const getAllCombinations = (): ProductCombination[] => {
    if (!variationsMatrix) return [];
    
    if (variations.length === 1) {
      // Single variation (size or color only)
      const variation = variations[0];
      return variation.options.map((option: VariationOption) => {
        const productId = variationsMatrix[option.id];
        return {
          options: [option.id],
          optionLabels: [option.description],
          productId: typeof productId === 'string' ? productId : undefined,
          key: option.id,
        };
      });
    } else if (variations.length === 2 && sizeVariation && colorVariation) {
      // Two variations (color and size)
      const combinations: ProductCombination[] = [];
      
      colorVariation.options.forEach((colorOption: VariationOption) => {
        sizeVariation.options.forEach((sizeOption: VariationOption) => {
          const optionIds = [colorOption.id, sizeOption.id];
          const productId = getSkuIdFromOptions(optionIds, variationsMatrix);
          
          combinations.push({
            options: optionIds,
            optionLabels: [colorOption.description, sizeOption.description],
            productId,
            key: `${colorOption.id}_${sizeOption.id}`,
          });
        });
      });
      
      return combinations;
    } else {
      // Multiple variations - generate all combinations
      const generateCombinations = (variationIndex: number, currentCombination: string[]): ProductCombination[] => {
        if (variationIndex >= variations.length) {
          const productId = getSkuIdFromOptions(currentCombination, variationsMatrix);
          const labels = currentCombination.map((optionId, index) => {
            const variation = variations[index];
            const option = variation.options.find((o: VariationOption) => o.id === optionId);
            return option?.description || optionId;
          });
          
          return [{
            options: [...currentCombination],
            optionLabels: labels,
            productId,
            key: currentCombination.join('_'),
          }];
        }
        
        const variation = variations[variationIndex];
        const combinations: ProductCombination[] = [];
        
        variation.options.forEach((option: VariationOption) => {
          const newCombination = [...currentCombination, option.id];
          combinations.push(...generateCombinations(variationIndex + 1, newCombination));
        });
        
        return combinations;
      };
      
      return generateCombinations(0, []);
    }
  };

  const combinations = getAllCombinations();

  const handleQuantityChange = (combinationKey: string, quantity: number) => {
    const validQuantity = Math.max(0, quantity || 0);
    const newQuantities = { ...quantities, [combinationKey]: validQuantity };
    setQuantities(newQuantities);

    // Convert to the format expected by parent component
    const variationQuantities: VariationQuantity[] = combinations
      .filter(combo => newQuantities[combo.key] > 0)
      .map(combo => ({
        variationId: variations[0]?.id || 'unknown', // Use first variation ID for compatibility
        optionId: combo.key,
        optionName: combo.optionLabels.join(' / '), // Join all option labels
        quantity: newQuantities[combo.key],
        optionCombination: combo.options, // Store the full option combination
      }));

    onQuantitiesChange(variationQuantities);
  };

  if (combinations.length === 0) {
    return (
      <div className={className}>
        <p className="text-gray-500">No variations available for grid display.</p>
      </div>
    );
  }

  // Render based on variation type
  const renderSingleVariationGrid = () => {
    const variation = variations[0];
    const gridCols = Math.min(combinations.length, 6);
    const gridColsClass = {
      1: "grid-cols-1",
      2: "grid-cols-2", 
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
    }[gridCols] || "grid-cols-4";

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2">
          <h3 className="text-base font-medium text-gray-900">{variation.name}</h3>
        </div>
        {/* Header Row */}
        <div className={`grid ${gridColsClass} bg-gray-50 border-t border-gray-200`}>
          {combinations.map((combo) => (
            <div key={`header-${combo.key}`} className="px-4 py-3 text-center border-r border-gray-200 last:border-r-0">
              <span className="text-sm font-medium text-gray-700">{combo.optionLabels[0]}</span>
            </div>
          ))}
        </div>
        
        {/* Quantity Row */}
        <div className={`grid ${gridColsClass} bg-white`}>
          {combinations.map((combo) => (
            <div key={`quantity-${combo.key}`} className="p-2 border-r border-gray-200 last:border-r-0">
              <Input
                type="number"
                min="0"
                value={quantities[combo.key] || ""}
                onChange={(e) => handleQuantityChange(combo.key, parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full text-center border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-gray-400 focus:ring-0"
                aria-label={`Quantity for ${combo.optionLabels[0]}`}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTwoVariationGrid = () => {
    if (!sizeVariation || !colorVariation) return null;

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2">
          <h3 className="text-base font-medium text-gray-900">{colorVariation.name} × {sizeVariation.name}</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header Row with Size columns */}
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r border-gray-200">
                  {colorVariation.name}
                </th>
                {sizeVariation.options.map((sizeOption: VariationOption) => (
                  <th key={`size-header-${sizeOption.id}`} className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
                    {sizeOption.description}
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* Color Rows */}
            <tbody className="bg-white">
              {colorVariation.options.map((colorOption: VariationOption) => (
                <tr key={`color-row-${colorOption.id}`} className="border-b border-gray-200 last:border-b-0">
                  <td className="px-4 py-3 text-sm font-medium text-gray-700 border-r border-gray-200 bg-gray-50">
                    {colorOption.description}
                  </td>
                  {sizeVariation.options.map((sizeOption: VariationOption) => {
                    const combo = combinations.find(c => 
                      c.options.includes(colorOption.id) && c.options.includes(sizeOption.id)
                    );
                    return (
                      <td key={`cell-${colorOption.id}-${sizeOption.id}`} className="p-2 border-r border-gray-200 last:border-r-0">
                        <Input
                          type="number"
                          min="0"
                          value={combo ? (quantities[combo.key] || "") : ""}
                          onChange={(e) => combo && handleQuantityChange(combo.key, parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full text-center border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-gray-400 focus:ring-0"
                          aria-label={`Quantity for ${colorOption.description} ${sizeOption.description}`}
                          disabled={!combo?.productId}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderMultiVariationGrid = () => {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2">
          <h3 className="text-base font-medium text-gray-900">
            {variations.map(v => v.name).join(' × ')}
          </h3>
        </div>
        
        <div className="p-4 bg-white max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {combinations.map((combo) => (
              <div key={`multi-${combo.key}`} className="flex items-center justify-between py-2 px-3 border border-gray-200 rounded-md">
                <span className="text-sm text-gray-700 flex-1">
                  {combo.optionLabels.join(' / ')}
                </span>
                <div className="w-20">
                  <Input
                    type="number"
                    min="0"
                    value={quantities[combo.key] || ""}
                    onChange={(e) => handleQuantityChange(combo.key, parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="text-center border-gray-300 rounded-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-gray-400 focus:ring-0"
                    aria-label={`Quantity for ${combo.optionLabels.join(' ')}`}
                    disabled={!combo.productId}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {variations.length === 1 && renderSingleVariationGrid()}
      {variations.length === 2 && sizeVariation && colorVariation && renderTwoVariationGrid()}
      {variations.length > 2 && renderMultiVariationGrid()}
      
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