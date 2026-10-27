import "dotenv/config";
import process from "process";

export const config = {
  port: Number(process.env.PORT ?? 3100),
  projectId: process.env.WATSONX_PROJECT_ID!,
  serviceUrl:
    process.env.WATSONX_URL ??
    "https://us-south.ml.cloud.ibm.com",
  embeddingModel:
    process.env.WATSONX_EMBEDDING_MODEL ??
    "ibm/slate-125m-english-rtrvr",
  chatModel:
    process.env.WATSONX_CHAT_MODEL ??
    "ibm/granite-4-h-small",
  milvusAddress:
    process.env.MILVUS_ADDRESS ?? "localhost:19530",
  milvusUsername: process.env.MILVUS_USERNAME,
  milvusPassword: process.env.MILVUS_PASSWORD,
  collection:
    process.env.MILVUS_COLLECTION ?? "rag_demo_docs",
};