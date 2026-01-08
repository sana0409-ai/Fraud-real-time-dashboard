import os
from dotenv import load_dotenv

from openai import AzureOpenAI
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizedQuery
from azure.core.credentials import AzureKeyCredential as SearchKeyCredential

load_dotenv()

endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
api_key = os.getenv("OPENAI_API_KEY")
deployment_name = os.getenv("AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT")
api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01")

search_endpoint = os.getenv("AZURE_SEARCH_ENDPOINT")
search_admin_key = os.getenv("AZURE_SEARCH_ADMIN_KEY")
index_name = os.getenv("AZURE_SEARCH_INDEX_NAME")

missing = [
    name for name, value in {
        "AZURE_OPENAI_ENDPOINT": endpoint,
        "OPENAI_API_KEY": api_key,
        "AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT": deployment_name,
        "AZURE_SEARCH_ENDPOINT": search_endpoint,
        "AZURE_SEARCH_ADMIN_KEY": search_admin_key,
        "AZURE_SEARCH_INDEX_NAME": index_name,
    }.items()
    if not value
]
if missing:
    raise RuntimeError(f"Missing required env vars: {', '.join(missing)}")

embed_client = AzureOpenAI(
    api_version=api_version,
    azure_endpoint=endpoint,
    api_key=api_key,
)

search_client = SearchClient(
    endpoint=search_endpoint,
    index_name=index_name,
    credential=SearchKeyCredential(search_admin_key),
)


def embed_query(text):
    result = embed_client.embeddings.create(
        model=deployment_name,
        input=[text],
    )
    return result.data[0].embedding


def vector_search(query):
    vector = embed_query(query)

    results = search_client.search(
        search_text="",
        vector_queries=[
            VectorizedQuery(
                vector=vector,
                fields="contentVector",
                k_nearest_neighbors=3,
            )
        ],
    )

    for r in results:
        print("----")
        print("Score:", r["@search.score"])
        print("Title:", r.get("title"))
        print("ID:", r.get("id"))


if __name__ == "__main__":
    vector_search("How do I detect fraud in real-time?")
