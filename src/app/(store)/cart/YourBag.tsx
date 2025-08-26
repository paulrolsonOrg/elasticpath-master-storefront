"use client";

import { CartItemWide } from "./CartItemWide";
import { useCart } from "../../../react-shopper-hooks";
import { CartItemsGrouped } from "../../../components/cart/CartItemsGrouped";
import { CartItemsBaseProductGrouped } from "../../../components/cart/CartItemsBaseProductGrouped";

export function YourBag() {
  const { state } = useCart();
  const enableClickAndCollect =
    process.env.NEXT_PUBLIC_ENABLE_CLICK_AND_COLLECT === "true";

  return (
    <ul role="list" className="flex flex-col items-start gap-5 self-stretch">
      <CartItemsBaseProductGrouped items={state?.items || []} isFullCart={true} />
    </ul>
  );
}
