import type { Express } from "express";
import { type Server } from "http";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const BACKEND_HTTP_URL = process.env.BACKEND_HTTP_URL || "https://fraud-backend.ashybeach-527389a2.eastus2.azurecontainerapps.io";

  // Health Check proxying the remote backend
  app.get(api.health.check.path, async (req, res) => {
    if (!BACKEND_HTTP_URL) {
      return res.status(500).json({ message: "BACKEND_HTTP_URL not configured" });
    }

    try {
      // Use the actual health endpoint of the remote backend
      const response = await fetch(`${BACKEND_HTTP_URL}/health`);
      if (!response.ok) {
        // Fallback to root if /health doesn't exist on remote
        const rootResponse = await fetch(BACKEND_HTTP_URL);
        if (!rootResponse.ok) {
           return res.status(rootResponse.status).send(await rootResponse.text());
        }
        const data = await rootResponse.json();
        return res.json(data);
      }
      const data = await response.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Remote backend unreachable" });
    }
  });

  // Proxy Prediction Endpoint to remote backend
  app.post(api.prediction.predict.path, async (req, res) => {
    if (!BACKEND_HTTP_URL) {
      return res.status(500).json({ message: "BACKEND_HTTP_URL not configured" });
    }

    try {
      // Ensure the path starts with /
      const path = api.prediction.predict.path.startsWith('/') 
        ? api.prediction.predict.path 
        : `/${api.prediction.predict.path}`;
      
      const response = await fetch(`${BACKEND_HTTP_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        const error = await response.text();
        return res.status(response.status).send(error);
      }

      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error("Proxy error:", err);
      res.status(500).json({ message: "Error communicating with remote backend" });
    }
  });

  // Copilot Search Endpoint - returns evidence for a transaction
  app.post(api.copilot.search.path, async (req, res) => {
    try {
      const { query, transaction } = api.copilot.search.input.parse(req.body);
      
      const mockEvidence = [
        {
          title: "Velocity Check",
          description: `${Math.floor(Math.random() * 5) + 2} transactions from ${transaction.device_os} devices in the last 24 hours`,
          score: Math.round(Math.random() * 60 + 20) / 100,
        },
        {
          title: "Fraud Probability Analysis",
          description: `Model scored this transaction at ${(transaction.fraud_probability * 100).toFixed(1)}% fraud probability`,
          score: transaction.fraud_probability,
        },
        {
          title: "Channel Risk Assessment",
          description: `${transaction.source} channel with ${transaction.payment_type} payment type shows ${transaction.risk_band === 'HIGH' ? 'elevated' : transaction.risk_band === 'MEDIUM' ? 'moderate' : 'normal'} risk patterns`,
          score: transaction.risk_band === 'HIGH' ? 0.85 : transaction.risk_band === 'MEDIUM' ? 0.55 : 0.2,
        },
      ];

      res.json({ evidence: mockEvidence });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.message });
      } else {
        console.error("Copilot search error:", err);
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  // Copilot Explain Endpoint - returns explanation for a transaction
  app.post(api.copilot.explain.path, async (req, res) => {
    try {
      const { query, mode, transaction } = api.copilot.explain.input.parse(req.body);
      
      let explanation: string;
      
      if (mode === "basic") {
        explanation = `This ${transaction.risk_band} risk transaction via ${transaction.source} shows a ${(transaction.fraud_probability * 100).toFixed(1)}% fraud probability. The system decision is to ${transaction.decision}. The transaction originated from a ${transaction.device_os} device using ${transaction.payment_type} payment method. Response latency was ${transaction.latency_ms.toFixed(2)}ms.`;
      } else {
        explanation = `**Risk Assessment Summary**\n\nThis transaction has been classified as ${transaction.risk_band} risk with a fraud probability of ${(transaction.fraud_probability * 100).toFixed(1)}%.\n\n• **Channel Analysis**: Transaction originated via ${transaction.source} channel. ${transaction.source === 'INTERNET' ? 'Online transactions have higher fraud rates compared to in-person.' : 'Alternative channels may have different risk profiles.'}\n\n• **Device Profile**: ${transaction.device_os} device detected. ${transaction.device_os === 'windows' || transaction.device_os === 'macintosh' ? 'Desktop device suggests deliberate transaction.' : 'Mobile or other device type may indicate varying legitimacy patterns.'}\n\n• **Payment Method**: ${transaction.payment_type} payment type. Cross-reference with historical patterns for this payment method is advised.\n\n• **Model Latency**: Response generated in ${transaction.latency_ms.toFixed(2)}ms, indicating ${transaction.latency_ms < 10 ? 'optimal' : 'acceptable'} system performance.\n\n**System Decision**: ${transaction.decision}\n\n**Recommendation**: ${transaction.risk_band === 'HIGH' ? 'Block or escalate for manual review due to high risk indicators.' : transaction.risk_band === 'MEDIUM' ? 'Review transaction details before approval. Consider additional verification.' : 'Transaction appears low risk. Approve with standard monitoring.'}`;
      }

      res.json({ explanation });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.message });
      } else {
        console.error("Copilot explain error:", err);
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  // Analyst Action Endpoint - proxy to external backend
  app.post(api.analyst.action.path, async (req, res) => {
    try {
      const { transactionId, action } = api.analyst.action.input.parse(req.body);
      
      const response = await fetch(`${BACKEND_HTTP_URL}/analyst/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: transactionId, action }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`Analyst action failed: ${error}`);
        return res.status(response.status).send(error);
      }

      const data = await response.json();
      res.json(data);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.message });
      } else {
        console.error("Analyst action error:", err);
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  return httpServer;
}
