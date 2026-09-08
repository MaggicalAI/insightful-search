# Insightful Search

A tiny semantic-search pipeline for TXT and PDF documents. The app extracts text, splits it into chunks, creates embeddings with OpenAI or Gemini, stores the chunks locally as JSON, and returns the most relevant chunk for a user's question.

## Architecture

TXT/PDF -> text extraction -> chunking -> embeddings -> local JSON storage -> cosine similarity search -> relevant chunk in the frontend.

## Project Structure

- `backend/app.py` - Flask API used by the interface
- `backend/main.py` - optional terminal workflow
- `backend/document_loader.py` - TXT and PDF text extraction
- `backend/chunker.py` - overlapping text chunks
- `backend/embeddings.py` - OpenAI or Gemini embedding calls
- `backend/search.py` - cosine similarity search
- `backend/storage.py` - local JSON persistence
- `src/routes/index.tsx` - document upload and search interface

## Setup

Install frontend dependencies:

```sh
npm install
```

Install backend dependencies:

```sh
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Create environment files:

```sh
copy .env.example .env
copy backend\.env.example backend\.env
```

Set your API key in `backend/.env`:

```env
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
```

For Gemini instead:

```env
EMBEDDING_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
```

## Run Through The Interface

Start the Python API:

```sh
cd backend
.venv\Scripts\activate
python app.py
```

Start the frontend in another terminal:

```sh
npm run dev
```

Open the local Vite URL, upload a `.txt` or `.pdf`, then ask a question. The UI sends the file to `/index`, stores chunks and embeddings in `backend/data/embeddings.json`, then sends questions to `/search`.

## Run From The Terminal

```sh
cd backend
.venv\Scripts\activate
python main.py
```

Enter a document path, then ask questions in the prompt.

## GitHub

The project is ready to push once your remote is configured:

```sh
git add .
git commit -m "Build document semantic search pipeline"
git push
```

Do not commit `.env` files or `backend/data/embeddings.json`; they are ignored.
