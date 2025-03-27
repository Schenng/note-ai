Vibe coding to learn about deno, RAG w/ Cohere's models (embed-english-v3.0 and command), and Pinecone.

1. Load meeting notes from a file

2. Chunk meeting notes using a recursive character text splitter

3. Embed chunks into vectors using Cohere's embedding model (embed-english-v3.0)

4. Store Vectors in Pinecone

5. Create a query, embed it using Cohere's embedding model, retrieve relevant chunks from Pinecone.

6. Using Cohere's LLM model (command), augment it with the relvant chunks retreived from pinecone, and ask a summarization prompt.

Result: 

AI Summary:
```
{
  generations: [
    [
      {
        text: " CloudTech's Enterprise Analytics Suite may address data flow challenges arising from 500TB data volumes.  Sarah Johnson will send a full proposal, and a technical deep-dive meeting is scheduled for Tuesday.  Maria Chen joins the meeting and is welcomed by Sarah Johnson. "
      }
    ]
  ]
}
[
  {
    text: " CloudTech's Enterprise Analytics Suite may address data flow challenges arising from 500TB data volumes.  Sarah Johnson will send a full proposal, and a technical deep-dive meeting is scheduled for Tuesday.  Maria Chen joins the meeting and is welcomed by Sarah Johnson. "
  }
]
```