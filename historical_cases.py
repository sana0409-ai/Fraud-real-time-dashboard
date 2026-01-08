# ---------------------------------------------
# Historical Fraud Cases for RAG Ingestion
# ---------------------------------------------

historical_cases_store = [
    {
        "case_id": "CASE-001",
        "summary": "Cross-border crypto purchase from high-risk country.",
        "details": "Customer located in US. Transaction originated in Nigeria. Merchant MCC 6051 (crypto). High-value purchase with no prior crypto history.",
        "decision": "Flagged as fraud due to high-risk country and unusual merchant type."
    },
    {
        "case_id": "CASE-002",
        "summary": "Rapid-fire card testing at digital goods merchant.",
        "details": "12 transactions under $5 within 3 minutes at a digital goods merchant. Customer had no prior history with this merchant category.",
        "decision": "Flagged as fraud due to velocity pattern consistent with card testing."
    },
    {
        "case_id": "CASE-003",
        "summary": "Legitimate travel purchase flagged due to geo distance.",
        "details": "Customer from Texas made a purchase in France. Travel itinerary confirmed in airline booking system.",
        "decision": "Marked legitimate after review; false positive due to travel."
    },
    {
        "case_id": "CASE-004",
        "summary": "Account takeover with device mismatch.",
        "details": "Login from new device in Russia followed by high-value purchases. Customer reported no travel and confirmed unauthorized activity.",
        "decision": "Confirmed fraud due to device mismatch and customer dispute."
    },
    {
        "case_id": "CASE-005",
        "summary": "Subscription renewal mistaken for fraud.",
        "details": "Three identical charges from a streaming service. Customer forgot they had multiple profiles billed separately.",
        "decision": "Marked legitimate; benign subscription behavior."
    },
    {
        "case_id": "CASE-006",
        "summary": "High-risk merchant with unusual spending spike.",
        "details": "Customer typically spends $50–$100 per week. Suddenly made a $2,000 purchase at a high-risk electronics merchant.",
        "decision": "Flagged as fraud due to spending anomaly and merchant risk."
    },
    {
        "case_id": "CASE-007",
        "summary": "Friendly fraud dispute.",
        "details": "Customer claimed unauthorized purchase at gaming merchant. IP, device, and location matched customer profile.",
        "decision": "Marked legitimate; likely friendly fraud."
    },
    {
        "case_id": "CASE-008",
        "summary": "Multiple cross-border attempts blocked.",
        "details": "Five failed attempts from Vietnam followed by a successful one. Customer confirmed no travel.",
        "decision": "Confirmed fraud due to repeated cross-border attempts."
    },
    {
        "case_id": "CASE-009",
        "summary": "Merchant category mismatch.",
        "details": "Transaction labeled as 'charity' but merchant MCC indicated 'adult entertainment'. Customer denied involvement.",
        "decision": "Flagged as fraud due to MCC mismatch and customer dispute."
    },
    {
        "case_id": "CASE-010",
        "summary": "Geo-distance anomaly with velocity.",
        "details": "Two transactions within 10 minutes: one in Texas, one in New York. Impossible travel time.",
        "decision": "Flagged as fraud due to impossible travel velocity."
    }
]