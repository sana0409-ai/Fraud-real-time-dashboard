import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, 
  Sparkles, 
  Check, 
  UserPlus, 
  ShieldX, 
  Loader2,
  AlertTriangle,
  FileText,
  Brain
} from "lucide-react";
import { type FraudEvent } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface CopilotTransaction {
  event_id: string | number;
  fraud_probability: number;
  risk_band: string;
  decision: string;
  source: string;
  device_os: string;
  payment_type: string;
  latency_ms: number;
  timestamp: string;
}

interface EvidenceItem {
  title: string;
  description: string;
  score: number;
}

interface AnalystCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  event: FraudEvent | null;
  onAction?: (eventId: string | number, action: "approve" | "escalate" | "block") => void;
}

export function AnalystCopilot({ isOpen, onClose, event, onAction }: AnalystCopilotProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"basic" | "analyst">("basic");
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [explanation, setExplanation] = useState<string>("");
  const [isLoadingEvidence, setIsLoadingEvidence] = useState(false);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const transaction: CopilotTransaction = event ? {
    event_id: event.id,
    fraud_probability: event.fraudProbability,
    risk_band: event.riskBand,
    decision: event.decision,
    source: event.source,
    device_os: event.deviceOs,
    payment_type: event.paymentType,
    latency_ms: event.latencyMs,
    timestamp: typeof event.timestamp === 'string' ? event.timestamp : new Date(event.timestamp).toISOString(),
  } : {
    event_id: "",
    fraud_probability: 0,
    risk_band: "",
    decision: "",
    source: "",
    device_os: "",
    payment_type: "",
    latency_ms: 0,
    timestamp: "",
  };

  const fetchEvidence = async () => {
    if (!event) return;
    setIsLoadingEvidence(true);
    try {
      const response = await fetch("/api/copilot/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `${transaction.risk_band} risk transaction via ${transaction.source} on ${transaction.device_os}`,
          transaction,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setEvidence(data.evidence || []);
      }
    } catch (err) {
      console.error("Failed to fetch evidence:", err);
    } finally {
      setIsLoadingEvidence(false);
    }
  };

  const fetchExplanation = async (selectedMode: "basic" | "analyst") => {
    if (!event) return;
    setIsLoadingExplanation(true);
    try {
      const response = await fetch("/api/copilot/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `${transaction.risk_band} risk transaction via ${transaction.source} on ${transaction.device_os}`,
          mode: selectedMode,
          transaction,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setExplanation(data.explanation || "");
      }
    } catch (err) {
      console.error("Failed to fetch explanation:", err);
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  useEffect(() => {
    if (isOpen && event) {
      fetchEvidence();
      fetchExplanation(mode);
    }
  }, [isOpen, event?.id]);

  const handleModeChange = (newMode: "basic" | "analyst") => {
    setMode(newMode);
    fetchExplanation(newMode);
  };

  const handleAction = async (action: "approve" | "escalate" | "block") => {
    if (!event) return;
    setActionLoading(action);
    try {
      if (onAction) {
        onAction(event.id, action);
      }
      toast({
        title: "Action Recorded",
        description: `Transaction has been ${action}d.`,
      });
      onClose();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to submit action.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return "text-red-400";
    if (score >= 0.4) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className={cn(
          "w-full sm:w-[400px] md:w-[420px] p-0 border-l-2 border-teal-500/50",
          "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950"
        )}
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-500/20">
                  <Sparkles className="h-5 w-5 text-teal-400" />
                </div>
                <SheetTitle className="text-lg font-semibold text-white">
                  Analyst Copilot
                </SheetTitle>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-white"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleModeChange("basic")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  mode === "basic"
                    ? "bg-teal-500/20 text-teal-400 ring-1 ring-teal-500/50"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                )}
              >
                Basic
              </button>
              <button
                onClick={() => handleModeChange("analyst")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  mode === "analyst"
                    ? "bg-teal-500/20 text-teal-400 ring-1 ring-teal-500/50"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                )}
              >
                Analyst
              </button>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div className="rounded-lg bg-white/5 p-4 border border-white/10">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-400" />
                  Transaction Summary
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Risk Band</span>
                    <p className={cn(
                      "font-semibold",
                      transaction.risk_band === "HIGH" ? "text-red-400" :
                      transaction.risk_band === "MEDIUM" ? "text-yellow-400" : "text-green-400"
                    )}>{transaction.risk_band}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Decision</span>
                    <p className="text-white capitalize">{transaction.decision.toLowerCase()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fraud Probability</span>
                    <p className="text-white font-mono">{(transaction.fraud_probability * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Latency</span>
                    <p className="text-white font-mono">{transaction.latency_ms.toFixed(2)}ms</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Source</span>
                    <p className="text-white">{transaction.source}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Device OS</span>
                    <p className="text-white">{transaction.device_os}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment Type</span>
                    <p className="text-white font-mono">{transaction.payment_type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Timestamp</span>
                    <p className="text-white font-mono text-xs">
                      {new Date(transaction.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div>
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  Evidence
                  {isLoadingEvidence && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                </h4>
                <div className="space-y-2">
                  {evidence.length === 0 && !isLoadingEvidence ? (
                    <p className="text-sm text-muted-foreground">No evidence found.</p>
                  ) : (
                    evidence.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="rounded-lg bg-white/5 p-3 border border-white/10"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{item.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn("shrink-0", getScoreColor(item.score))}
                          >
                            {(item.score * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div>
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-400" />
                  Explanation
                  {isLoadingExplanation && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                </h4>
                <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                  {isLoadingExplanation ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Generating explanation...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {explanation || "No explanation available."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-white/10 bg-black/20">
            <div className="flex items-center gap-2">
              <Button
                className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                disabled={actionLoading !== null}
                onClick={() => handleAction("approve")}
              >
                {actionLoading === "approve" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Approve
              </Button>
              <Button
                className="flex-1 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30"
                disabled={actionLoading !== null}
                onClick={() => handleAction("escalate")}
              >
                {actionLoading === "escalate" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Escalate
              </Button>
              <Button
                className="flex-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                disabled={actionLoading !== null}
                onClick={() => handleAction("block")}
              >
                {actionLoading === "block" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ShieldX className="h-4 w-4 mr-2" />
                )}
                Block
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
