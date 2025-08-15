"use client";

import React from "react";
import { UnifiedAddressForm } from "../../../components/forms";

type AddressFormProps = {
  title?: string;
  addressField: "shippingAddress" | "billingAddress";
};

export function AddressForm({
  title = "Address",
  addressField,
}: AddressFormProps) {
  const isShipping = addressField === "shippingAddress";
  
  return (
    <UnifiedAddressForm
      mode="react-hook-form"
      fieldPrefix={addressField}
      title={title}
      autoComplete={isShipping ? "shipping" : "billing"}
      fields={{
        addressName: false,
        company: true,
        line2: true,
        county: false,
        phone: isShipping,
        instructions: isShipping,
      }}
      layout="checkout"
      useStaticCountries={false}
    />
  );
}
