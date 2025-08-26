"use client";
import type { CartItem } from "@elasticpath/js-sdk";
import { EditItemQuantityButton } from "./EditQuantityButton";
import { useState, useEffect } from "react";
import { useCart } from "../../react-shopper-hooks";

interface NumberInputProps {
  item: CartItem;
}

export const NumberInput = ({ item }: NumberInputProps): JSX.Element => {
  const { useScopedUpdateCartItem } = useCart();
  const { mutate, isPending } = useScopedUpdateCartItem();
  const [inputValue, setInputValue] = useState(item.quantity.toString());

  // Sync input value with item.quantity when it changes
  useEffect(() => {
    setInputValue(item.quantity.toString());
  }, [item.quantity]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Only allow numbers
    if (/^\d*$/.test(val)) {
      setInputValue(val);
    }
  };

  const handleInputBlurOrEnter = () => {
    const newQuantity = parseInt(inputValue, 10);
    if (
      !isNaN(newQuantity) &&
      newQuantity > 0 &&
      newQuantity !== item.quantity
    ) {
      mutate({ itemId: item.id, quantity: newQuantity });
    } else {
      setInputValue(item.quantity.toString()); // Reset if invalid
    }
  };

  return (
    <div className="flex items-center rounded-md border border-black/10 w-fit mx-auto">
      <EditItemQuantityButton item={item} type="minus" />
      <svg
        width="1"
        height="28"
        viewBox="0 0 1 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0.5 0V28"
          stroke="black"
          strokeOpacity="0.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <input
        type="number"
        min={1}
        className="flex w-12 py-1.5 border-none text-center bg-transparent focus:outline-none appearance-none hide-number-spin text-sm"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlurOrEnter}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          }
        }}
        disabled={isPending}
        aria-label="Cart item quantity"
        style={{ MozAppearance: "textfield" }}
      />
      <style jsx global>{`
        input[type="number"].hide-number-spin::-webkit-inner-spin-button,
        input[type="number"].hide-number-spin::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"].hide-number-spin {
          -moz-appearance: textfield;
        }
      `}</style>
      <svg
        width="1"
        height="28"
        viewBox="0 0 1 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0.5 0V28"
          stroke="black"
          strokeOpacity="0.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <EditItemQuantityButton item={item} type="plus" />
    </div>
  );
};
