import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type FraudEvent } from "@shared/schema";
import { format } from "date-fns";
import { AlertCircle, CheckCircle, ShieldAlert, ShieldX, UserPlus, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AnalystCopilot } from "./AnalystCopilot";

interface EventsTableProps {
  events: FraudEvent[];
}

export function EventsTable({ events }: EventsTableProps) {
  const { toast } = useToast();
  const [localActions, setLocalActions] = useState<Record<string | number, string>>({});
  const [loadingIds, setLoadingIds] = useState<Set<string | number>>(new Set());
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<FraudEvent | null>(null);

  const openCopilot = (event: FraudEvent) => {
    setSelectedEvent(event);
    setCopilotOpen(true);
  };

  const handleCopilotAction = (eventId: string | number, action: "approve" | "escalate" | "block") => {
    handleAnalystAction(eventId, action);
  };

  const handleAnalystAction = async (transactionId: string | number, action: "approve" | "escalate" | "block") => {
    setLoadingIds(prev => new Set(prev).add(transactionId));
    try {
      const response = await fetch("/api/analyst/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, action }),
      });

      if (!response.ok) throw new Error("Failed to submit action");

      setLocalActions(prev => ({ ...prev, [transactionId]: action }));
      toast({
        title: "Action Recorded",
        description: `Transaction ${transactionId} has been ${action}d.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to submit analyst action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev);
        next.delete(transactionId);
        return next;
      });
    }
  };

  const getRiskBadge = (band: string | undefined) => {
    const safeBand = band?.toString() || "N/A";
    switch (safeBand.toLowerCase()) {
      case "high":
        return <Badge variant="destructive" className="bg-red-500/20 text-red-500 hover:bg-red-500/30 border-red-500/50">HIGH</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 border-yellow-500/50">MEDIUM</Badge>;
      case "low":
        return <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/50">LOW</Badge>;
      default:
        return <Badge variant="outline">{safeBand}</Badge>;
    }
  };

  const getDecisionIcon = (decision: string | undefined) => {
    const safeDecision = decision?.toString() || "";
    switch (safeDecision.toLowerCase()) {
      case "block":
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      case "review":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "approve":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl border border-white/5 bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden h-full flex flex-col">
      <div className="p-4 border-b border-white/5 bg-white/5">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          Live Transaction Feed
        </h3>
      </div>
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 backdrop-blur-md z-10">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="w-[100px] text-muted-foreground font-medium">Time</TableHead>
              <TableHead className="text-muted-foreground font-medium">Risk Band</TableHead>
              <TableHead className="text-muted-foreground font-medium">Decision</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium">Fraud Probability</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium">Latency</TableHead>
              <TableHead className="text-muted-foreground font-medium">Source</TableHead>
              <TableHead className="text-muted-foreground font-medium">Device</TableHead>
              <TableHead className="text-right text-muted-foreground font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  Waiting for events...
                </TableCell>
              </TableRow>
            ) : (
              events.map((event, index) => {
                const currentAction = localActions[event.id] || event.analystAction;
                const isLoading = loadingIds.has(event.id);

                return (
                  <TableRow 
                    key={event.id || index} 
                    className={cn(
                      "border-white/5 transition-colors",
                      currentAction === "approve" ? "bg-green-500/5 hover:bg-green-500/10" :
                      currentAction === "escalate" ? "bg-yellow-500/5 hover:bg-yellow-500/10" :
                      currentAction === "block" ? "bg-red-500/5 hover:bg-red-500/10" :
                      "hover:bg-white/5"
                    )}
                  >
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {(() => {
                        const date = new Date(event.timestamp);
                        return isNaN(date.getTime()) ? "N/A" : format(date, "HH:mm:ss");
                      })()}
                    </TableCell>
                    <TableCell>{getRiskBadge(event.riskBand)}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      {getDecisionIcon(event.decision)}
                      <span className="capitalize text-sm">{event.decision || "N/A"}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {(event.fraudProbability * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {event.latencyMs}ms
                    </TableCell>
                    <TableCell className="text-sm">{event.source}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate" title={event.deviceOs}>
                      {event.deviceOs}
                    </TableCell>
                    <TableCell className="text-right">
                      {currentAction ? (
                        <div className="flex justify-end pr-2 min-w-[120px]">
                          <Badge 
                            className={cn(
                              "capitalize px-3 py-1",
                              currentAction === "approve" ? "bg-green-500/20 text-green-500 border-green-500/50" :
                              currentAction === "escalate" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/50" :
                              "bg-red-500/20 text-red-500 border-red-500/50"
                            )}
                          >
                            {currentAction}d
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 pr-2 min-w-[160px]">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-teal-400 hover:bg-teal-500/20 no-default-hover-elevate opacity-100 ring-1 ring-teal-500/20"
                            disabled={isLoading}
                            onClick={(e) => {
                              e.stopPropagation();
                              openCopilot(event);
                            }}
                            title="Analyst Copilot"
                            data-testid={`button-copilot-${event.id}`}
                          >
                            <Sparkles className="h-5 w-5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-green-500 hover:bg-green-500/20 no-default-hover-elevate opacity-100 ring-1 ring-green-500/20"
                            disabled={isLoading}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnalystAction(event.id, "approve");
                            }}
                            title="Approve"
                            data-testid={`button-approve-${event.id}`}
                          >
                            <Check className="h-5 w-5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-yellow-500 hover:bg-yellow-500/20 no-default-hover-elevate opacity-100 ring-1 ring-yellow-500/20"
                            disabled={isLoading}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnalystAction(event.id, "escalate");
                            }}
                            title="Escalate"
                            data-testid={`button-escalate-${event.id}`}
                          >
                            <UserPlus className="h-5 w-5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 text-red-500 hover:bg-red-500/20 no-default-hover-elevate opacity-100 ring-1 ring-red-500/20"
                            disabled={isLoading}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnalystAction(event.id, "block");
                            }}
                            title="Block"
                            data-testid={`button-block-${event.id}`}
                          >
                            <ShieldX className="h-5 w-5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      <AnalystCopilot
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        event={selectedEvent}
        onAction={handleCopilotAction}
      />
    </div>
  );
}
