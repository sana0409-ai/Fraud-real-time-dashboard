
#  Fraud Real-Time Dashboard — Backend  
**FastAPI · RAG · Azure OpenAI · Azure Cognitive Search**

**Dashboard Link**

https://fraud-monitoring-dashboard--sanataj0409.replit.app


[![FastAPI](https://img.shields.io/badge/FastAPI-async-009688?logo=fastapi&logoColor=white)]  
[![Docker](https://img.shields.io/badge/Docker-containerized-2496ED?logo=docker&logoColor=white)]  
[![Azure](https://img.shields.io/badge/Azure-Container%20Apps-0078D4?logo=microsoftazure&logoColor=white)]

The **Fraud Real-Time Dashboard Backend** is a cloud-native FastAPI microservice that delivers **real-time fraud explanations** using **Retrieval-Augmented Generation (RAG)**.  
It combines **semantic search** (Azure Cognitive Search) with **LLM reasoning** (Azure OpenAI) to support fraud analysts with fast, explainable insights.

Deployed on **Azure Container Apps**, fully containerized, and built for scale.

---

##  What This Service Does

-  Performs **semantic search** over historical fraud cases  
-  Generates **LLM-powered fraud explanations** using RAG  
-  Ingests structured fraud case data  
-  Exposes clean REST APIs for frontend dashboards  
-  Runs in a scalable, event-driven Azure environment  

---

##  Architecture (High-Level)

```text
Frontend Dashboard
        ↓
FastAPI Backend (this repo)
        ↓
RAG Engine
        ↓
Azure Cognitive Search (retrieval)
        ↓
Azure OpenAI (chat + embeddings)

pip install -r requirements.txt

uvicorn app:app --host 0.0.0.0 --port 8000 --reload

curl http://localhost:8000/health

docker build -t fraud-backend:v8 .
docker run -p 8000:8000 fraud-backend:v8

docker build -t fraud-backend:v8 .
docker tag fraud-backend:v8 fraudacrsana123.azurecr.io/fraud-backend:v8
docker push fraudacrsana123.azurecr.io/fraud-backend:v8

az containerapp registry set \
  --name fraud-backend \
  --resource-group fraud-realtime-rg \
  --server fraudacrsana123.azurecr.io
Deploy image (new revision)
az containerapp update \
  --name fraud-backend \
  --resource-group fraud-realtime-rg \
  --image fraudacrsana123.azurecr.io/fraud-backend:v8 \
  --revision-suffix v8fix
Fraud Case Ingestion (RAG Source)
historical_cases.py
Production Health Endpoint - https://fraud-backend.ashybeach-527389a2.eastus2.azurecontainerapps.io/health
Focused on real-time intelligence, explainability, and clean system design.
