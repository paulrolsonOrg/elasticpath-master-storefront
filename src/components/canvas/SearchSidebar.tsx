"use client";
import React, { useState } from "react";
import { ShopperProduct, useStore } from "../../react-shopper-hooks";
import { ShopperCatalogResourcePage } from "@elasticpath/js-sdk";
import { searchClient } from "../../lib/search-client";
import { InstantSearchNext } from "react-instantsearch-nextjs";
import { algoliaEnvData } from "../../lib/resolve-algolia-env";
import { 
  Configure,
  SearchBox,
  Hits,
  Pagination,
  RefinementList,
  HierarchicalMenu,
} from "react-instantsearch";
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import SearchResultsElasticPath from "../search/SearchResultsElasticPath";

interface SearchSidebarProps {
  page?: ShopperCatalogResourcePage<ShopperProduct>;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function SearchSidebar({ page, collapsed, onToggleCollapse }: SearchSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  if (collapsed) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-3 border-b border-gray-200">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="transform -rotate-90 text-sm text-gray-500 whitespace-nowrap">
            Search Products
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Search Products</h2>
          <button
            onClick={onToggleCollapse}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="text-sm text-gray-600">
          Drag product images to the canvas to create your layout
        </div>
      </div>

      {/* Search Content */}
      <div className="flex-1 overflow-hidden">
        {algoliaEnvData.enabled ? (
          <AlgoliaSearch />
        ) : (
          <ElasticPathSearch page={page} />
        )}
      </div>
    </div>
  );
}

function AlgoliaSearch() {
  return (
    <InstantSearchNext
      searchClient={searchClient}
      indexName={algoliaEnvData.indexName}
      insights={false}
    >
      <Configure hitsPerPage={20} />
      
      <div className="p-4 border-b border-gray-200">
        <SearchBox
          placeholder="Search products..."
          classNames={{
            form: "relative",
            input: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            submit: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400",
            reset: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400",
          }}
        />
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <Hits
            hitComponent={({ hit }) => (
              <DraggableProductCard 
                product={hit as any} 
                isAlgolia={true}
              />
            )}
            classNames={{
              list: "space-y-3",
            }}
          />
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <Pagination
            classNames={{
              list: "flex justify-center space-x-1",
              item: "px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50",
              selectedItem: "bg-blue-600 text-white border-blue-600",
            }}
          />
        </div>
      </div>
    </InstantSearchNext>
  );
}

function ElasticPathSearch({ 
  page
}: { 
  page?: ShopperCatalogResourcePage<ShopperProduct>; 
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = page?.data.filter(product =>
    searchQuery === "" || 
    product.response.attributes.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {filteredProducts.map((product) => (
            <DraggableProductCard
              key={product.response.id}
              product={product}
              isAlgolia={false}
            />
          ))}
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No products found' : 'No products available'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface DraggableProductCardProps {
  product: ShopperProduct | any;
  isAlgolia: boolean;
}

function DraggableProductCard({ product, isAlgolia }: DraggableProductCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Normalize product data for both Algolia and ElasticPath
  const normalizedProduct: ShopperProduct = isAlgolia ? {
    kind: "simple-product",
    response: {
      id: product.objectID,
      type: "product",
      attributes: {
        name: product.name,
        sku: product.sku || '',
        slug: product.slug || '',
        description: product.description || '',
        status: product.status || 'live',
        commodity_type: product.commodity_type || 'physical',
        meta: product.meta || {},
        created_at: product.created_at || '',
        updated_at: product.updated_at || '',
      },
      meta: product.meta || {},
      relationships: product.relationships || {},
    },
    main_image: product.main_image ? {
      type: "file",
      id: product.main_image.id || '',
      link: { href: product.main_image.url },
    } : null,
    otherImages: [],
  } : product;

  const imageUrl = isAlgolia 
    ? product.main_image?.url 
    : product.main_image?.link?.href;

  const productName = isAlgolia 
    ? product.name 
    : product.response.attributes.name;

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData("application/json", JSON.stringify(normalizedProduct));
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg cursor-grab 
                 hover:shadow-md transition-all duration-200 ${isDragging ? 'opacity-50' : ''}`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={productName}
          className="w-12 h-12 object-cover rounded flex-shrink-0"
          draggable={false}
        />
      ) : (
        <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
          <span className="text-xs text-gray-500">No Image</span>
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">{productName}</h4>
        {isAlgolia && product.price && (
          <p className="text-sm text-gray-600">${product.price}</p>
        )}
      </div>
    </div>
  );
}