import math
import re

from embeddings import create_embedding


def cosine_similarity(first: list[float], second: list[float]) -> float:
    dot_product = sum(a * b for a, b in zip(first, second))
    first_norm = math.sqrt(sum(a * a for a in first))
    second_norm = math.sqrt(sum(b * b for b in second))

    if first_norm == 0 or second_norm == 0:
        return 0.0

    return dot_product / (first_norm * second_norm)


def find_best_chunk(question: str, records: list[dict]) -> dict:
    if not records:
        raise ValueError("No document has been indexed yet.")

    page_number = _requested_page_number(question)
    if page_number is not None:
        page_records = [record for record in records if record.get("page") == page_number]
        if page_records:
            return _format_result(page_records[0], 1.0)

    question_embedding = create_embedding(question)
    best_record = None
    best_score = -1.0

    for record in records:
        score = cosine_similarity(question_embedding, record["embedding"])
        if score > best_score:
            best_record = record
            best_score = score

    if best_record is None:
        raise ValueError("No matching chunk was found.")

    return _format_result(best_record, best_score)


def _requested_page_number(question: str) -> int | None:
    normalized = question.lower()

    if "first page" in normalized or "page one" in normalized:
        return 1

    match = re.search(r"\bpage(?:\s+number|\s+no\.?)?\s+(\d+)\b", normalized)
    if match:
        return int(match.group(1))

    return None


def _format_result(record: dict, score: float) -> dict:
    return {
        "chunk": record["text"],
        "index": record["index"],
        "page": record.get("page"),
        "score": round(score, 4),
    }
