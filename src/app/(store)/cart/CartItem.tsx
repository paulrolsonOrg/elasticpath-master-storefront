"use client";
import { CustomDiscountCartItem, useCart } from "../../../react-shopper-hooks";
import { ProductThumbnail } from "../account/orders/[orderId]/ProductThumbnail";
import { NumberInput } from "../../../components/number-input/NumberInput";
import Link from "next/link";
import { CartItem as CartItemType } from "@elasticpath/js-sdk";
import { LoadingDots } from "../../../components/LoadingDots";
import { CartAdditionalData } from "../../../components/cart/CartAdditionalData";
import { CartComponentData } from "../../../components/cart/CartComponentData";
import { CartItemPromotions } from "../../../components/cart/CartItemPromotions";
import Image from "next/image";
import AddItemCustomDiscount from "../../(admin)/admin/quotes/new/AddItemCustomDiscount";
import { useState } from "react";
import { TextButton } from "../../../components/button/TextButton";
import { ChevronUpIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Disclosure } from "@headlessui/react";
import { deleteItemCustomDiscount } from "../../(admin)/admin/quotes/actions";

export type CartItemProps = {
  item: CartItemType;
  adminDisplay?: boolean;
  enableCustomDiscount?: boolean;
  selectedAccount?: string;
  itemCustomDiscount?: any;
  cartId?: any;
};

export function CartItem({
  item,
  adminDisplay,
  enableCustomDiscount,
  selectedAccount,
  itemCustomDiscount,
  cartId,
}: CartItemProps) {
  const { useScopedRemoveCartItem, useScopedUpdateCartItem } = useCart();
  const { mutate, isPending } = useScopedRemoveCartItem();
  const { mutate: mutateUpdate } = useScopedUpdateCartItem();
  const [openDiscount, setOpenDiscount] = useState(false);

  // Console log all available cart item information
  console.log('=== CART ITEM DEBUG INFO ===');
  console.log('Cart Item ID:', item.id);
  console.log('Full Item Object:', item);
  console.log('Item Name:', item.name);
  console.log('Item SKU:', item.sku);
  console.log('Product ID:', item.product_id);
  console.log('Slug:', item.slug);
  console.log('Quantity:', item.quantity);
  console.log('Item Type:', item.type);
  
  console.log('--- Custom Inputs ---');
  console.log('Custom Inputs Object:', item.custom_inputs);
  if (item.custom_inputs) {
    console.log('Custom Inputs Keys:', Object.keys(item.custom_inputs));
    console.log('Options:', item.custom_inputs.options);
    console.log('Additional Information:', item.custom_inputs.additional_information);
    console.log('Image URL:', item.custom_inputs.image_url);
    console.log('Location:', item.custom_inputs.location);
    console.log('Vendor Store ID:', item.custom_inputs.vendor_store_id);
  }
  
  console.log('--- Pricing ---');
  console.log('Meta Object:', item.meta);
  console.log('Display Price:', item.meta?.display_price);
  console.log('Unit Price (with tax):', item.meta?.display_price?.with_tax?.unit?.formatted);
  console.log('Total Price (with tax):', item.meta?.display_price?.with_tax?.value?.formatted);
  console.log('Without Discount Price:', item.meta?.display_price?.without_discount?.value?.formatted);
  
  console.log('--- Relationships ---');
  console.log('Relationships Object:', item.relationships);
  if (item.relationships) {
    console.log('Custom Discounts:', item.relationships.custom_discounts);
    console.log('Cart Item to Bundle Component Options:', item.relationships.cart_item_to_bundle_component_options);
    console.log('Cart Item Personal Pricing:', item.relationships.cart_item_personal_pricing);
  }
  
  console.log('--- Component Props ---');
  console.log('Admin Display:', adminDisplay);
  console.log('Enable Custom Discount:', enableCustomDiscount);
  console.log('Selected Account:', selectedAccount);
  console.log('Item Custom Discount:', itemCustomDiscount);
  console.log('Cart ID:', cartId);
  
  console.log('=== END CART ITEM DEBUG ===');
  console.log(''); // Empty line for separation

  const removeCustomDiscount = async (customDiscountId: string) => {
    await deleteItemCustomDiscount(cartId, item.id, customDiscountId);
    mutateUpdate({
      itemId: item.id,
      quantity: item.quantity,
    });
  };

  return (
    <div className="flex gap-5">
      <div className="flex w-16 sm:w-24 h-20 sm:h-[7.5rem] justify-center shrink-0 items-start">
        {item.product_id && <ProductThumbnail productId={item.product_id} />}

        {item.custom_inputs?.image_url && (
          <Image
            src={item.custom_inputs?.image_url}
            width="100"
            height="100"
            alt={item.name}
            className="overflow-hidden"
          />
        )}
      </div>
      <div className="flex flex-col gap-5 flex-1">
        <div className="flex gap-5 self-stretch">
          <div className="flex flex-col flex-1 gap-1">
            {item.product_id && !adminDisplay && (
              <Link href={`/products/${item.slug}`}>
                <span className="font-medium text-md">
                  {item.name}
                  {item?.custom_inputs?.options && (
                    <div className="mt-1 text-black/60 text-xs">
                      {item?.custom_inputs?.options}
                    </div>
                  )}
                  {item.sku && (
                    <div className="mt-1 text-black/60 text-sm font-normal">
                      SKU: {item.sku}
                    </div>
                  )}
                </span>
              </Link>
            )}
            {(!item.product_id || adminDisplay) && (
              <span className="font-medium text-md">
                {item.name}
                {item?.custom_inputs?.options && (
                  <div className="mt-1 text-black/60 text-xs">
                    {item?.custom_inputs?.options}
                  </div>
                )}
                {item.sku && (
                  <div className="mt-1 text-black/60 text-sm font-normal">
                    SKU: {item.sku}
                  </div>
                )}
              </span>
            )}
            <span className="text-sm text-black/60">
              Item Price: {item.meta.display_price.with_tax.unit.formatted}
            </span>
            <span className="text-sm text-black/60">
              Quantity: {item.quantity}
            </span>
            <CartItemPromotions item={item} />
          </div>
          <div className="flex h-7 gap-2 flex-col">
            <span className="font-medium">
              {item.meta.display_price.with_tax.value.formatted}
            </span>
            {item.meta.display_price.without_discount?.value.amount &&
              item.meta.display_price.without_discount?.value.amount !==
                item.meta.display_price.with_tax.value.amount && (
                <span className="text-black/60 text-sm line-through">
                  {item.meta.display_price.without_discount?.value.formatted}
                </span>
              )}
          </div>
        </div>
        {enableCustomDiscount && (
          <div className="flex w-full">
            <TextButton
              className="text-sm text-brand-primary"
              onClick={() => setOpenDiscount(true)}
            >
              Add Item Discount
            </TextButton>
          </div>
        )}
        <div className="flex w-[15rem] gap-5 items-center">
          <NumberInput item={item} />
          {isPending ? (
            <LoadingDots className="bg-black" />
          ) : (
            <button
              type="button"
              className="text-sm underline text-black/60"
              onClick={() => mutate({ itemId: item.id })}
            >
              Remove
            </button>
          )}
        </div>
        {itemCustomDiscount?.length > 0 && (
          <Disclosure as="div" className="w-full" defaultOpen>
            {({ open }) => (
              <>
                <div className="flex justify-between">
                  <dt>
                    <Disclosure.Button
                      className={`${
                        itemCustomDiscount ? "cursor-pointer" : "cursor-auto"
                      } flex text-sm`}
                    >
                      {itemCustomDiscount && (
                        <ChevronUpIcon
                          className={`${
                            open
                              ? "rotate-180 transform"
                              : "rotate-90 transform"
                          } h-3 w-3 text-black mr-1 mt-1`}
                        />
                      )}
                      Item Discounts
                    </Disclosure.Button>
                  </dt>
                </div>
                <Disclosure.Panel className="text-sm">
                  {item?.relationships?.custom_discounts?.data?.map(
                    (discount: any) => {
                      const details = itemCustomDiscount.find(
                        (disc: CustomDiscountCartItem) =>
                          disc.id === discount.id,
                      );
                      return (
                        <div
                          className="flex justify-between mt-4"
                          key={details.id}
                        >
                          <div className="flex justify-between gap-4">
                            <span>
                              <TrashIcon
                                className="h-5 w-5 text-red-600 hover:text-red-400 cursor-pointer"
                                onClick={() => removeCustomDiscount(details.id)}
                              />
                            </span>
                            {details.description}
                          </div>
                          <div>{details.amount.formatted}</div>
                        </div>
                      );
                    },
                  )}
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        )}
        <CartComponentData item={item} />
        <CartAdditionalData item={item} />
      </div>
      {enableCustomDiscount && selectedAccount && (
        <AddItemCustomDiscount
          itemId={item.id}
          selectedSalesRep={selectedAccount}
          enableCustomDiscount={enableCustomDiscount}
          openDiscount={openDiscount}
          setOpenDiscount={setOpenDiscount}
          name={item.name}
          sku={item.sku}
        />
      )}
    </div>
  );
}
