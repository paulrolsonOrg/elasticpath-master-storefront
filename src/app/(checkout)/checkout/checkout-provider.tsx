"use client";

import React, { createContext, useContext, useState } from "react";
import { useForm, useFormContext } from "react-hook-form";
import {
  CheckoutForm,
  checkoutFormSchema,
} from "../../../components/checkout/form-schema/checkout-form-schema";
import {
  CartState,
  RefinedCartItem,
  useAuthedAccountMember,
  useCart,
} from "../../../react-shopper-hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "../../../components/form/Form";
import { ShippingMethod, useShippingMethod } from "./useShippingMethod";
import { usePaymentComplete } from "./usePaymentComplete";
import { loadStripe } from "@stripe/stripe-js/pure";
loadStripe.setLoadParameters({
  advancedFraudSignals: process.env.NODE_ENV === "test" ? false : true,
});
import { Elements } from "@stripe/react-stripe-js";
import { StripeElementsOptions } from "@stripe/stripe-js";
import { epPaymentsEnvData } from "../../../lib/resolve-ep-stripe-env";
import { EP_CURRENCY_CODE } from "../../../lib/resolve-ep-currency-code";
import { Toaster } from "../../../components/toast/toaster";
import { toast } from "react-toastify";
import { deleteCookie, setCookie } from "cookies-next";
import { CART_COOKIE_NAME } from "../../../lib/cookie-constants";
import { getEpccImplicitClient } from "../../../lib/epcc-implicit-client";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { cartQueryKeys } from "../../../react-shopper-hooks/cart/hooks/use-get-cart";

const stripePromise = loadStripe(epPaymentsEnvData.publishableKey, {
  stripeAccount: epPaymentsEnvData.accountId,
});

type CheckoutContext = {
  cart?: CartState;
  isLoading: boolean;
  completePayment: ReturnType<typeof usePaymentComplete>;
  isCompleting: boolean;
  confirmationData: ReturnType<typeof usePaymentComplete>["data"];
  shippingMethods: {
    options?: ShippingMethod[];
    isLoading: boolean;
  };
};

const CheckoutContext = createContext<CheckoutContext | null>(null);

type CheckoutProviderProps = {
  children?: React.ReactNode;
  cart?: any;
};

export function StripeCheckoutProvider({
  children,
  cart,
}: CheckoutProviderProps) {
  const { state, useClearCart } = useCart();

  const { mutateAsync: mutateClearCart } = useClearCart();

  const [confirmationData, setConfirmationData] =
    useState<ReturnType<typeof usePaymentComplete>["data"]>(undefined);

  const { selectedAccountToken } = useAuthedAccountMember();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Determine if user is authenticated and set appropriate default values
  const isAuthenticated = !!selectedAccountToken;

  const formMethods = useForm<CheckoutForm>({
    reValidateMode: "onChange",
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: isAuthenticated
      ? {
          // For authenticated users
          account: {
            email: "",
            name: "",
          },
          shippingAddress: {
            first_name: "",
            last_name: "",
            company_name: "",
            line_1: "",
            line_2: "",
            city: "",
            county: "",
            region: "",
            postcode: "",
            country: "",
            phone_number: "",
            instructions: "",
          },
          sameAsShipping: true,
          shippingMethod: "__shipping_standard",
          paymentMethod: "ep_payment",
        }
      : {
          // For guest users
          guest: {
            email: "",
          },
          shippingAddress: {
            first_name: "",
            last_name: "",
            company_name: "",
            line_1: "",
            line_2: "",
            city: "",
            county: "",
            region: "",
            postcode: "",
            country: "",
            phone_number: "",
            instructions: "",
          },
          sameAsShipping: true,
          shippingMethod: "__shipping_standard",
          paymentMethod: "ep_payment",
        },
  });

  const { data: shippingMethods, isLoading: isShippingMethodsLoading } =
    useShippingMethod();

  const paymentComplete = usePaymentComplete(
    {
      cartId: cart?.data?.id ? cart?.data?.id : state?.id,
      accountToken: selectedAccountToken?.token,
    },
    {
      onSuccess: async (data) => {
        setConfirmationData(data);

        // Clear the cart after successful order placement
        const cartIdToClear = cart?.data?.id || state?.id;
        if (cartIdToClear) {
          try {
            await mutateClearCart({ cartId: cartIdToClear });

            // Delete the cart cookie
            deleteCookie(CART_COOKIE_NAME);

            // Create a new cart and set the cookie
            const client = getEpccImplicitClient();
            const response = await client.Cart().CreateCart({ name: "Cart" });
            setCookie(CART_COOKIE_NAME, response.data.id);

            // Invalidate all cart queries to refresh the UI
            await queryClient.invalidateQueries({
              queryKey: cartQueryKeys.all,
            });

            // Don't navigate - let CheckoutViews handle showing the confirmation
            // The confirmationData will trigger the OrderConfirmation component to display
          } catch (error) {
            console.error("Failed to clear cart after order placement:", error);
          }
        }
      },
      onError: (error: any) => {
        // Surface error to user and console
        const message =
          error?.message ||
          (typeof error === "string" ? error : "Unknown error");
        toast.error("Payment failed: " + message);
        console.error("Payment error:", error);
      },
    },
  );

  return (
    <Form {...formMethods}>
      <CheckoutContext.Provider
        value={{
          shippingMethods: {
            options: shippingMethods,
            isLoading: isShippingMethodsLoading,
          },
          confirmationData,
          isLoading: false,
          cart: state,
          completePayment: paymentComplete,
          isCompleting: paymentComplete.isPending,
        }}
      >
        {children}
      </CheckoutContext.Provider>
    </Form>
  );
}

export function CheckoutProvider({ children, cart }: CheckoutProviderProps) {
  const { state } = useCart();
  const subscriptionItems = state?.items.filter(
    (item: RefinedCartItem) => item.subscription_offering_id,
  );
  const hasSubscriptionItem =
    subscriptionItems && subscriptionItems?.length > 0;
  const options: StripeElementsOptions = {
    mode: "payment",
    currency: EP_CURRENCY_CODE.toLowerCase(),
    amount:
      cart?.meta?.display_price?.with_tax?.amount &&
      cart?.meta?.display_price?.with_tax?.amount > 0
        ? cart?.meta?.display_price?.with_tax?.amount
        : state?.meta?.display_price?.with_tax?.amount &&
            state?.meta?.display_price?.with_tax?.amount > 0
          ? state?.meta?.display_price?.with_tax?.amount
          : 100,
    capture_method: "automatic",

    appearance: {
      theme: "stripe",
    }

  };

  return (
    <Elements options={options} stripe={stripePromise}>
      <Toaster />
      <StripeCheckoutProvider cart={cart}>{children}</StripeCheckoutProvider>
    </Elements>
  );
}

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  const form = useFormContext<CheckoutForm>();
  if (context === null) {
    throw new Error("useCheckout must be used within a CheckoutProvider");
  }
  return { ...context, ...form };
};
