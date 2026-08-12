import {
  type CreatedPartResult,
  PartStatus,
  type PartCreateInput,
  type PartCreatePayload,
  type PartListResult,
  type PartResult,
  type PartStockResult,
  type PartUpdateInput,
  type PartUpdatePayload,
  type UpdatedPartResult,
  createSevdeskClient,
  refs
} from "../src/index.js";

const client = createSevdeskClient({ apiToken: "token" });

const createInput = {
  name: "Widget",
  partNumber: "SKU-1",
  stock: 1,
  unity: refs.unity(1),
  taxRate: 19,
  status: PartStatus.ACTIVE
} satisfies PartCreateInput;

const updateInput = { status: "inactive" } satisfies PartUpdateInput;
const listed: Promise<PartListResult> = client.parts.list({ embed: ["category", "unity"] });
const found: Promise<PartResult> = client.parts.get(1);
const stock: Promise<PartStockResult> = client.parts.getStock(1);
const created: Promise<CreatedPartResult> = client.parts.create(createInput);
const updated: Promise<UpdatedPartResult> = client.parts.update(1, updateInput);

declare const createPayload: PartCreatePayload;
declare const updatePayload: PartUpdatePayload;
void [listed, found, stock, created, updated, createPayload, updatePayload];

// @ts-expect-error a create requires all OpenAPI-required business fields
client.parts.create({ name: "Incomplete" });
// @ts-expect-error updates cannot be empty
client.parts.update(1, {});
// @ts-expect-error arbitrary status codes require rawEnumCode("PartStatus", code)
client.parts.update(1, { status: 51 });
// @ts-expect-error a Category reference cannot be used as the unit
client.parts.create({ ...createInput, unity: refs.category(1) });
// @ts-expect-error curated embed paths are resource-specific
client.parts.list({ embed: ["contact"] });
// @ts-expect-error curated ids reject arbitrary non-numeric strings
client.parts.get("part-1");
