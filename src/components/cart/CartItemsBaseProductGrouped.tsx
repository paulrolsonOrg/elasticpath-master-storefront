"use client";
import { CartItem as CartItemType } from "@elasticpath/js-sdk";
import { Fragment, useState } from "react";
import { Separator } from "../separator/Separator";
import { groupCartItemsByBaseProduct, getBaseProductGroupSummary, BaseProductGroup } from "../../lib/cart-grouping-utils";
import { ProductThumbnail } from "../../app/(store)/account/orders/[orderId]/ProductThumbnail";
import { NumberInput } from "../number-input/NumberInput";
import { useCart } from "../../react-shopper-hooks";
import { LoadingDots } from "../LoadingDots";
import { TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";

export interface CartItemsBaseProductGroupedProps {
  items: readonly CartItemType[];
  isFullCart: boolean;
  adminDisplay?: boolean;
  enableCustomDiscount?: boolean;
  selectedAccount?: string;
  itemCustomDiscount?: any;
  cartId?: any;
}

export function CartItemsBaseProductGrouped({
  items,
  adminDisplay,
}: CartItemsBaseProductGroupedProps) {
  const groupedItems = groupCartItemsByBaseProduct(items);
  const { useScopedRemoveCartItem } = useCart();
  const { mutate: removeItem, isPending: isRemoving } = useScopedRemoveCartItem();
  
  // Check if click and collect is enabled
  const enableClickAndCollect = process.env.NEXT_PUBLIC_ENABLE_CLICK_AND_COLLECT === "true";

  const renderVariantThumbnail = (item: CartItemType) => {
    return (
      <div key={item.id} className="flex flex-col items-center p-2 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow min-w-[200px] max-w-xs mx-auto w-full">
        {/* Product Thumbnail */}
        <div className="w-24 h-24 flex-shrink-0 mb-3">
          {item.product_id && <ProductThumbnail productId={item.product_id} />}
          {item.custom_inputs?.image_url && (
            <Image
              src={item.custom_inputs.image_url}
              width={96}
              height={96}
              alt={item.name}
              className="w-24 h-24 object-cover rounded"
            />
          )}
        </div>
        
        {/* Variation Details */}
        <div className="text-center mb-2 w-full px-1">
          {item.custom_inputs?.options && (
            <div className="text-base text-gray-800 font-semibold break-words">
              {Array.isArray(item.custom_inputs.options) 
                ? item.custom_inputs.options.join(' / ')
                : item.custom_inputs.options}
            </div>
          )}
          {item.sku && (
            <div className="text-xs text-gray-500 mt-1 break-all">
              {item.sku}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="text-center mb-3 w-full">
          <div className="text-lg font-bold text-gray-900">
            {item.meta.display_price.with_tax.value.formatted}
          </div>
          {item.meta.display_price.without_discount?.value.amount &&
            item.meta.display_price.without_discount?.value.amount !== 
            item.meta.display_price.with_tax.value.amount && (
              <div className="text-sm text-gray-400 line-through">
                {item.meta.display_price.without_discount?.value.formatted}
              </div>
            )}
        </div>

        {/* Quantity Controls */}
        <div className="w-full mb-3">
          <NumberInput item={item} />
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={() => removeItem({ itemId: item.id })}
          disabled={isRemoving}
          className="text-red-600 hover:text-red-800 disabled:opacity-50 text-sm flex items-center gap-2 justify-center w-full py-2"
        >
          {isRemoving ? (
            <LoadingDots className="bg-red-600" />
          ) : (
            <>
              <TrashIcon className="h-4 w-4" />
              Remove
            </>
          )}
        </button>
      </div>
    );
  };

  const renderBaseProductGroup = (
    group: BaseProductGroup,
    groupKey: string,
    showGroupHeader: boolean = true
  ) => {
    const summary = getBaseProductGroupSummary(group);

    return (
      <div key={groupKey} className="mb-6">
        {/* Group Header */}
        {showGroupHeader && (
          <div className="mb-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900 text-lg">
                  {group.items.length === 1 && group.items[0].product_id && !adminDisplay ? (
                    <Link href={`/products/${group.items[0].slug}`} className="hover:text-blue-600">
                      {group.baseProductName}
                    </Link>
                  ) : (
                    group.baseProductName
                  )}
                </h4>
                {group.items.length > 1 && (
                  <p className="text-sm text-gray-600 mt-1">{summary}</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Variants Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {group.items.map((item) => renderVariantThumbnail(item))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Home Delivery Section (or just "Cart Items" if click & collect disabled) */}
      {groupedItems.homeDelivery.length > 0 && (
        <div className={enableClickAndCollect ? "border-2 rounded-md border-brand-primary/80 mb-4" : ""}>
          {enableClickAndCollect && (
            <h2 className="text-xl p-4 font-semibold mb-4 bg-brand-primary/80 text-white">
              Home Delivery
            </h2>
          )}
          <div className={enableClickAndCollect ? "p-4" : ""}>
            {groupedItems.homeDelivery.map((group) =>
              renderBaseProductGroup(
                group,
                `home-${group.baseProductId}`,
                groupedItems.homeDelivery.length > 1 || group.items.length > 1
              )
            )}
          </div>
        </div>
      )}

      {/* Click & Collect Sections - only show if enabled */}
      {enableClickAndCollect && Object.entries(groupedItems.clickAndCollect).length > 0 && (
        <div className="border-2 rounded-md border-brand-primary/80">
          <h2 className="text-xl font-semibold mb-4 p-4 bg-brand-primary/80 text-white">
            Click & Collect
          </h2>
          {Object.entries(groupedItems.clickAndCollect).map(([locationName, locationGroups]) => (
            <div key={locationName} className="border-b border-gray-200 last:border-b-0">
              <h3 className="text-lg font-medium p-4 bg-gray-50 border-b border-gray-100">
                Collect from {locationName}
              </h3>
              <div className="p-4">
                {locationGroups.map((group) =>
                  renderBaseProductGroup(
                    group,
                    `collect-${locationName}-${group.baseProductId}`,
                    locationGroups.length > 1 || group.items.length > 1
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}