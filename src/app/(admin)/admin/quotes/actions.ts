"use server";

import {
  AccountTokenBase,
  CartShippingGroupBase,
  ResourcePage,
} from "@elasticpath/js-sdk";
import {
  getServerSideCredentialsClient,
  getServerSideCredentialsClientWihoutAccountToken,
} from "../../../../lib/epcc-server-side-credentials-client";
import { z } from "zod";
import { cookies } from "next/headers";
import { retrieveAccountMemberCredentials } from "../../../../lib/retrieve-account-member-credentials";
import {
  ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  CART_COOKIE_NAME,
} from "../../../../lib/cookie-constants";
import { revalidatePath } from "next/cache";
import { shippingAddressSchema } from "../../../../components/checkout/form-schema/checkout-form-schema";
import { AccountAddress, Resource } from "@elasticpath/js-sdk";
import { redirect } from "next/navigation";

const addAddressSchema = shippingAddressSchema.merge(
  z.object({
    name: z.string(),
    line_2: z
      .string()
      .optional()
      .transform((e) => (e === "" ? undefined : e)),
  }),
);

export async function getAllOrders(email?: string) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  if (email) {
    const accountMembers = await client.AccountMembers.Filter({
      eq: { email },
    }).All();
    const account_member_id = accountMembers.data[0].id;
    return await client.Orders.Filter({ eq: { account_member_id } }).All();
  }
  return await client.Orders.All();
}

export async function getAllQuotes(email?: string | null | undefined) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  if (email) {
    return await client.request.send(
      `/extensions/quotes?filter=eq(email,${email})`,
      "GET",
      undefined,
      undefined,
      client,
      false,
      "v2",
    );
  }
  return await client.request.send(
    `/extensions/quotes`,
    "GET",
    undefined,
    undefined,
    client,
    false,
    "v2",
  );
}

export async function getAllSalesReps() {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  return await client.request.send(
    `/users`,
    "GET",
    undefined,
    undefined,
    client,
    false,
    "v2",
  );
}

export async function getAccountAddresses(
  accountId: string,
): Promise<ResourcePage<AccountAddress>> {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  return client.AccountAddresses.All({ account: accountId }).catch((err: unknown) => {
    return err as ResourcePage<AccountAddress>;
  });
}

export async function createNewCart(quoteNumber: string) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  const request: any = {
    name: `# ${quoteNumber}`,
    description: `Quote #${quoteNumber}`,
    discount_settings: { custom_discounts_enabled: true },
    is_quote: true,
  };
  return await client.Cart().CreateCart(request);
}

export async function addAddress(formData: FormData, accountId: string) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  const rawEntries = Object.fromEntries(formData.entries());
  const validatedFormData = addAddressSchema.safeParse(rawEntries);

  if (!validatedFormData.success) {
    console.error(JSON.stringify(validatedFormData.error));
    throw new Error("Invalid address submission");
  }

  const { ...addressData } = validatedFormData.data;

  const body: any = {
    type: "address",
    ...addressData,
  };

  try {
    const result = (await client.AccountAddresses.Create({
      account: accountId,
      body: body,
    })) as Resource<AccountAddress>;
    return result;
  } catch (error) {
    console.error(error);
    throw new Error("Error adding address");
  }
}

export async function changeAccountCredentials(accountId: string) {
  const cookieStore = cookies();

  const accountMemberCredentials = retrieveAccountMemberCredentials(
    cookieStore,
    ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
  );

  if (!accountMemberCredentials) {
    redirect("/login");
    return;
  }

  const selectedAccount = accountMemberCredentials?.accounts[accountId];

  if (!selectedAccount) {
    throw new Error("Invalid account id");
  }

  cookieStore.set({
    name: ACCOUNT_MEMBER_TOKEN_COOKIE_NAME,
    value: JSON.stringify({
      ...accountMemberCredentials,
      selected: selectedAccount.account_id,
    }),
    path: "/",
    sameSite: "strict",
    expires: new Date(
      accountMemberCredentials.accounts[
        Object.keys(accountMemberCredentials.accounts)[0]
      ].expires,
    ),
  });

  revalidatePath("/account");
}

export async function applyCartCustomDiscount(id: string, request: any) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  const data: any = {
    type: "custom_discount",
    external_id: `Applied By - ${request.username}`,
    discount_engine: "CSR Portal",
    amount: -parseInt(request.amount),
    description: request.description,
    discount_code: "custom_code",
  };

  return await client
    .Cart(id)
    .AddCartCustomDiscount(data)
    .catch((err: unknown) => {
      return err;
    });
}

export async function applyItemCustomDiscount(
  id: string,
  itemId: string,
  request: any,
) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  const data: any = {
    type: "custom_discount",
    external_id: `Applied By - ${request.username}`,
    discount_engine: "CSR Portal",
    amount: -parseInt(request.amount),
    description: request.description,
    discount_code: "custom_code",
  };

  return await client
    .Cart(id)
    .AddItemCustomDiscount(itemId, data)
    .catch((err: unknown) => {
      return err;
    });
}

export async function getCartSettings() {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  return await client.Settings.Cart();
}

export async function deleteCartCustomDiscount(
  id: string,
  customDiscountId: string,
) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  return await client.Cart(id).RemoveCartCustomDiscount(customDiscountId);
}

export async function deleteItemCustomDiscount(
  id: string,
  itemId: string,
  customDiscountId: string,
) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  return await client
    .Cart(id)
    .RemoveItemCustomDiscount(itemId, customDiscountId);
}

export async function createNewQuote(cartId: string, request?: any) {
  const client = getServerSideCredentialsClient();
  return await client.request
    .send(
      `/extensions/quotes/${cartId}`,
      "PUT",
      request,
      undefined,
      client,
      undefined,
      "v2",
    )
    .catch((err: unknown) => {
      console.error("Error while creating new quote", err);
      return err;
    });
}

export async function associateCartWithAccount(id: string, accountId: string) {
  const client = getServerSideCredentialsClient();
  return await client.Cart(id).AddAccountAssociation(accountId, "");
}

export async function getQuoteByQuoteRef(quoteId: string) {
  const cookieStore = cookies();
  const client = getServerSideCredentialsClientWihoutAccountToken();
  const quote = await client.request.send(
    `/extensions/quotes?filter=eq(quote_ref,${quoteId})`,
    "GET",
    undefined,
    undefined,
    client,
    false,
    "v2",
  );
  const cartId = quote?.data?.[0]?.cart_id;
  cookieStore.set(CART_COOKIE_NAME, cartId, { path: "/" });
  return quote;
}

export async function createShippingGroup(id: string, request: any) {
  const client = getServerSideCredentialsClient();
  return await client.request
    .send(
      `carts/${id}/shipping-groups`,
      "POST",
      request,
      undefined,
      client,
      undefined,
      "v2",
    )
    .catch((err: unknown) => {
      console.error("Error while creating shipping group", err);
      return err;
    });
}

export async function getShippingGroups(id: string) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  return await client.request
    .send(
      `carts/${id}/shipping-groups`,
      "GET",
      undefined,
      undefined,
      client,
      undefined,
      "v2",
    )
    .catch((err: unknown) => {
      console.error("Error while getting shipping group", err);
      return err;
    });
}

export async function getAccountDetails(accountId: string) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  return await client.Accounts.Get(accountId).catch((err: unknown) => {
    console.error("Error while getting account details", err);
    return err;
  });
}

export async function getAccountOrderDetails(account_id: string) {
  const client = getServerSideCredentialsClientWihoutAccountToken();
  return await client.Orders.With("items")
    .Filter({ eq: { account_id, payment: "paid" } })
    .All()
    .catch((err: unknown) => {
      console.error("Error while getting account details", err);
      return err;
    });
}
