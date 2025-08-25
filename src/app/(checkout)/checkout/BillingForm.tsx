"use client";

import React, { useEffect } from "react";
import { CheckoutForm as CheckoutFormSchemaType } from "../../../components/checkout/form-schema/checkout-form-schema";
import { Checkbox } from "../../../components/Checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "../../../components/form/Form";
import { useFormContext, useWatch } from "react-hook-form";
import { UnifiedAddressForm } from "../../../components/forms";

export function BillingForm() {
  const { control, resetField } = useFormContext<CheckoutFormSchemaType>();
  const isSameAsShipping = useWatch({ control, name: "sameAsShipping" });

  useEffect(() => {
    // Reset the billing address fields when the user selects the same as shipping address
    if (isSameAsShipping) {
      resetField("billingAddress", {
        keepDirty: false,
        keepTouched: false,
        keepError: false,
      });
    }
  }, [isSameAsShipping, resetField]);

  return (
    <fieldset className="flex flex-col gap-5">
      <div>
        <legend className="text-2xl font-medium">Billing address</legend>
      </div>
      <div className="flex items-center">
        <FormField
          control={control}
          name="sameAsShipping"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Same as shipping address</FormLabel>
              </div>
            </FormItem>
          )}
        />
      </div>
      {!isSameAsShipping && (
        <UnifiedAddressForm
          mode="react-hook-form"
          fieldPrefix="billingAddress"
          title=""
          autoComplete="billing"
          fields={{
            addressName: false,
            company: true,
            line2: false,
            county: false,
            phone: false,
            instructions: false,
          }}
          layout="checkout"
          useStaticCountries={false}
          required={[]}
          enableGooglePlaces={true}
        />
      )}
    </fieldset>
  );
}
