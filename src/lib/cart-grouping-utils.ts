import { CartItem } from "@elasticpath/js-sdk";

export interface BaseProductGroup {
  baseProductId: string;
  baseProductName: string;
  items: CartItem[];
}

export interface GroupedCartItems {
  homeDelivery: BaseProductGroup[];
  clickAndCollect: {
    [locationName: string]: BaseProductGroup[];
  };
}

/**
 * Groups cart items by base product, maintaining delivery method grouping
 */
export function groupCartItemsByBaseProduct(items: readonly CartItem[]): GroupedCartItems {
  const result: GroupedCartItems = {
    homeDelivery: [],
    clickAndCollect: {},
  };

  // First, separate items by delivery method
  const homeDeliveryItems = items.filter(
    (item: CartItem) =>
      item.custom_inputs?.location?.delivery_mode !== "Click & Collect"
  );

  const clickAndCollectItems = items.filter(
    (item: CartItem) =>
      item.custom_inputs?.location?.delivery_mode === "Click & Collect"
  );

  // Group home delivery items by base product
  result.homeDelivery = groupItemsByBaseProduct(homeDeliveryItems);

  // Group click and collect items by location, then by base product
  const clickAndCollectByLocation = clickAndCollectItems.reduce(
    (groups: { [key: string]: CartItem[] }, item: CartItem) => {
      const locationName =
        item.custom_inputs?.location?.location_name || "Unknown Location";
      if (!groups[locationName]) {
        groups[locationName] = [];
      }
      groups[locationName].push(item);
      return groups;
    },
    {}
  );

  // Group each location's items by base product
  Object.entries(clickAndCollectByLocation).forEach(([locationName, locationItems]) => {
    result.clickAndCollect[locationName] = groupItemsByBaseProduct(locationItems);
  });

  return result;
}

/**
 * Groups an array of cart items by their base product
 */
function groupItemsByBaseProduct(items: readonly CartItem[]): BaseProductGroup[] {
  const baseProductMap = new Map<string, BaseProductGroup>();

  items.forEach((item) => {
    // Get base product info from custom inputs, fallback to product_id
    const baseProductId = item.custom_inputs?.base_product_id || item.product_id || 'unknown';
    const baseProductName = item.custom_inputs?.base_product_name || item.name || 'Unknown Product';

    if (!baseProductMap.has(baseProductId)) {
      baseProductMap.set(baseProductId, {
        baseProductId,
        baseProductName,
        items: [],
      });
    }

    baseProductMap.get(baseProductId)!.items.push(item);
  });

  return Array.from(baseProductMap.values());
}

/**
 * Gets a summary of base product groups for display purposes
 */
export function getBaseProductGroupSummary(group: BaseProductGroup): string {
  const totalQuantity = group.items.reduce((sum, item) => sum + item.quantity, 0);
  const variantCount = group.items.length;
  
  if (variantCount === 1) {
    return `${totalQuantity} item${totalQuantity > 1 ? 's' : ''}`;
  } else {
    return `${totalQuantity} items (${variantCount} variants)`;
  }
}