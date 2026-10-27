import {
  MilvusClient,
  DataType,
  MetricType,
} from "@zilliz/milvus2-sdk-node";

import { config } from "./config.js";

export const milvus = new MilvusClient({
  address: config.milvusAddress,
  ...(config.milvusUsername && config.milvusPassword
    ? {
        username: config.milvusUsername,
        password: config.milvusPassword,
      }
    : {}),
});

export async function ensureCollection(
  dimension: number,
): Promise<void> {
  await milvus.connectPromise;

  const { value: exists } = await milvus.hasCollection({
    collection_name: config.collection,
  });

  if (exists) {
    // Do not silently reuse an incompatible schema.
    const description = await milvus.describeCollection({
      collection_name: config.collection,
    });

    const vectorField = description.schema?.fields?.find(
      (field: { name?: string }) => field.name === "embedding",
    ) as { type_params?: Array<{ key: string; value: string }> }
      | undefined;

    const existingDimension = vectorField?.type_params?.find(
      (param) => param.key === "dim",
    )?.value;

    if (existingDimension && Number(existingDimension) !== dimension) {
      throw new Error(
        `Milvus dimension mismatch: existing=${existingDimension}, ` +
        `watsonx=${dimension}. Use a new collection or migrate it.`,
      );
    }

    await milvus.loadCollection({
      collection_name: config.collection,
    });
    return;
  }

  await milvus.createCollection({
    collection_name: config.collection,
    fields: [
      {
        name: "id",
        data_type: DataType.VarChar,
        is_primary_key: true,
        max_length: 128,
      },
      {
        name: "title",
        data_type: DataType.VarChar,
        max_length: 512,
      },
      {
        name: "url",
        data_type: DataType.VarChar,
        max_length: 1024,
      },
      {
        name: "content",
        data_type: DataType.VarChar,
        max_length: 12000,
      },
      {
        name: "embedding",
        data_type: DataType.FloatVector,
        dim: dimension,
      },
    ],
    index_params: [
      {
        field_name: "embedding",
        index_type: "HNSW",
        metric_type: MetricType.COSINE,
        params: { M: 16, efConstruction: 200 },
      },
    ],
  });

  await milvus.loadCollection({
    collection_name: config.collection,
  });
}