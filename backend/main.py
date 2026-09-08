from pathlib import Path

from dotenv import load_dotenv

from chunker import chunk_text
from document_loader import extract_text
from embeddings import create_embedding
from search import find_best_chunk
from storage import load_records, save_records

load_dotenv()


def index_file(file_path: str) -> list[dict]:
    text = extract_text(file_path)
    chunks = chunk_text(text)

    if not chunks:
        raise ValueError("No text could be extracted from this document.")

    records = [
        {
            "index": index,
            "text": chunk,
            "embedding": create_embedding(chunk),
            "source": Path(file_path).name,
        }
        for index, chunk in enumerate(chunks)
    ]
    save_records(records)
    return records


def main() -> None:
    file_path = input("Document path (.txt or .pdf): ").strip()
    records = index_file(file_path)
    print(f"Indexed {len(records)} chunks.")

    while True:
        question = input("\nAsk a question, or type 'exit': ").strip()
        if question.lower() in {"exit", "quit"}:
            break

        result = find_best_chunk(question, load_records())
        print(f"\nBest match, chunk {result['index'] + 1}, score {result['score']:.4f}:")
        print(result["chunk"])


if __name__ == "__main__":
    main()
