import os
import tempfile
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename

from chunker import chunk_text
from document_loader import extract_text
from embeddings import create_embedding
from search import find_best_chunk
from storage import load_records, save_records

ALLOWED_EXTENSIONS = {".pdf", ".txt"}

app = Flask(__name__)
CORS(app, origins=os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"))


def _error(message: str, status_code: int = 400):
    return jsonify({"error": message}), status_code


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/index")
def index_document():
    uploaded_file = request.files.get("file")

    if uploaded_file is None or uploaded_file.filename == "":
        return _error("Please upload a TXT or PDF file.")

    filename = secure_filename(uploaded_file.filename)
    suffix = Path(filename).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        return _error("Unsupported file type. Please upload a .txt or .pdf file.")

    with tempfile.TemporaryDirectory() as temp_dir:
        file_path = Path(temp_dir) / filename
        uploaded_file.save(file_path)

        try:
            text = extract_text(str(file_path))
            chunks = chunk_text(text)
            if not chunks:
                return _error("No text could be extracted from this document.")

            records = [
                {
                    "index": index,
                    "text": chunk,
                    "embedding": create_embedding(chunk),
                    "source": filename,
                }
                for index, chunk in enumerate(chunks)
            ]
            save_records(records)
        except Exception as exc:
            return _error(str(exc), 500)

    return jsonify(
        {
            "filename": filename,
            "chunks": len(records),
            "size": uploaded_file.content_length or 0,
        }
    )


@app.post("/search")
def search_document():
    payload = request.get_json(silent=True) or {}
    question = str(payload.get("question", "")).strip()

    if not question:
        return _error("Question is required.")

    try:
        result = find_best_chunk(question, load_records())
    except Exception as exc:
        return _error(str(exc), 500)

    return jsonify(result)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "8000")), debug=True)
