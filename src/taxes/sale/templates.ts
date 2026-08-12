export const SaleProduct = {
  ELECTRONIC_SERVICE: "electronic-service",
  OTHER_SERVICE: "other-service",
  GOODS: "goods"
} as const;

export type SaleProductId = (typeof SaleProduct)[keyof typeof SaleProduct];

export const SaleTemplate = {
  GERMAN_SAAS: "german-saas",
  GERMAN_OTHER_SERVICE: "german-other-service",
  GERMAN_GOODS: "german-goods"
} as const;

export type SaleTemplateId = (typeof SaleTemplate)[keyof typeof SaleTemplate];

export const SALE_TEMPLATE_PRODUCT: Readonly<Record<SaleTemplateId, SaleProductId>> = Object.freeze(
  {
    [SaleTemplate.GERMAN_SAAS]: SaleProduct.ELECTRONIC_SERVICE,
    [SaleTemplate.GERMAN_OTHER_SERVICE]: SaleProduct.OTHER_SERVICE,
    [SaleTemplate.GERMAN_GOODS]: SaleProduct.GOODS
  }
);
