import os
from dotenv import load_dotenv

from openai import AzureOpenAI

# Load env vars
load_dotenv()

endpoint = os.getenv("AZURE_OPENAI_CHAT_ENDPOINT")
api_key = os.getenv("AZURE_OPENAI_CHAT_KEY")
deployment_name = os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT")
api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01")

missing = [
    name for name, value in {
        "AZURE_OPENAI_CHAT_ENDPOINT": endpoint,
        "AZURE_OPENAI_CHAT_KEY": api_key,
        "AZURE_OPENAI_CHAT_DEPLOYMENT": deployment_name,
    }.items()
    if not value
]
if missing:
    raise RuntimeError(f"Missing required env vars: {', '.join(missing)}")

print("Endpoint:", endpoint)

client = AzureOpenAI(
    api_version=api_version,
    azure_endpoint=endpoint,
    api_key=api_key,
)

def test_chat():
    response = client.chat.completions.create(
        model=deployment_name,
        messages=[
            {
                "role": "user",
                "content": "In one sentence, explain what real-time fraud detection is.",
            }
        ],
    )

    print("Model reply:\n", response.choices[0].message.content)

if __name__ == "__main__":
    test_chat()
