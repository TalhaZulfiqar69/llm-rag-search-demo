import express from "express";
import { z } from "zod";
import { config } from "./config.js";
import { indexDemoDocuments, searchAndAnswer } from "./rag.js";
import { milvus } from "./milvus.js";

const app = express();
app.use(express.json({ limit: "32kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const searchSchema = z.object({
  query: z.string().trim().min(2).max(1000),
});

app.post("/api/search", async (req, res) => {
  const parsed = searchSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Provide a query between 2 and 1000 characters.",
    });
    return;
  }

  try {
    const result = await searchAndAnswer(parsed.data.query);
    res.json(result);
  } catch (error) {
    console.error("Search failed:", error);
    res.status(502).json({
      error: "Search service temporarily unavailable.",
    });
  }
});

if (process.argv[2] === "index") {
  try {
    await indexDemoDocuments();
  } finally {
    await milvus.closeConnection();
  }
} else {
  app.listen(config.port, () => {
    console.log(`RAG demo listening on http://localhost:${config.port}`);
  });
}