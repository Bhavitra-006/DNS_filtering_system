import re
import time
from collections import defaultdict, deque
import threading
from .ml.feature_extractor import calculate_entropy


class BehavioralAnalyzer:
    """
    Sliding-window behavioral analyzer detecting:
    - DNS tunneling / data exfiltration patterns
    - High query frequency / burst anomalies
    - Subdomain entropy and lexical structural anomalies
    """

    def __init__(self, window_seconds=60, burst_threshold=15, flood_threshold=30):
        self.window_seconds = window_seconds
        self.burst_threshold = burst_threshold
        self.flood_threshold = flood_threshold
        self.query_history = defaultdict(deque)  # domain -> deque of timestamps
        self.lock = threading.Lock()

        # Regex patterns for encoded data (hex/base64/base32)
        self.hex_pattern = re.compile(r"^[0-9a-fA-F]{16,}$")
        self.b64_pattern = re.compile(r"^[0-9a-zA-Z_\-]{24,}$")
        self.suspicious_keywords = {
            "exfil", "tunnel", "beacon", "stealer", "c2", "payload",
            "token", "update-secure", "verify-account"
        }
        self.suspicious_tlds = {
            "xyz", "top", "cc", "biz", "click", "info", "ru", "online", "club", "work", "link"
        }

    def record_query(self, domain):
        """Record query timestamp for burst tracking."""
        now = time.time()
        with self.lock:
            timestamps = self.query_history[domain]
            timestamps.append(now)
            cutoff = now - self.window_seconds
            while timestamps and timestamps[0] < cutoff:
                timestamps.popleft()
            return len(timestamps)

    def analyze(self, domain, record_hit=True):
        """
        Analyze domain behavior.

        Returns:
            dict: {
                "status": "Normal" | "Moderate Anomaly" | "High Risk",
                "risk_level": "low" | "medium" | "high",
                "anomaly_type": str | None,
                "reason": str,
                "query_count_window": int
            }
        """
        if not domain:
            return {
                "status": "Normal",
                "risk_level": "low",
                "anomaly_type": None,
                "reason": "Normal query behavior.",
                "query_count_window": 0
            }

        domain = domain.lower().strip().rstrip(".")
        labels = [l for l in domain.split(".") if l]

        query_count = self.record_query(domain) if record_hit else len(self.query_history.get(domain, []))

        # Check 1: Severe query flood (High Risk -> BLOCK)
        if query_count >= self.flood_threshold:
            return {
                "status": "High Risk",
                "risk_level": "high",
                "anomaly_type": "query_flood",
                "reason": f"High-risk query flood detected ({query_count} queries in {self.window_seconds}s).",
                "query_count_window": query_count
            }

        # Check 2: DNS Tunneling Detection (High Risk -> BLOCK)
        # DNS tunneling typically uses long, high-entropy subdomains carrying encoded payloads
        if len(labels) >= 3:
            subdomain_labels = labels[:-2]  # exclude SLD and TLD
            for sub in subdomain_labels:
                sub_len = len(sub)
                sub_entropy = calculate_entropy(sub)

                # Extremely long encoded payload in subdomain
                if sub_len >= 32 and (self.hex_pattern.match(sub) or self.b64_pattern.match(sub) or sub_entropy > 3.6):
                    return {
                        "status": "High Risk",
                        "risk_level": "high",
                        "anomaly_type": "dns_tunneling",
                        "reason": f"High-risk DNS tunneling/data exfiltration pattern in subdomain ({sub_len} chars, entropy {sub_entropy:.2f}).",
                        "query_count_window": query_count
                    }

                # Explicit tunneling keywords
                if any(kw in sub for kw in ["tunnel", "exfil", "beacon", "stealer"]):
                    return {
                        "status": "High Risk",
                        "risk_level": "high",
                        "anomaly_type": "dns_tunneling",
                        "reason": f"Identified covert channel/tunneling indicator in subdomain: '{sub}'.",
                        "query_count_window": query_count
                    }

        # Check 3: Query burst rate (Moderate Anomaly -> FLAG)
        if query_count >= self.burst_threshold:
            return {
                "status": "Moderate Anomaly",
                "risk_level": "medium",
                "anomaly_type": "query_burst",
                "reason": f"Moderate query burst cadence ({query_count} queries in {self.window_seconds}s) flagged for monitoring.",
                "query_count_window": query_count
            }

        # Check 4: Deep subdomain nesting or moderate entropy (Moderate Anomaly -> FLAG)
        if len(labels) >= 5:
            return {
                "status": "Moderate Anomaly",
                "risk_level": "medium",
                "anomaly_type": "deep_subdomains",
                "reason": f"Unusually deep subdomain hierarchy ({len(labels)-2} levels) flagged for observation.",
                "query_count_window": query_count
            }

        tld = labels[-1] if labels else ""
        main_label = labels[0] if labels else ""
        if tld in self.suspicious_tlds and any(kw in domain for kw in self.suspicious_keywords):
            return {
                "status": "Moderate Anomaly",
                "risk_level": "medium",
                "anomaly_type": "suspicious_combination",
                "reason": f"Suspicious keyword combined with high-risk TLD (.{tld}) flagged for review.",
                "query_count_window": query_count
            }

        return {
            "status": "Normal",
            "risk_level": "low",
            "anomaly_type": None,
            "reason": "Normal domain behavior.",
            "query_count_window": query_count
        }
