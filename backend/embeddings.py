import os

from dotenv import load_dotenv
from google import genai
from openai import OpenAI

load_dotenv()

OPENAI_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
GEMINI_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "text-embedding-004")


def create_embedding(text: str, provider: str | None = None) -> list[float]:
    selected_provider = (provider or os.getenv("EMBEDDING_PROVIDER", "openai")).lower()

    if selected_provider == "gemini":
        return _create_gemini_embedding(text)

    if selected_provider == "openai":
        return _create_openai_embedding(text)

    raise ValueError("EMBEDDING_PROVIDER must be 'openai' or 'gemini'.")


def _create_openai_embedding(text: str) -> list[float]:
    if not os.getenv("OPENAI_API_KEY"):
        raise RuntimeError("OPENAI_API_KEY is missing. Add it to your .env file.")

    client = OpenAI()
    response = client.embeddings.create(model=OPENAI_MODEL, input=text)
    return response.data[0].embedding


def _create_gemini_embedding(text: str) -> list[float]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is missing. Add it to your .env file.")

    client = genai.Client(api_key=api_key)
    response = client.models.embed_content(model=GEMINI_MODEL, contents=text)
    return list(response.embeddings[0].values)
