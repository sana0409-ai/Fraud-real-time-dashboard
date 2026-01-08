from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional, Literal
import pandas as pd
import joblib
import time
import asyncio
from collections import deque
import os
import uuid

# ---------------------------
# RAG ENGINE IMPORTS
# ---------------------------
from rag_engine import explain, explain_with_rag, retrieve_docs, embed_query
from historical_cases import historical_cases_store

# ---------------------------
# MODEL / DATA CONFIG
# ---------------------------
MODEL_PATH = "model/xgb_fraud_model.joblib"
COLS_PATH = "model/feature_columns.joblib"
DATA_PATH = "data/transactions.csv"

SPIKE_ENABLED = os.getenv("SPIKE_ENABLED", "true").lower() == "true"
SPIKE_EVERY_SEC = float(os.getenv("SPIKE_EVERY_SEC", "20"))
SPIKE_BURST_COUNT = int(os.getenv("SPIKE_BURST_COUNT", "25"))
SPIKE_BURST_SLEEP = float(os.getenv("SPIKE_BURST_SLEEP", "0.08"))

model = joblib.load(MODEL_PATH)
feature_columns = joblib.load(COLS_PATH)

# ---------------------------
# APP & CORS
# ---------------------------
app = FastAPI(title="Real-Time Fraud Scoring + RAG API")

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN] if FRONTEND_ORIGIN != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# CONSTANTS
# ---------------------------
CAT_COLS = ["payment_type", "employment_status", "housing_status", "source", "device_os"]

# ---------------------------
# REQUEST MODELS
# ---------------------------
class PredictRequest(BaseModel):
    features: Dict[str, Any]


class Transaction(BaseModel):
    amount: float
    merchant: str
    country: str
    billing_zip: str
    transaction_zip: str
    timestamp: str


class ExplainRequest(BaseModel):
    query: str
    transaction: Optional[Transaction] = None
    case_id: Optional[str] = None  # optional link to a historical case
    mode: Optional[Literal["basic", "analyst"]] = "analyst"


class SearchRequest(BaseModel):
    query: str
    transaction: Optional[Transaction] = None


class AnalystActionRequest(BaseModel):
    event_id: str
    action: str
    notes: Optional[str] = None


# ---------------------------
# RAG CONTEXT BUILDERS
# ---------------------------
def build_rules_context(query: str) -> str:
    """
    Use Azure Search (backed by rag_knowledge_base.csv) to pull relevant rules/incidents.
    """
    vector = embed_query(query)
    docs = retrieve_docs(vector, k=5)

    lines = []
    for doc in docs:
        title = doc.get("title")
        description = doc.get("description")
        doc_type = doc.get("type")
        severity = doc.get("severity")
        tags = doc.get("tags")
        created_at = doc.get("created_at")

        lines.append(
            f"- [{doc_type} | severity={severity} | created={created_at} | tags={tags}]\n"
            f"  {title}: {description}"
        )

    if not lines:
        return "No specific rules or knowledge base entries were found for this query."

    return "Relevant Fraud Rules and Knowledge Base Entries:\n" + "\n".join(lines)


def build_transaction_context(tx: Optional[Transaction]) -> str:
    """
    Format transaction metadata for the LLM.
    """
    if not tx:
        return "No transaction details were provided."

    return f"""
Transaction Details:
- Amount: {tx.amount}
- Merchant: {tx.merchant}
- Country: {tx.country}
- Billing ZIP: {tx.billing_zip}
- Transaction ZIP: {tx.transaction_zip}
- Timestamp: {tx.timestamp}
"""


def build_historical_context(case_id: Optional[str], query: str) -> str:
    """
    Pull a specific historical case by ID (simple version).
    Later, you can extend this to similarity search over historical_cases_store.
    """
    if case_id:
        match = next((c for c in historical_cases_store if c["case_id"] == case_id), None)
        if match:
            return f"""Historical Case (ID: {match['case_id']}):
Summary: {match['summary']}
Details: {match['details']}
Decision: {match['decision']}
"""

    return "No specific historical case linked."


# ---------------------------
# FRAUD MODEL SCORING
# ---------------------------
def score_one(features: Dict[str, Any]) -> Dict[str, Any]:
    start = time.perf_counter()

    df = pd.DataFrame([features])

    for c in CAT_COLS:
        if c not in df.columns:
            df[c] = "unknown"

    df = pd.get_dummies(df, columns=CAT_COLS, drop_first=True)
    df = df.reindex(columns=feature_columns, fill_value=0)

    prob = float(model.predict_proba(df)[0][1])

    if prob >= 0.75:
        risk_band, decision = "HIGH", "BLOCK"
    elif prob >= 0.40:
        risk_band, decision = "MEDIUM", "REVIEW"
    else:
        risk_band, decision = "LOW", "ALLOW"

    latency_ms = (time.perf_counter() - start) * 1000.0

    return {
        "fraud_probability": round(prob, 4),
        "risk_band": risk_band,
        "decision": decision,
        "latency_ms": round(latency_ms, 2),
    }


# ---------------------------
# BASIC ENDPOINTS
# ---------------------------
@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"status": "running"}


@app.post("/predict")
def predict(req: PredictRequest):
    return score_one(req.features)


# ---------------------------
# UPDATED RAG SEARCH ENDPOINT
# ---------------------------
@app.post("/search")
def search_rag(req: SearchRequest):
    """
    Hybrid search:
    - Uses the user query
    - Optionally enriches the query with transaction metadata
    - Retrieves from Azure Search
    """
    combined_query = req.query
    if req.transaction:
        combined_query += (
            f" country={req.transaction.country}"
            f" merchant={req.transaction.merchant}"
            f" amount={req.transaction.amount}"
        )

    vector = embed_query(combined_query)
    docs = retrieve_docs(vector, k=10)

    cleaned = []
    for doc in docs:
        cleaned.append({
            "id": doc.get("id"),
            "title": doc.get("title"),
            "description": doc.get("description"),
            "tags": doc.get("tags"),
            "type": doc.get("type"),
            "severity": doc.get("severity"),
            "created_at": doc.get("created_at"),
            "score": doc.get("@search.score"),
        })
    return {"results": cleaned}


# ---------------------------
# UPDATED ANALYST-LEVEL EXPLAIN ENDPOINT
# ---------------------------
@app.post("/explain")
def explain_rag(req: ExplainRequest):
    """
    Full analyst-level explanation:
    - Fraud rules and KB from Azure Search (rag_knowledge_base.csv)
    - Transaction metadata
    - Historical fraud cases
    - Passed as a single prompt into rag_engine.explain(prompt)
    """
    mode = (req.mode or "analyst").strip().lower()
    if mode not in {"basic", "analyst"}:
        return {"error": "Invalid mode. Use 'basic' or 'analyst'."}

    if mode == "basic":
        result = explain_with_rag(req.query, k=5)
        return {"explanation": result, "mode": "basic"}

    rules_context = build_rules_context(req.query)
    tx_context = build_transaction_context(req.transaction)
    historical_context = build_historical_context(req.case_id, req.query)

    prompt = f"""
You are a senior fraud analyst for a real-time fraud detection system.

User Question:
{req.query}

{tx_context}

{rules_context}

Historical Context:
{historical_context}

Task:
1. Explain clearly why this transaction was likely flagged (or not) based on the rules, knowledge base, and transaction details.
2. Reference specific rules, patterns, or historical cases when possible.
3. If the decision is uncertain, say so and explain what additional data would help.
4. Use concise, human-readable language suitable for an internal fraud operations dashboard.
"""

    result = explain(prompt)  # rag_engine.explain(prompt) -> pure LLM call
    return {"explanation": result, "mode": "analyst"}


# ---------------------------
# STREAMING + ANALYST ACTIONS
# ---------------------------
clients: List[WebSocket] = []
last_60s_scores = deque()
last_60s_latency = deque()
recent_events = deque(maxlen=50)

analyst_actions = deque(maxlen=500)
action_by_event_id: Dict[str, Dict[str, Any]] = {}


def compute_kpis(now: float) -> Dict[str, Any]:
    while last_60s_scores and (now - last_60s_scores[0][0]) > 60:
        last_60s_scores.popleft()
    while last_60s_latency and (now - last_60s_latency[0][0]) > 60:
        last_60s_latency.popleft()

    txn_count = len(last_60s_scores)
    high = sum(1 for _, r in last_60s_scores if r == "HIGH")
    med = sum(1 for _, r in last_60s_scores if r == "MEDIUM")

    avg_latency = (
        sum(v for _, v in last_60s_latency) / len(last_60s_latency)
        if last_60s_latency else 0.0
    )

    return {
        "txn_per_min": txn_count,
        "alerts_per_min": high + med,
        "high_risk_pct": round((high / txn_count) * 100, 2) if txn_count else 0.0,
        "avg_latency_ms": round(avg_latency, 2),
    }


async def broadcast(payload: Dict[str, Any]):
    dead = []
    for ws in clients:
        try:
            await ws.send_json(payload)
        except Exception:
            dead.append(ws)
    for ws in dead:
        if ws in clients:
            clients.remove(ws)


@app.post("/analyst/action")
async def analyst_action(req: AnalystActionRequest):
    action = req.action.upper().strip()
    if action not in {"APPROVE", "ESCALATE", "BLOCK"}:
        return {"ok": False, "error": "Invalid action"}

    now = time.time()
    record = {
        "ts": now,
        "event_id": req.event_id,
        "action": action,
        "notes": req.notes,
    }

    analyst_actions.appendleft(record)
    action_by_event_id[req.event_id] = record

    for ev in recent_events:
        if ev.get("event_id") == req.event_id:
            ev["analyst_action"] = action
            break

    await broadcast({
        "type": "action_update",
        "record": record
    })

    return {"ok": True, "record": record}


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    clients.append(ws)
    try:
        now = time.time()
        await ws.send_json({
            "type": "snapshot",
            "kpis": compute_kpis(now),
            "recent_events": list(recent_events),
            "analyst_actions": list(analyst_actions),
        })
        while True:
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        if ws in clients:
            clients.remove(ws)


# ---------------------------
# STARTUP: REPLAY LOOP
# ---------------------------
@app.on_event("startup")
async def startup():
    asyncio.create_task(start_replay_after_delay())


async def start_replay_after_delay():
    await asyncio.sleep(5)
    asyncio.create_task(replay_loop())


async def replay_loop():
    df = pd.read_csv(DATA_PATH)

    fraud_rows = []
    if "fraud_bool" in df.columns:
        fraud_rows = df[df["fraud_bool"] == 1].to_dict(orient="records")

    all_rows = df.to_dict(orient="records")

    i = 0
    last_spike = 0.0

    while True:
        now = time.time()
        do_spike = SPIKE_ENABLED and (now - last_spike) >= SPIKE_EVERY_SEC

        if do_spike:
            last_spike = now

            await broadcast({
                "type": "spike",
                "status": "start",
                "burst_count": SPIKE_BURST_COUNT,
                "ts": now
            })

            for j in range(SPIKE_BURST_COUNT):
                if fraud_rows:
                    row = fraud_rows[(j + int(now)) % len(fraud_rows)]
                else:
                    row = all_rows[(j + int(now)) % len(all_rows)]

                row = dict(row)
                row.pop("fraud_bool", None)

                scored = score_one(row)
                ts = time.time()

                last_60s_scores.append((ts, scored["risk_band"]))
                last_60s_latency.append((ts, scored["latency_ms"]))

                event_id = str(uuid.uuid4())
                analyst_rec = action_by_event_id.get(event_id)

                event = {
                    "event_id": event_id,
                    "analyst_action": analyst_rec["action"] if analyst_rec else None,
                    "ts": ts,
                    "risk_band": scored["risk_band"],
                    "decision": scored["decision"],
                    "fraud_probability": scored["fraud_probability"],
                    "latency_ms": scored["latency_ms"],
                    "proposed": row.get("proposed", None),
                    "source": row.get("source", None),
                    "device_os": row.get("device_os", None),
                    "payment_type": row.get("payment_type", None),
                }
                recent_events.appendleft(event)

                await broadcast({
                    "type": "tick",
                    "kpis": compute_kpis(ts),
                    "event": event,
                    "spike": True
                })

                await asyncio.sleep(SPIKE_BURST_SLEEP)

            await broadcast({
                "type": "spike",
                "status": "end",
                "ts": time.time()
            })

            await asyncio.sleep(1.0)
            continue

        row = df.iloc[i].to_dict()
        row.pop("fraud_bool", None)

        scored = score_one(row)
        ts = time.time()

        last_60s_scores.append((ts, scored["risk_band"]))
        last_60s_latency.append((ts, scored["latency_ms"]))

        event_id = str(uuid.uuid4())
        analyst_rec = action_by_event_id.get(event_id)

        event = {
            "event_id": event_id,
            "analyst_action": analyst_rec["action"] if analyst_rec else None,
            "ts": ts,
            "risk_band": scored["risk_band"],
            "decision": scored["decision"],
            "fraud_probability": scored["fraud_probability"],
            "latency_ms": scored["latency_ms"],
            "proposed": row.get("proposed", None),
            "source": row.get("source", None),
            "device_os": row.get("device_os", None),
            "payment_type": row.get("payment_type", None),
        }
        recent_events.appendleft(event)

        await broadcast({
            "type": "tick",
            "kpis": compute_kpis(ts),
            "event": event,
            "spike": False
        })

        i = (i + 1) % len(df)
        await asyncio.sleep(0.5)
