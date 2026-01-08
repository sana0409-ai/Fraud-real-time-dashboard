import { z } from 'zod';
import { predictionRequestSchema, predictionResponseSchema, analystActionSchema } from './schema';

const copilotTransactionSchema = z.object({
  event_id: z.union([z.string(), z.number()]),
  fraud_probability: z.number(),
  risk_band: z.string(),
  decision: z.string(),
  source: z.string(),
  device_os: z.string(),
  payment_type: z.string(),
  latency_ms: z.number(),
  timestamp: z.string(),
});

const copilotSearchRequestSchema = z.object({
  query: z.string(),
  transaction: copilotTransactionSchema,
});

const copilotExplainRequestSchema = z.object({
  query: z.string(),
  mode: z.enum(["basic", "analyst"]),
  transaction: copilotTransactionSchema,
});

const evidenceItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  score: z.number(),
});

export const api = {
  prediction: {
    predict: {
      method: 'POST' as const,
      path: '/predict',
      input: predictionRequestSchema,
      responses: {
        200: predictionResponseSchema,
      },
    },
  },
  analyst: {
    action: {
      method: 'POST' as const,
      path: '/api/analyst/action',
      input: analystActionSchema,
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },
  copilot: {
    search: {
      method: 'POST' as const,
      path: '/api/copilot/search',
      input: copilotSearchRequestSchema,
      responses: {
        200: z.object({ evidence: z.array(evidenceItemSchema) }),
      },
    },
    explain: {
      method: 'POST' as const,
      path: '/api/copilot/explain',
      input: copilotExplainRequestSchema,
      responses: {
        200: z.object({ explanation: z.string() }),
      },
    },
  },
  health: {
    check: {
      method: 'GET' as const,
      path: '/api/health',
      responses: {
        200: z.any(),
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
