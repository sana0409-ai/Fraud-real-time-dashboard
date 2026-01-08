import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, RotateCcw, Activity } from "lucide-react";
import { usePredictFraud } from "@/hooks/use-prediction";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DEFAULT_PAYLOAD = JSON.stringify({
  features: {
    income: 50000,
    name_email_similarity: 0.8,
    prev_address_months_count: 24,
    current_address_months_count: 12,
    customer_age: 35,
    days_since_request: 5,
    intended_balcon_amount: 1000,
    zip_count_4w: 10,
    velocity_6h: 2,
    velocity_24h: 5,
    payment_type: "credit_card",
    employment_status: "employed",
    housing_status: "rent",
    source: "web",
    device_os: "windows"
  }
}, null, 2);

export function PredictionPanel() {
  const [jsonInput, setJsonInput] = useState(DEFAULT_PAYLOAD);
  const [error, setError] = useState<string | null>(null);
  const predictMutation = usePredictFraud();

  const handlePredict = async () => {
    try {
      setError(null);
      const parsed = JSON.parse(jsonInput);
      const baseUrl = import.meta.env.VITE_BACKEND_HTTP_URL || "https://fraud-backend.ashybeach-527389a2.eastus2.azurecontainerapps.io";
      
      const response = await fetch(`${baseUrl}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      // Handle the data appropriately - the mutation already exists but we're forcing direct fetch for clarity as requested
      // We can just use the existing mutation or update it. 
      // For now, let's just use the mutation but fix the underlying fetch logic in the hook.
      await predictMutation.mutateAsync(parsed);
    } catch (err: any) {
      setError(err.message || "Invalid JSON format");
    }
  };

  const handleReset = () => {
    setJsonInput(DEFAULT_PAYLOAD);
    predictMutation.reset();
    setError(null);
  };

  return (
    <Card className="h-full flex flex-col bg-card/50 border-white/5 backdrop-blur-sm shadow-xl overflow-hidden">
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Test Model Prediction
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
        <div className="flex-1 relative">
          <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="h-full font-mono text-xs bg-black/40 border-white/10 resize-none focus:ring-primary/20"
            placeholder="Paste JSON features here..."
            spellCheck={false}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
            {error}
          </div>
        )}

        {predictMutation.data && (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Decision</span>
              <Badge 
                variant={predictMutation.data.decision === "block" ? "destructive" : "default"}
                className="uppercase tracking-wider"
              >
                {predictMutation.data.decision}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Risk Band</span>
              <span className={cn(
                "font-bold uppercase text-sm",
                predictMutation.data.risk_band === "high" ? "text-red-500" :
                predictMutation.data.risk_band === "medium" ? "text-yellow-500" : "text-green-500"
              )}>
                {predictMutation.data.risk_band}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Probability</span>
              <span className="font-mono font-bold text-foreground">
                {(predictMutation.data.fraud_probability * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button 
            onClick={handlePredict} 
            disabled={predictMutation.isPending}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25"
          >
            {predictMutation.isPending ? "Analyzing..." : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Prediction
              </>
            )}
          </Button>
          <Button variant="outline" size="icon" onClick={handleReset} title="Reset">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
