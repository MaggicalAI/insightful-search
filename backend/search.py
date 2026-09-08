import math

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

    return {
        "chunk": best_record["text"],
        "index": best_record["index"],
        "score": round(best_score, 4),
    }
