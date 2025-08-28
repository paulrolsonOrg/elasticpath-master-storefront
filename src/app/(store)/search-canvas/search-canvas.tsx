"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { ShopperProduct, useStore, useAuthedAccountMember } from "../../../react-shopper-hooks";
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
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);

  // Get the authenticated account member if available
  const accountMember = useAuthedAccountMember();

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

  const saveCanvas = useCallback(async () => {
    if (canvasImages.length === 0) return;
    
    setIsSaving(true);
    
    try {
      // Prepare canvas data
      const canvasData = {
        images: canvasImages,
        timestamp: new Date().toISOString(),
        entryId: savedEntryId,
      };
      
      // Prepare request body with account_member_id if user is logged in
      const requestBody: any = {
        json: JSON.stringify(canvasData),
      };
      
      // Add account_member_id if user is authenticated
      if (accountMember.data?.id) {
        requestBody.account_member_id = accountMember.data.id;
      }
      
      // Add entry_id if this is an update to an existing saved canvas
      if (savedEntryId) {
        requestBody.entry_id = savedEntryId;
      }
      
      // Save to commerce extension
      const response = await fetch('/api/canvas-layouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save canvas: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Store the entry ID from the response for future updates
      if (result.entryId || result.data?.id) {
        setSavedEntryId(result.entryId || result.data.id);
      }
      
      // Show success feedback
      import('react-toastify').then(({ toast }) => {
        toast.success('Canvas saved successfully!', {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
        });
      });
      
    } catch (error) {
      console.error('Error saving canvas:', error);
      
      // Show error feedback
      import('react-toastify').then(({ toast }) => {
        toast.error(`Failed to save canvas: ${error instanceof Error ? error.message : 'Unknown error'}`, {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
        });
      });
    } finally {
      setIsSaving(false);
    }
  }, [canvasImages, savedEntryId, accountMember.data?.id]);

  const loadUserCanvas = useCallback(async () => {
    if (!accountMember.data?.id || canvasImages.length > 0) return; // Don't load if user not authenticated or canvas already has content
    
    setIsLoading(true);
    
    try {
      // Get all canvas layouts
      const response = await fetch('/api/canvas-layouts');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch canvas layouts: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        // Find the first canvas that belongs to the current user
        const userCanvas = result.data.find((canvas: any) => 
          canvas.account_member_id === accountMember.data?.id
        );
        
        if (userCanvas) {
          console.log('Loading user canvas:', userCanvas.id);
          
          // Parse the canvas data
          const canvasData = JSON.parse(userCanvas.json);
          
          // Load the canvas
          setCanvasImages(canvasData.images || []);
          setSavedEntryId(userCanvas.id);
          
          // Show success feedback
          import('react-toastify').then(({ toast }) => {
            toast.info('Previous canvas loaded successfully!', {
              position: "top-center",
              autoClose: 2000,
              hideProgressBar: false,
            });
          });
        }
      }
    } catch (error) {
      console.error('Error loading user canvas:', error);
      // Don't show error toast for loading failures, just log them
    } finally {
      setIsLoading(false);
    }
  }, [accountMember.data?.id, canvasImages.length]);

  // Load user's canvas when they first visit the page
  useEffect(() => {
    if (accountMember.data?.id && !isLoading) {
      loadUserCanvas();
    }
  }, [accountMember.data?.id, loadUserCanvas, isLoading]);

  const exportCanvas = useCallback(() => {
    const canvasData = {
      images: canvasImages,
      timestamp: new Date().toISOString(),
      entryId: savedEntryId || `export-${Date.now()}`,
    };
    
    const blob = new Blob([JSON.stringify(canvasData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canvas-layout-${canvasData.entryId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [canvasImages, savedEntryId]);

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
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">
                {canvasImages.length} item{canvasImages.length !== 1 ? 's' : ''} on canvas
              </span>
              {savedEntryId && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-700 font-medium">Saved</span>
                  <span className="text-xs text-gray-400 font-mono">{savedEntryId}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isLoading && (
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading canvas...</span>
              </div>
            )}
            <button
              onClick={snapToGrid}
              disabled={canvasImages.length === 0 || isSnapping}
              className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSnapping ? 'Snapping...' : 'Snap to Grid'}
            </button>
            <button
              onClick={saveCanvas}
              disabled={canvasImages.length === 0 || isSaving}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSaving ? 'Saving...' : savedEntryId ? 'Update' : 'Save'}
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