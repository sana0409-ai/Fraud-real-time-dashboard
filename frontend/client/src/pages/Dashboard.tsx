import { useWebSocket } from "@/hooks/use-websocket";
import { KPICard } from "@/components/KPICard";
import { EventsTable } from "@/components/EventsTable";
import { Activity, AlertTriangle, Clock, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { isConnected, kpis, events } = useWebSocket();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 md:p-6 lg:p-8 space-y-6 flex flex-col">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Fraud Monitoring Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Real-time transaction analysis & risk scoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`
              pl-1 pr-3 py-1 gap-2 border-0 bg-opacity-10 backdrop-blur-md
              ${isConnected ? "bg-green-500 text-green-500" : "bg-red-500 text-red-500"}
            `}
          >
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isConnected ? "System Online" : "Disconnected"}
          </Badge>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Transactions / Min"
          value={kpis.txn_per_min}
          icon={Activity}
          color="text-blue-500"
        />
        <KPICard
          title="Alerts / Min"
          value={kpis.alerts_per_min}
          icon={AlertTriangle}
          color="text-yellow-500"
        />
        <KPICard
          title="High Risk %"
          value={`${kpis.high_risk_pct.toFixed(1)}%`}
          icon={ShieldCheck}
          color="text-red-500"
        />
        <KPICard
          title="Avg Latency"
          value={`${kpis.avg_latency_ms.toFixed(0)}ms`}
          icon={Clock}
          color="text-purple-500"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-[600px]">
        <EventsTable events={events} />
      </div>
    </div>
  );
}
