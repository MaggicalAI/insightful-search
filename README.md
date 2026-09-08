# Insightful Search

Insightful Search is a small document search app.

You upload a PDF or TXT file, ask a question, and the app returns the most relevant passage from the document.

It is a simple version of the retrieval part of a RAG system.

## What It Does

1. Reads a PDF or TXT file.
2. Extracts the text.
3. Splits the text into smaller chunks.
4. Creates an embedding for each chunk using OpenAI or Gemini.
5. Saves the chunks and embeddings in a local JSON file.
6. Embeds the user's question.
7. Finds the closest matching chunk.
8. Shows the best passage in the web interface.

## Why This Exists

The goal of this project is to show the basic building blocks behind document search with AI.

Instead of asking an AI model to read the whole file every time, the document is prepared first:

```text
document -> text -> chunks -> embeddings -> local storage
```

Then each question follows this flow:

```text
question -> embedding -> similarity search -> best matching chunk
```

## Project Structure

```text
backend/
  app.py              Flask API for the frontend
  main.py             Optional terminal version
  document_loader.py  Reads TXT and PDF files
  chunker.py          Splits text into chunks
  embeddings.py       Calls OpenAI or Gemini
  search.py           Finds the closest chunk
  storage.py          Saves and loads local JSON data
  data/               Local embeddings storage

src/
  routes/index.tsx    Upload and chat interface
```

## Setup

Install the frontend dependencies:

```sh
npm install
```

Create and activate the Python environment:

```sh
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Create the environment files:

```sh
cd ..
copy .env.example .env
copy backend\.env.example backend\.env
```

Open `backend/.env` and add your API key:

```env
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=your_real_openai_api_key_here
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

Gemini can also be used instead:

```env
EMBEDDING_PROVIDER=gemini
GEMINI_API_KEY=your_real_gemini_api_key_here
GEMINI_EMBEDDING_MODEL=text-embedding-004
```

Do not commit `.env` files. They are for local secrets only.

## Run The App

Start the backend:

```sh
cd backend
.venv\Scripts\activate
python app.py
```

Start the frontend in a second terminal:

```sh
npm run dev
```

Open the local URL shown by Vite.

Then:

1. Attach a PDF or TXT file.
2. Wait for the document to finish indexing.
3. Ask a question.
4. Read the best matching passage.

## Local Storage

The app stores the indexed chunks here:

```text
backend/data/embeddings.json
```

That file contains:

- the text chunks
- the embedding vectors
- page numbers for PDF chunks

This is enough for the assignment because it proves the search pipeline works without needing a full database.

For a production app, this would usually move to PostgreSQL with pgvector, Pinecone, Qdrant, Chroma, or another vector database.

## Example Questions

```text
What is this document about?
Explain the first page.
What are the submission requirements?
What does the Python task ask for?
```

Page-specific questions work because PDF chunks keep their page number.

## API Endpoints

The frontend uses two main backend routes:

```text
POST /index   upload and index a document
POST /search  ask a question and return the best chunk
```

There is also a health route:

```text
GET /health
```

## Production Notes

This project is intentionally simple. To make it production-ready, the next steps would be:

- add user accounts
- store files in cloud storage
- move embeddings from JSON to a vector database
- process large documents in background jobs
- add stronger error handling
- add tests for upload, chunking, embedding, and search
- deploy the frontend and backend separately

## GitHub

Before pushing, make sure `.env` and local embedding data are not committed.

Then run:

```sh
git add .
git commit -m "Build document semantic search app"
git push
```
