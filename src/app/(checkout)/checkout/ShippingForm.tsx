"use client";

import React from "react";
import { UnifiedAddressForm } from "../../../components/forms";

export function ShippingForm() {
  return (
    <UnifiedAddressForm
      mode="react-hook-form"
      fieldPrefix="shippingAddress"
      title="Shipping address"
      autoComplete="shipping"
      fields={{
        addressName: false,
        company: true,
        line2: false,
        county: false,
        phone: true,
        instructions: false,
      }}
      layout="checkout"
      useStaticCountries={false}
      enableGooglePlaces={true}
    />
  );
}
