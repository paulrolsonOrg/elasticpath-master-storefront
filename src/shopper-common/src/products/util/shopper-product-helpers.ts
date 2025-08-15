import type {
  ElasticPath as EPCCClient,
  ShopperCatalogResourcePage,
} from "@elasticpath/js-sdk";
import { sortAlphabetically } from "./sort-alphabetically";
import { ProductResponse } from "@elasticpath/js-sdk";
import {
  BaseProduct,
  BaseProductResponse,
  BundleProductResponse,
  ChildProduct,
  ChildProductResponse,
  ShopperProduct,
  SimpleProduct,
  SimpleProductResponse,
  BundleProduct,
} from "../";
import {
  getProductMainImage,
  getProductOtherImageUrls,
} from "./product-image-helpers";
import { getFilesByIds, getProductById } from "../services/product";

export async function createShopperBundleProduct(
  productResource: ShopperCatalogResourcePage<BundleProductResponse>,
  client: EPCCClient,
): Promise<BundleProduct> {
  const componentProducts = productResource.included?.component_products;

  if (!componentProducts) {
    throw new Error("component_products where unexpectedly undefined");
  }
  const mainImageIds = componentProducts
    .map((c: any) => c.relationships?.main_image?.data?.id)
    .filter(isString);
  const { data: mainProductComponentImages } = await getFilesByIds(
    mainImageIds,
    client,
  );

  return {
    kind: "bundle-product",
    response: productResource.data[0],
    main_image: getProductMainImage(productResource.included?.main_images),
    otherImages: getProductOtherImageUrls(
      productResource.included?.files,
      productResource.included?.main_images?.[0],
    ),
    componentProductResponses: componentProducts,
    componentProductImages: mainProductComponentImages,
  };
}

function isString(x: any): x is string {
  return typeof x === "string";
}

export function createShopperSimpleProduct(
  productResource: ShopperCatalogResourcePage<SimpleProductResponse>,
): SimpleProduct {
  return {
    kind: "simple-product",
    response: productResource.data[0],
    main_image: getProductMainImage(productResource.included?.main_images),
    otherImages: getProductOtherImageUrls(
      productResource.included?.files,
      productResource.included?.main_images?.[0],
    ),
  };
}

export async function createShopperChildProduct(
  productResources: ShopperCatalogResourcePage<ChildProductResponse>,
  client: EPCCClient,
): Promise<ChildProduct> {
  const baseProductId = productResources.data?.[0].attributes.base_product_id;
  const baseProduct = await getProductById(baseProductId, client);

  if (!baseProduct) {
    throw Error(
      `Unable to retrieve child props, failed to get the base product for ${baseProductId}`,
    );
  }

  const {
    data: {
      meta: { variation_matrix, variations },
    },
  } = baseProduct;

  if (!variations || !variation_matrix) {
    throw Error(
      `Unable to retrieve child props, failed to get the variations or variation_matrix from base product for ${baseProductId}`,
    );
  }

  return {
    kind: "child-product",
    response: productResources.data[0],
    baseProduct: baseProduct.data,
    main_image: getProductMainImage(productResources.included?.main_images),
    otherImages: getProductOtherImageUrls(
      productResources.included?.files,
      productResources.included?.main_images?.[0],
    ),
    variationsMatrix: variation_matrix,
    variations: variations.sort(sortAlphabetically),
  };
}

export function createShopperBaseProduct(
  productResource: ShopperCatalogResourcePage<BaseProductResponse>,
): BaseProduct {
  const {
    meta: { variations, variation_matrix },
    attributes: { slug },
  } = productResource.data[0];

  if (!variations || !variation_matrix) {
    throw Error(
      `Unable to retrieve base product props, failed to get the variations or variation_matrix from base product for ${slug}`,
    );
  }

  return {
    kind: "base-product",
    response: productResource.data[0],
    main_image: getProductMainImage(productResource.included?.main_images),
    otherImages: getProductOtherImageUrls(
      productResource.included?.files,
      productResource.included?.main_images?.[0],
    ),
    variationsMatrix: variation_matrix,
    variations: variations.sort(sortAlphabetically),
  };
}

export function isBundleProduct(
  productResponse: ShopperCatalogResourcePage<ProductResponse>,
): boolean {
  return "components" in productResponse.data?.[0].attributes;
}

export function isVariationProductChild(
  product: ShopperCatalogResourcePage<ProductResponse>,
): boolean {
  return "base_product_id" in product.data?.[0].attributes;
}

export function isVariationProductBase(
  product: ShopperCatalogResourcePage<ProductResponse>,
): boolean {
  return product.data?.[0].attributes.base_product;
}

export async function parseProductResponse(
  product: ShopperCatalogResourcePage<ProductResponse>,
  client: EPCCClient,
): Promise<ShopperProduct> {
  if (isBundleProduct(product)) {
    return createShopperBundleProduct(
      product as ShopperCatalogResourcePage<BundleProductResponse>,
      client,
    );
  }

  // Handle Variation products
  if (isVariationProductBase(product)) {
    return createShopperBaseProduct(
      product as ShopperCatalogResourcePage<BaseProductResponse>,
    );
  }

  if (isVariationProductChild(product)) {
    return createShopperChildProduct(
      product as ShopperCatalogResourcePage<ChildProductResponse>,
      client,
    );
  }

  return createShopperSimpleProduct(
    product as ShopperCatalogResourcePage<SimpleProductResponse>,
  );
}
