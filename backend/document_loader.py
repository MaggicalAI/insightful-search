from pathlib import Path

from pypdf import PdfReader


def extract_text(file_path: str) -> str:
    pages = extract_pages(file_path)
    return "\n".join(page["text"] for page in pages)


def extract_pages(file_path: str) -> list[dict]:
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".txt":
        return [{"page": 1, "text": path.read_text(encoding="utf-8")}]

    if suffix == ".pdf":
        reader = PdfReader(str(path))
        pages = []
        for page_number, page in enumerate(reader.pages, start=1):
            text = page.extract_text()
            if text:
                pages.append({"page": page_number, "text": text})
        return pages

    raise ValueError("Unsupported file type. Please upload a .txt or .pdf file.")
