"use client";
import React, { useRef, useCallback, useState, useEffect } from "react";
import { ShopperProduct } from "../../react-shopper-hooks";
import { CanvasImage } from "../../app/(store)/search-canvas/search-canvas";

interface DraggableCanvasProps {
  images: CanvasImage[];
  selectedImageId: string | null;
  onImageSelect: (id: string | null) => void;
  onImageUpdate: (id: string, updates: Partial<CanvasImage>) => void;
  onImageDelete: (id: string) => void;
  onImageDrop: (product: ShopperProduct, x: number, y: number) => void;
}

interface DragState {
  isDragging: boolean;
  imageId: string | null;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
}

export function DraggableCanvas({
  images,
  selectedImageId,
  onImageSelect,
  onImageUpdate,
  onImageDelete,
  onImageDrop,
}: DraggableCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    imageId: null,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  // Handle drop from search sidebar
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const productData = e.dataTransfer.getData("application/json");
      if (!productData) return;
      
      const product: ShopperProduct = JSON.parse(productData);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Use the onImageDrop callback to add the image
      onImageDrop(product, Math.max(0, x - 75), Math.max(0, y - 75));
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  }, [onImageDrop]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  // Handle image dragging within canvas
  const handleImageMouseDown = useCallback((e: React.MouseEvent, imageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const image = images.find(img => img.id === imageId);
    if (!image) return;
    
    onImageSelect(imageId);
    
    setDragState({
      isDragging: true,
      imageId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: image.x,
      initialY: image.y,
    });
  }, [images, onImageSelect]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.imageId) return;
    
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    
    const newX = Math.max(0, dragState.initialX + deltaX);
    const newY = Math.max(0, dragState.initialY + deltaY);
    
    onImageUpdate(dragState.imageId, { x: newX, y: newY });
  }, [dragState, onImageUpdate]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      imageId: null,
      startX: 0,
      startY: 0,
      initialX: 0,
      initialY: 0,
    });
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking on the canvas background
    if (e.target === canvasRef.current) {
      onImageSelect(null);
    }
  }, [onImageSelect]);

  const handleImageKeyDown = useCallback((e: React.KeyboardEvent, imageId: string) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onImageDelete(imageId);
    }
  }, [onImageDelete]);

  // Add global mouse event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
    return undefined;
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full bg-white overflow-hidden cursor-default"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleCanvasClick}
      style={{
        backgroundImage: `
          linear-gradient(to right, #f3f4f6 1px, transparent 1px),
          linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
      }}
    >
      {/* Drop Zone Indicator */}
      {images.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Canvas is empty</h3>
            <p className="text-gray-600">Drag product images from the sidebar to create your layout</p>
          </div>
        </div>
      )}

      {/* Canvas Images */}
      {images.map((image) => (
        <CanvasImageItem
          key={image.id}
          image={image}
          isSelected={selectedImageId === image.id}
          isDragging={dragState.isDragging && dragState.imageId === image.id}
          onMouseDown={(e) => handleImageMouseDown(e, image.id)}
          onKeyDown={(e) => handleImageKeyDown(e, image.id)}
          onResize={(width, height) => onImageUpdate(image.id, { width, height })}
        />
      ))}
    </div>
  );
}

interface CanvasImageItemProps {
  image: CanvasImage;
  isSelected: boolean;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onResize: (width: number, height: number) => void;
}

function CanvasImageItem({
  image,
  isSelected,
  isDragging,
  onMouseDown,
  onKeyDown,
  onResize,
}: CanvasImageItemProps) {
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startWidth: number; startHeight: number; startX: number; startY: number } | null>(null);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    resizeRef.current = {
      startWidth: image.width,
      startHeight: image.height,
      startX: e.clientX,
      startY: e.clientY,
    };
  }, [image.width, image.height]);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeRef.current) return;
    
    const deltaX = e.clientX - resizeRef.current.startX;
    const deltaY = e.clientY - resizeRef.current.startY;
    
    const newWidth = Math.max(50, resizeRef.current.startWidth + deltaX);
    const newHeight = Math.max(50, resizeRef.current.startHeight + deltaY);
    
    onResize(newWidth, newHeight);
  }, [isResizing, onResize]);

  const handleResizeMouseUp = useCallback(() => {
    setIsResizing(false);
    resizeRef.current = null;
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMouseMove);
        document.removeEventListener('mouseup', handleResizeMouseUp);
      };
    }
    return undefined;
  }, [isResizing, handleResizeMouseMove, handleResizeMouseUp]);

  return (
    <div
      className={`absolute cursor-move select-none ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${isDragging ? 'opacity-75' : ''}`}
      style={{
        left: image.x,
        top: image.y,
        width: image.width,
        height: image.height,
      }}
      onMouseDown={onMouseDown}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <img
        src={image.src}
        alt={image.alt}
        className="w-full h-full object-cover rounded border border-gray-300 shadow-sm"
        draggable={false}
      />
      
      {/* Product Name Label */}
      <div className="absolute -bottom-6 left-0 right-0 text-xs text-center text-gray-600 bg-white px-1 rounded border truncate">
        {image.productName}
      </div>
      
      {/* Resize Handle */}
      {isSelected && (
        <div
          className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize shadow-sm"
          onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  );
}