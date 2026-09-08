def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    clean_text = " ".join(text.split())

    if not clean_text:
        return []

    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")

    chunks = []
    start = 0

    while start < len(clean_text):
        end = start + chunk_size
        chunks.append(clean_text[start:end])
        start += chunk_size - overlap

    return chunks
