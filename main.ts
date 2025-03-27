export {};
import "jsr:@std/dotenv/load";

import { RecursiveCharacterTextSplitter } from "npm:langchain/text_splitter";
import { Cohere } from "npm:@langchain/cohere";
import { CohereEmbeddings } from "npm:@langchain/cohere";
import { Pinecone } from "npm:@pinecone-database/pinecone@5.1.1";

// 1. Load Meeting Notes
// Extract text from meeting transcriptions (e.g., from a file, API, or live recording).
// Preprocess the text (cleaning, removing filler words, correcting errors, speaker diarization if needed).

const meetingNotes = await Deno.readTextFile("meeting_notes.txt");
console.log("Loaded meeting notes");

// 2. Chunk Meeting Notes
// Decide on chunking strategy:

// Fixed-size chunks (e.g., 512 tokens)
// Semantic chunking (using NLP models to split based on topic shifts)
// Ensure each chunk has enough context but is not too large.

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 512,
  chunkOverlap: 50, // Ensures context continuity
});

const chunks = await splitter.createDocuments([meetingNotes]);
// console.log(chunks.map(c => c.pageContent));
console.log(`Generated ${chunks.length} chunks`);


// 3. Embed Chunks into Vectors
// Choose an embedding model (e.g., OpenAI's text-embedding-ada-002, SentenceTransformers, or Cohere).
// Convert text chunks into dense vector representations.
console.log("Cohere API Key", Deno.env.get("COHERE_API_KEY"));
const embeddings = new CohereEmbeddings({
    apiKey: Deno.env.get("COHERE_API_KEY"), // Get API key from Cohere
    model: "embed-english-v3.0", // Cohere's latest English embedding model
});

const vectorStore = await embeddings.embedDocuments(
    chunks.map(chunk => chunk.pageContent)
);

console.log(`Generated ${vectorStore.length} embeddings`);

// 4. Store Vectors in Pinecone
// Define the index structure (e.g., metadata like timestamps, speakers).

// Upsert embeddings into Pinecone for efficient retrieval.
const pinecone = new Pinecone({
    apiKey: Deno.env.get("PINECONE_API_KEY") as string,
});

const index = pinecone.Index("note-ai");

// Prepare vectors for Pinecone format
const vectors = vectorStore.map((embedding, idx) => ({
    id: `chunk_${idx}`,
    values: embedding,
    metadata: {
        text: chunks[idx].pageContent,
        // Add any additional metadata you want to store
        timestamp: new Date().toISOString(),
    },
}));

// Upsert vectors into Pinecone
await index.upsert(vectors);

console.log("Stored vectors in Pinecone");

// 5. Retrieve Relevant Chunks for Queries
// Use semantic search with Pinecone to fetch relevant meeting context.

// Apply hybrid search (e.g., keyword + vector search) for better accuracy.
const query = "What were the main discussion points?";

// Get embeddings for the query
const queryEmbedding = await embeddings.embedQuery(query);

// Search Pinecone with the query embedding
const searchResults = await index.query({
    vector: queryEmbedding,
    topK: 3,  // Number of results to return
    includeMetadata: true,
});

// Extract and display the relevant chunks
console.log("Relevant chunks:");
searchResults.matches.forEach((match, i) => {
    console.log(`\nResult ${i + 1} (Score: ${match.score}):`);
    console.log(match?.metadata.text);
});

// 6. Augment with LLM for Summarization & Insights
const cohere = new Cohere({
    apiKey: "tnHSprBaFlhNbMhiog20Pi4ola0Fo2xMacaoGUTj"
});

// Prepare context from matched chunks
const context = searchResults.matches
    .map(match => match.metadata.text)
    .join("\n\n");

const prompt = `Based on the following meeting transcript excerpts, provide a concise summary of the main discussion points:

${context}

Summary:`;

const response = await cohere.generate(
    [prompt],
    {
        model: "command",
        maxTokens: 300,
        temperature: 0.7,
    }
);

console.log("\nAI Summary:");
console.log(response);
console.log(response.generations[0]);
