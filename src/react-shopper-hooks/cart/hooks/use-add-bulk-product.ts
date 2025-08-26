import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { useElasticPath } from "../../elasticpath";
import { CartItemObject, CartItemsResponse } from "@elasticpath/js-sdk";

export const useAddBulkProductToCart = (
  cartId: string,
  options?: UseMutationOptions<CartItemsResponse, Error, CartItemObject[]>,
) => {
  const { client } = useElasticPath();
  return useMutation({
    mutationFn: async (items) => {
      return client.Cart(cartId).BulkAdd(items, { add_all_or_nothing: true });
    },
    ...options,
  });
};
