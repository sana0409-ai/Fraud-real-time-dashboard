import os
from dotenv import load_dotenv

from openai import AzureOpenAI
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizedQuery
from azure.core.credentials import AzureKeyCredential as SearchKeyCredential

load_dotenv()

embeddings_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
chat_endpoint = os.getenv("AZURE_OPENAI_CHAT_ENDPOINT")
embeddings_key = os.getenv("OPENAI_API_KEY")
chat_key = os.getenv("AZURE_OPENAI_CHAT_KEY")
embeddings_deployment = os.getenv("AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT")
chat_deployment = os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT")
api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01")

search_endpoint = os.getenv("AZURE_SEARCH_ENDPOINT")
search_admin_key = os.getenv("AZURE_SEARCH_ADMIN_KEY")
index_name = os.getenv("AZURE_SEARCH_INDEX_NAME")

missing = [
    name for name, value in {
        "AZURE_OPENAI_ENDPOINT": embeddings_endpoint,
        "AZURE_OPENAI_CHAT_ENDPOINT": chat_endpoint,
        "OPENAI_API_KEY": embeddings_key,
        "AZURE_OPENAI_CHAT_KEY": chat_key,
        "AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT": embeddings_deployment,
        "AZURE_OPENAI_CHAT_DEPLOYMENT": chat_deployment,
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
    azure_endpoint=embeddings_endpoint,
    api_key=embeddings_key,
)

chat_client = AzureOpenAI(
    api_version=api_version,
    azure_endpoint=chat_endpoint,
    api_key=chat_key,
)

search_client = SearchClient(
    endpoint=search_endpoint,
    index_name=index_name,
    credential=SearchKeyCredential(search_admin_key),
)

def embed_query(text):
    result = embed_client.embeddings.create(
        model=embeddings_deployment,
        input=[text],
    )
    return result.data[0].embedding

def retrieve_docs(query_vector, k=3):
    results = search_client.search(
        search_text="",
        vector_queries=[
            VectorizedQuery(
                vector=query_vector,
                fields="contentVector",
                k_nearest_neighbors=k,
            )
        ],
        select=["id", "title", "description", "tags", "type", "severity", "created_at"],
    )
    return [r for r in results]

def build_prompt(user_query, docs):
    lines = [
        "You are given a user question and retrieved documents.",
        "Answer using only the documents. If they don't directly answer the question, summarize the most relevant incidents and explain their relevance.",
        "",
        f"Question: {user_query}",
        "",
        "Documents:",
    ]
    for i, doc in enumerate(docs, start=1):
        title = doc.get("title")
        description = doc.get("description")
        tags = doc.get("tags")
        doc_type = doc.get("type")
        severity = doc.get("severity")
        created_at = doc.get("created_at")
        lines.append(f"{i}. Title: {title}")
        lines.append(f"   Description: {description}")
        lines.append(f"   Type: {doc_type} | Severity: {severity} | Created: {created_at} | Tags: {tags}")
    return "\n".join(lines)

def explain(prompt: str):
    response = chat_client.chat.completions.create(
        model=chat_deployment,
        messages=[{"role": "user", "content": prompt}],
    )
    

    return response.choices[0].message.content

def explain_with_rag(user_query: str, k: int = 3):
    vector = embed_query(user_query)
    docs = retrieve_docs(vector, k=k)
    prompt = build_prompt(user_query, docs)
    return explain(prompt)

if __name__ == "__main__":
    answer = explain("How do I detect fraud in real-time?")
    print(answer)
