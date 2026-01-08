import os
from dotenv import load_dotenv

from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential as SearchKeyCredential
from openai import AzureOpenAI

from upload_rag_data import load_csv

# Load .env variables
load_dotenv()

# -----------------------------
# Azure OpenAI Embeddings Client
# -----------------------------
endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
api_key = os.getenv("OPENAI_API_KEY")
deployment_name = os.getenv("AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT", "fraud-embed")
api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01")

embed_client = AzureOpenAI(
    api_version=api_version,
    azure_endpoint=endpoint,
    api_key=api_key
)

# -----------------------------
# Azure Search config
# -----------------------------
search_endpoint = os.getenv("AZURE_SEARCH_ENDPOINT", "https://fraudsearch00.search.windows.net")
admin_key = os.getenv("AZURE_SEARCH_ADMIN_KEY")
index_name = "fraud-rag-index-v2"

search_client = SearchClient(
    endpoint=search_endpoint,
    index_name=index_name,
    credential=SearchKeyCredential(admin_key)
)

# -----------------------------
# Embedding function (Foundry)
# -----------------------------
def embed_batch(texts):
    result = embed_client.embeddings.create(
        model=deployment_name,
        input=texts
    )
    return result.data[0].embedding if len(texts) == 1 else [item.embedding for item in result.data]

# -----------------------------
# Upload to Azure Search
# -----------------------------
def upload_documents(docs):
    batch = []
    for doc in docs:
        batch.append(doc)
        if len(batch) == 10:
            search_client.upload_documents(documents=batch)
            batch = []
    if batch:
        search_client.upload_documents(documents=batch)

# -----------------------------
# Main
# -----------------------------
def main():
    rows = load_csv("data/rag_knowledge_base.csv")
    contents = [r["content"] for r in rows]

    print(f"Embedding {len(contents)} rows...")

    vectors = embed_batch(contents)

    for i, row in enumerate(rows):
        row["contentVector"] = vectors[i]
        del row["content"]

    upload_documents(rows)
    print(f"Uploaded {len(rows)} documents to Azure Search")

if __name__ == "__main__":
    main()