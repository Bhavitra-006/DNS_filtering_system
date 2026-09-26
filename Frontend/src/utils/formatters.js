// Formatting utilities for DNS Sentinel

export function formatNumber(num) {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat().format(num);
}

export function formatCompactNumber(num) {
  if (num === null || num === undefined) return "0";
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export function getDecisionBadgeProps(decision) {
  switch (decision?.toUpperCase()) {
    case "ALLOW":
      return {
        variant: "allow",
        label: "ALLOW",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        dot: "bg-emerald-400",
      };
    case "BLOCK":
      return {
        variant: "block",
        label: "BLOCK",
        bg: "bg-rose-500/10",
        border: "border-rose-500/30",
        text: "text-rose-400",
        dot: "bg-rose-400",
      };
    case "FLAG":
      return {
        variant: "flag",
        label: "FLAG",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        text: "text-amber-400",
        dot: "bg-amber-400",
      };
    default:
      return {
        variant: "neutral",
        label: decision || "UNKNOWN",
        bg: "bg-slate-500/10",
        border: "border-slate-500/30",
        text: "text-slate-400",
        dot: "bg-slate-400",
      };
  }
}

export function getSystemStatusProps(status) {
  switch (status?.toUpperCase()) {
    case "ONLINE":
    case "HEALTHY":
    case "OPERATIONAL":
      return {
        label: "ONLINE",
        bg: "bg-emerald-500/15",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        dot: "bg-emerald-400",
        glow: "shadow-[0_0_8px_rgba(16,185,129,0.3)]",
      };
    case "DEGRADED":
    case "WARNING":
      return {
        label: "DEGRADED",
        bg: "bg-amber-500/15",
        border: "border-amber-500/30",
        text: "text-amber-400",
        dot: "bg-amber-400",
        glow: "shadow-[0_0_8px_rgba(245,158,11,0.3)]",
      };
    case "OFFLINE":
    case "CRITICAL":
      return {
        label: "OFFLINE",
        bg: "bg-rose-500/15",
        border: "border-rose-500/30",
        text: "text-rose-400",
        dot: "bg-rose-400",
        glow: "shadow-[0_0_8px_rgba(244,63,94,0.3)]",
      };
    default:
      return {
        label: status || "UNKNOWN",
        bg: "bg-slate-500/15",
        border: "border-slate-500/30",
        text: "text-slate-400",
        dot: "bg-slate-400",
        glow: "",
      };
  }
}

export function getThreatCategoryColor(threatType) {
  switch (threatType?.toLowerCase()) {
    case "phishing":
      return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    case "malware c2":
    case "malware":
      return "text-red-400 bg-red-500/10 border-red-500/20";
    case "dga":
      return "text-purple-400 bg-purple-500/10 border-purple-500/20";
    case "dns tunneling":
      return "text-pink-400 bg-pink-500/10 border-pink-500/20";
    case "suspicious ip":
      return "text-amber-400 bg-amber-500/10 border-amber-500/20";
    case "botnet":
      return "text-orange-400 bg-orange-500/10 border-orange-500/20";
    case "crypto miner":
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
    case "clean":
    case "none":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    default:
      return "text-sky-400 bg-sky-500/10 border-sky-500/20";
  }
}

// Download client-side CSV or JSON without backend
export function exportDataAsFile(data, filename, type = "json") {
  let content = "";
  let mimeType = "application/json";

  if (type === "csv") {
    mimeType = "text/csv;charset=utf-8;";
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      const rows = data.map((row) =>
        headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
      );
      content = [headers.join(","), ...rows].join("\r\n");
    }
  } else {
    content = JSON.stringify(data, null, 2);
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
