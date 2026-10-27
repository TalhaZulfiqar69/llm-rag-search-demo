# LLM RAG Search Demo (Node.js + IBM watsonx.ai + Milvus)
A complete Retrieval-Augmented Generation (RAG) search API built with Node.js, TypeScript, Express, IBM watsonx.ai, and Milvus Vector Database.

This application allows users to ask natural language questions against internal documentation. The system retrieves the most relevant context snippets using semantic vector search and passes them to IBM watsonx.ai to generate grounded, cited answers.



## Architecture Overview

```
+------------------+         +----------------------+         +--------------------+
|                  |  Query  |                      |  Embed  |                    |
|   Client / API   | ------->|   Express API Server | ------->|  IBM watsonx.ai    |
|  (cURL / Fetch)  |         |      (server.ts)     |         |  (Slate Embedding) |
+------------------+         +----------------------+         +--------------------+
         ^                             |                                 |
         |                             v                                 v
         |                   +----------------------+         +--------------------+
         |                   |  Milvus Vector DB    |<--------|  Vector Embedding  |
         |                   |   (HNSW Cosine)      |         +--------------------+
         |                   +----------------------+
         |                             |
         |                             v Context + Query
         |                   +----------------------+
         |                   |  IBM watsonx.ai      |
         +-------------------|  (Granite LLM Chat)  |
               Answer        +----------------------+

```

1. Document Processing: HTML documentation is cleaned into plain text using Cheerio.
2. Vector Embedding: Text is transformed into vector embeddings using IBM's ibm/slate-125m-english-rtrvr model via watsonx.ai.
3. Vector Storage: Vectors and document metadata are stored in Milvus with an HNSW index and COSINE distance metric.
4. Retrieval: User search queries are vectorized and compared against Milvus data to retrieve top matching contexts.
5. Generation: Top context matches and the user's query are passed to IBM's ibm/granite-4-h-small LLM to generate a factual response with source citations.


## Project Structure
```


rag-search-demo/
├── src/
│   ├── config.ts         # Environment configuration loader
│   ├── watsonx.ts        # IBM watsonx.ai API wrapper (Embeddings & LLM Chat)
│   ├── milvus.ts         # Milvus collection management & connection logic
│   ├── documents.ts      # Sample documentation data & HTML parser helper
│   ├── rag.ts            # Core RAG workflow (indexing & semantic search + answer pipeline)
│   └── server.ts         # Express web server & CLI script runner
├── .env                  # Environment variables file (not checked into git)
├── .gitignore            # Git ignore file
├── package.json          # Node dependencies & project scripts
└── tsconfig.json         # TypeScript configuration
```


## Prerequisites

- Node.js (v18 or higher)
- Milvus Vector Database instance (running locally on port 19530 or hosted via Zilliz Cloud)
- IBM Cloud Account with access to watsonx.ai


## Environment Configuration

Create a .env file in the root directory:
```
PORT=3100

# IBM watsonx.ai credentials
WATSONX_URL=https://us-south.ml.cloud.ibm.com
WATSONX_API_KEY=your-ibm-cloud-api-key
WATSONX_PROJECT_ID=your-watsonx-project-id

# Models
WATSONX_EMBEDDING_MODEL=ibm/slate-125m-english-rtrvr
WATSONX_CHAT_MODEL=ibm/granite-4-h-small

# Milvus connection details
MILVUS_ADDRESS=localhost:19530
MILVUS_USERNAME=root
MILVUS_PASSWORD=your-milvus-password
MILVUS_COLLECTION=rag_demo_docs
```
Note on Watson SDK Auth: When running bash scripts or deployment environments, you can export your 

```
export WATSONX_AI_AUTH_TYPE=iam
export WATSONX_AI_APIKEY="your-ibm-cloud-api-key"
```



## Getting Started

### 1. Install Dependencies
```
npm install
```

### 2. Index Documents into Milvus
Before querying, seed the Milvus vector database with sample documents:
```
npm run index
```

### 3 Start the API Server
Development mode with hot-reload:
```
npm run dev
```
Production start:
```
npm start
```
### 1. Install Dependencies
```
npm install
```


## API Documentation

### Health Check

- URL: `/health`
- Method: GET
- Response:
```
{ "status": "ok" }
```


### Search & Answer

- URL: `/api/search`
- Method: POST
- Headers: Content-Type: application/json
- Body Schema:

```
{
  "query": "string (2 - 1000 characters)"
}
```


## Usage Examples
### cURL
```
curl -X POST http://localhost:3100/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"How do I authenticate API requests?"}'
```

### JavaScript / Fetch
```
const response = await fetch("http://localhost:3100/api/search", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    query: "How do I authenticate API requests?",
  }),
});

if (!response.ok) {
  throw new Error("AI search request failed");
}

const data = await response.json();

console.log("Answer:", data.answer);
console.log("Sources:", data.sources);

```


### Expected Response
```
{
  "answer": "Send the access token in the Authorization header using the Bearer scheme. Store tokens securely and never expose secret keys in browser-side JavaScript.",
  "sources": [
    {
      "title": "Authentication",
      "url": "/docs/authentication",
      "excerpt": "Authentication The application uses access tokens...",
      "score": 0.82
    }
  ]
}
```