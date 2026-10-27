import { createHash } from "node:crypto";
import { config } from "./config.js";
import { demoDocuments, htmlToText } from "./documents.js";
import { embed, answerWithLLM } from "./watsonx.js";
import { milvus, ensureCollection } from "./milvus.js";

export async function indexDemoDocuments() {
  const documents = demoDocuments.map((doc) => ({
    ...doc,
    content: htmlToText(doc.html),
  }));

  const vectors = await embed(
    documents.map((doc) => `${doc.title}\n${doc.content}`),
  );

  if (!vectors.length || !vectors[0].length) {
    throw new Error("Embedding model returned empty vectors");
  }

  await ensureCollection(vectors[0].length);

  await milvus.upsert({
    collection_name: config.collection,
    data: documents.map((doc, index) => ({
      id: createHash("sha256")
        .update(doc.id)
        .digest("hex"),
      title: doc.title,
      url: doc.url,
      content: doc.content,
      embedding: vectors[index],
    })),
  });

  console.log(`Indexed ${documents.length} demo documents`);
}

export async function searchAndAnswer(question: string) {
  const [queryVector] = await embed([question]);

  const response = await milvus.search({
    collection_name: config.collection,
    data: [queryVector],
    anns_field: "embedding",
    limit: 4,
    output_fields: ["id", "title", "url", "content"],
    params: { ef: 64 },
  });

  const results = response.results ?? [];

  const sources = results.map((hit: any) => ({
    title: String(hit.title),
    url: String(hit.url),
    excerpt: String(hit.content),
    score: Number(hit.score ?? 0),
  }));

  if (!sources.length) {
    return {
      answer: "I couldn't find relevant documentation.",
      sources: [],
    };
  }

  const context = sources
    .map(
      (source, i) =>
        `[Source ${i + 1}: ${source.title}; URL: ${source.url}]\n` +
        source.excerpt,
    )
    .join("\n\n");

  const answer = await answerWithLLM(question, context);

  return { answer, sources };
}