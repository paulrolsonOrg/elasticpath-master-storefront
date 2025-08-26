"use client";
import { FormEvent } from "react";
import { cn } from "../../lib/cn";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { LoadingDots } from "../LoadingDots";
import type { CartItem } from "@elasticpath/js-sdk";
import { useCart } from "../../react-shopper-hooks";
import { toast } from "react-toastify";

export function EditItemQuantityButton({
  item,
  type,
}: {
  item: CartItem;
  type: "plus" | "minus";
}) {
  const { useScopedUpdateCartItem } = useCart();
  const { mutate, isPending } = useScopedUpdateCartItem();

  return (
    <>
      <button
        type="submit"
        onClick={(e: FormEvent<HTMLButtonElement>) => {
          if (isPending) e.preventDefault();
          mutate(
            {
              itemId: item.id,
              quantity: type === "plus" ? item.quantity + 1 : item.quantity - 1,
            },
            {
              onError: (response: any) => {
                if (response?.errors) {
                  toast.error(response?.errors?.[0].detail, {
                    position: "top-center",
                    autoClose: 2000,
                    hideProgressBar: false,
                  });
                }
              },
            },
          );
        }}
        aria-label={
          type === "plus" ? "Increase item quantity" : "Reduce item quantity"
        }
        aria-disabled={isPending}
        className={cn(
          "ease flex w-7 h-7 p-1 justify-center items-center transition-all duration-200",
          {
            "cursor-not-allowed": isPending,
            "ml-auto": type === "minus",
          },
        )}
      >
        {isPending ? (
          <LoadingDots className="bg-black" />
        ) : type === "plus" ? (
          <PlusIcon className="h-4 w-4 dark:text-neutral-500" />
        ) : (
          <MinusIcon className="h-4 w-4 dark:text-neutral-500" />
        )}
      </button>
      <p aria-live="polite" className="sr-only" role="status">
        updating
      </p>
    </>
  );
}
