"use client";
import React, { useState, useRef, useCallback } from "react";
import { ShopperProduct, useStore } from "../../../react-shopper-hooks";
import { ShopperCatalogResourcePage } from "@elasticpath/js-sdk";
import { searchClient } from "../../../lib/search-client";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import { algoliaEnvData } from "../../../lib/resolve-algolia-env";
import SearchResultsAlgolia from "../../../components/search/SearchResultsAlgolia";
import SearchResultsElasticPath from "../../../components/search/SearchResultsElasticPath";
import { DraggableCanvas } from "../../../components/canvas/DraggableCanvas";
import { SearchSidebar } from "../../../components/canvas/SearchSidebar";

export interface CanvasImage {
  id: string;
  src: string;
  alt: string;
  x: number;
  y: number;
  width: number;
  height: number;
  productId: string;
  productName: string;
}

export function SearchCanvas({
  page,
}: {
  page?: ShopperCatalogResourcePage<ShopperProduct>;
}) {
  const [canvasImages, setCanvasImages] = useState<CanvasImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);

  const handleImageDrop = useCallback((product: ShopperProduct, x: number, y: number) => {
    const imageUrl = product.main_image?.link?.href;
    if (!imageUrl) return;

    const newImage: CanvasImage = {
      id: `canvas-${product.response.id}-${Date.now()}`,
      src: imageUrl,
      alt: product.response.attributes.name,
      x,
      y,
      width: 150, // Default width
      height: 150, // Default height
      productId: product.response.id,
      productName: product.response.attributes.name,
    };

    setCanvasImages(prev => [...prev, newImage]);
  }, []);

  const handleImageUpdate = useCallback((id: string, updates: Partial<CanvasImage>) => {
    setCanvasImages(prev => 
      prev.map(img => img.id === id ? { ...img, ...updates } : img)
    );
  }, []);

  const handleImageDelete = useCallback((id: string) => {
    setCanvasImages(prev => prev.filter(img => img.id !== id));
    if (selectedImageId === id) {
      setSelectedImageId(null);
    }
  }, [selectedImageId]);

  const clearCanvas = useCallback(() => {
    setCanvasImages([]);
    setSelectedImageId(null);
  }, []);

  const snapToGrid = useCallback(() => {
    const GRID_SIZE = 50; // Snap to 50px grid
    
    setIsSnapping(true);
    
    const snappedImages = canvasImages.map(image => ({
      ...image,
      x: Math.round(image.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(image.y / GRID_SIZE) * GRID_SIZE,
    }));
    
    setCanvasImages(snappedImages);
    
    // Reset snapping state after animation
    setTimeout(() => setIsSnapping(false), 300);
  }, [canvasImages]);

  const exportCanvas = useCallback(() => {
    const canvasData = {
      images: canvasImages,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(canvasData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canvas-layout-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [canvasImages]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Search Sidebar */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'w-12' : 'w-96'} 
                     bg-white border-r border-gray-200 flex-shrink-0`}>
        <SearchSidebar 
          page={page}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Canvas Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">Canvas Layout</h1>
            <span className="text-sm text-gray-500">
              {canvasImages.length} item{canvasImages.length !== 1 ? 's' : ''} on canvas
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={snapToGrid}
              disabled={canvasImages.length === 0 || isSnapping}
              className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSnapping ? 'Snapping...' : 'Snap to Grid'}
            </button>
            <button
              onClick={clearCanvas}
              disabled={canvasImages.length === 0}
              className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Canvas
            </button>
            <button
              onClick={exportCanvas}
              disabled={canvasImages.length === 0}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export Layout
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <DraggableCanvas
            images={canvasImages}
            selectedImageId={selectedImageId}
            onImageSelect={setSelectedImageId}
            onImageUpdate={handleImageUpdate}
            onImageDelete={handleImageDelete}
            onImageDrop={handleImageDrop}
            isSnapping={isSnapping}
          />
        </div>

        {/* Image Properties Panel */}
        {selectedImageId && (
          <div className="bg-white border-t border-gray-200 p-4">
            <ImagePropertiesPanel
              image={canvasImages.find(img => img.id === selectedImageId)}
              onUpdate={(updates) => handleImageUpdate(selectedImageId, updates)}
              onDelete={() => handleImageDelete(selectedImageId)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface ImagePropertiesPanelProps {
  image?: CanvasImage;
  onUpdate: (updates: Partial<CanvasImage>) => void;
  onDelete: () => void;
}

function ImagePropertiesPanel({ image, onUpdate, onDelete }: ImagePropertiesPanelProps) {
  if (!image) return null;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Product:</span>
          <span className="text-sm text-gray-900">{image.productName}</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">X:</label>
            <input
              type="number"
              value={Math.round(image.x)}
              onChange={(e) => onUpdate({ x: parseInt(e.target.value) || 0 })}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Y:</label>
            <input
              type="number"
              value={Math.round(image.y)}
              onChange={(e) => onUpdate({ y: parseInt(e.target.value) || 0 })}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Width:</label>
            <input
              type="number"
              value={Math.round(image.width)}
              onChange={(e) => onUpdate({ width: parseInt(e.target.value) || 50 })}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
              min="50"
              max="500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Height:</label>
            <input
              type="number"
              value={Math.round(image.height)}
              onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 50 })}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
              min="50"
              max="500"
            />
          </div>
        </div>
      </div>
      
      <button
        onClick={onDelete}
        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
      >
        Remove
      </button>
    </div>
  );
}