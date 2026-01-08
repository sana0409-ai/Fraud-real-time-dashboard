import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type PredictionRequest, type PredictionResponse } from "@shared/schema";

export function usePredictFraud() {
  return useMutation({
    mutationFn: async (data: PredictionRequest) => {
      // Validate input before sending using the shared schema
      const validated = api.prediction.predict.input.parse(data);
      const baseUrl = import.meta.env.VITE_BACKEND_HTTP_URL || "https://fraud-backend.ashybeach-527389a2.eastus2.azurecontainerapps.io";
      
      const res = await fetch(`${baseUrl}/predict`, {
        method: api.prediction.predict.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        throw new Error("Prediction failed");
      }

      const responseData = await res.json();
      // Validate response using the shared schema
      return api.prediction.predict.responses[200].parse(responseData);
    },
  });
}
