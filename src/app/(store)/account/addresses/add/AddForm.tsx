"use client";

import React from "react";
import { addAddress } from "../actions";
import { FormStatusButton } from "../../../../../components/button/FormStatusButton";
import { UnifiedAddressForm } from "../../../../../components/forms";
import { useQueryClient } from "@tanstack/react-query";
import {
  accountAddressesQueryKeys,
  useAuthedAccountMember,
} from "../../../../../react-shopper-hooks";

export function AddForm() {
  const queryClient = useQueryClient();
  const { selectedAccountToken } = useAuthedAccountMember();

  return (
    <form
      action={async (formData) => {
        await addAddress(formData);
        await queryClient.invalidateQueries({
          queryKey: [
            ...accountAddressesQueryKeys.list({
              accountId: selectedAccountToken?.account_id,
            }),
          ],
        });
      }}
      className="flex flex-col gap-5"
    >
      <UnifiedAddressForm
        mode="server-action"
        title="Add Address"
        fields={{
          addressName: true,
          company: false,
          line2: true,
          county: true,
          phone: true,
          instructions: true,
        }}
        fieldMapping={{
          address_name: 'name'
        }}
        layout="account"
        autoComplete="shipping"
        useStaticCountries={true}
        required={['address_name', 'first_name', 'last_name', 'line_1', 'postcode', 'country']}
      />
      <div className="flex">
        <FormStatusButton variant="secondary" type="submit">
          Save changes
        </FormStatusButton>
      </div>
    </form>
  );
}
