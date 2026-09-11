# Insightful Search

Insightful Search is a web application for semantic document search. Users can upload a PDF or TXT file, ask natural-language questions, and receive the most relevant passage from the indexed document.

The project demonstrates a complete retrieval workflow: document ingestion, text extraction, chunking, embedding generation, similarity search, and a browser-based question interface.

## Features

- Upload and index PDF or TXT documents
- Extract text from documents, including page metadata for PDFs
- Split documents into searchable text chunks
- Generate embeddings with OpenAI or Gemini
- Search indexed content using semantic similarity
- Return the best matching passage through a clean web interface
- Expose a small Flask API for document indexing and search

## Architecture

```text
document upload
  -> text extraction
  -> chunking
  -> embedding generation
  -> local vector storage
  -> semantic search
  -> relevant passage response
```

The frontend is built with React, TanStack Router, Vite, and Tailwind CSS. The backend is built with Flask and handles file processing, embeddings, storage, and search.

## Project Structure

```text
backend/
  app.py              Flask API
  document_loader.py  PDF and TXT extraction
  chunker.py          Text chunking
  embeddings.py       OpenAI and Gemini embedding clients
  search.py           Similarity search
  storage.py          Local embedding persistence
  main.py             Optional CLI workflow

src/
  routes/index.tsx    Upload and search interface
```

## Getting Started

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

Create environment files:

```sh
cd ..
copy .env.example .env
copy backend\.env.example backend\.env
```

Add an embedding provider key in `backend/.env`.

OpenAI example:

```env
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

Gemini example:

```env
EMBEDDING_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_EMBEDDING_MODEL=text-embedding-004
```

## Running Locally

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

Open the local URL shown by Vite, upload a document, wait for indexing to complete, and ask a question about the file.

## API

```text
POST /index   Upload and index a document
POST /search  Search the indexed document
GET /health   Check backend health
```

## Storage

Indexed chunks and embeddings are stored locally in:

```text
backend/data/embeddings.json
```

The stored data includes text chunks, embedding vectors, and PDF page numbers where available.

## Example Questions

```text
What is this document about?
Explain the first page.
What are the main requirements?
Which section discusses implementation details?
```
