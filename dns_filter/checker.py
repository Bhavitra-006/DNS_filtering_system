import socket

from .normalizer import normalize_domain
from .threat_intelligence import check_ip_reputation
from .ml.ml_detector import detect_dga
from .ml.feature_extractor import calculate_entropy
from .behavioral import BehavioralAnalyzer


class DNSChecker:
    """
    Comprehensive multi-engine DNS security evaluation engine implementing:
    1. Domain Normalization
    2. Cache Validation (prevents cache-poisoned bypass)
    3. Local Blocklist Check
    4. Threat Intelligence (Active feeds + AbuseIPDB IP reputation)
    5. AI/ML DGA & Malicious Pattern Detection
    6. Behavioral & Tunneling Analysis
    7. Decision Engine (ALLOW / BLOCK / FLAG with explanation)
    """

    def __init__(self, blocklist, database=None, cache=None, behavioral_analyzer=None):
        self.blocklist = blocklist
        self.database = database
        self.cache = cache
        self.behavioral_analyzer = behavioral_analyzer or BehavioralAnalyzer()

    def check(self, domain, record_behavior=True):
        """
        Execute full security evaluation pipeline for the domain.
        """
        # ==========================================
        # 1. DOMAIN NORMALIZATION & VALIDATION
        # ==========================================
        normalized = normalize_domain(domain)
        if not normalized:
            return {
                "domain": domain,
                "decision": "BLOCK",
                "threat_type": "invalid_domain",
                "reason": "Domain name failed RFC/syntax normalization and validation.",
                "security_analysis": {
                    "blocklist": "Clean",
                    "threat_intel": "Clean",
                    "dga_ml": "Low Risk",
                    "behavioral": "Suspicious",
                },
                "risk_score": 90,
                "risk_level": "Critical Risk",
                "ip_address": None,
                "abuse_confidence_score": None,
                "ml_confidence": None,
                "entropy": 0.0,
            }


        domain = normalized

        # Initialize analysis variables before any checks
        ip_address = None
        abuse_score = None
        ml_conf = None

        # ==========================================
        # 2. CACHE CHECK & TRUSTED DOMAIN POLICY
        # ==========================================

        is_allowlisted = False

        if self.database is not None:
            try:
                is_allowlisted = self.database.is_allowed_domain(domain)
            except Exception as e:
                print(f"[Allowlist DB error] {e}")

        if self.cache is not None:
            cached_result = self.cache.get_decision(domain)

            if cached_result is not None:
                if (
                    self.blocklist.contains(domain)
                    or (
                        cached_result.get("decision") == "DENY"
                        and is_allowlisted
                    )
                    or (
                        cached_result.get("decision") in ("ALLOW", "FLAG")
                        and not is_allowlisted
                    )
                ):
                    self.cache.invalidate(domain)
                else:
                    return cached_result

        entropy_val = round(calculate_entropy(domain.replace(".", "")), 2)


        # ==========================================
        # 3. BLOCKLIST CHECK
        # ==========================================
        if self.blocklist.contains(domain):
            result = {
                "domain": domain,
                "decision": "BLOCK",
                "threat_type": "blocked_domain",
                "reason": "Domain is explicitly listed in the local blocked-domain list.",
                "security_analysis": {
                    "blocklist": "Blocked",
                    "threat_intel": "Clean",
                    "dga_ml": "Low Risk",
                    "behavioral": "Normal",
                },
                "risk_score": 100,
                "risk_level": "Critical Risk",
                "ip_address": None,
                "abuse_confidence_score": None,
                "ml_confidence": None,
                "entropy": entropy_val,
            }
            if self.cache is not None:
                self.cache.set_decision(domain, result, ttl=300)
            return result
        # ==========================================
        # 3b. UNKNOWN DOMAIN POLICY (DENY)
        # ==========================================
        if not is_allowlisted:
            result = {
                "domain": domain,
                "decision": "DENY",
                "threat_type": "unknown_domain",
                "reason": "Domain is not in the active trusted-domain allowlist.",
                "security_analysis": {
                    "blocklist": "Clean",
                    "threat_intel": "Not checked",
                    "dga_ml": "Not checked",
                    "behavioral": "Not checked",
                },
                "risk_score": 50,
                "risk_level": "Moderate Risk",
                "ip_address": None,
                "abuse_confidence_score": None,
                "ml_confidence": None,
                "entropy": entropy_val,
            }

            if self.cache is not None:
                self.cache.set_decision(domain, result, ttl=60)

            return result

        # ==========================================
        # 4. THREAT INTELLIGENCE ANALYSIS
        # ==========================================
        # 4a. Check active indicators in database threat feeds
        if self.database is not None:
            try:
                ti_indicator = self.database.check_threat_intel(domain)
                if ti_indicator:
                    threat_type = ti_indicator.get("threat_type", "threat_intel")
                    source = ti_indicator.get("source", "feed")
                    conf = int(ti_indicator.get("confidence") or 90)

                    result = {
                        "domain": domain,
                        "decision": "BLOCK",
                        "threat_type": threat_type,
                        "reason": f"Threat intelligence feed match: {threat_type} from '{source}' (confidence: {conf}%).",
                        "security_analysis": {
                            "blocklist": "Clean",
                            "threat_intel": "Malicious",
                            "dga_ml": "Low Risk",
                            "behavioral": "Normal",
                        },
                        "risk_score": max(85, conf),
                        "risk_level": "Critical Risk",
                        "ip_address": None,
                        "abuse_confidence_score": None,
                        "ml_confidence": None,
                        "entropy": entropy_val,
                    }
                    if self.cache is not None:
                        self.cache.set_decision(domain, result, ttl=300)
                    return result
            except Exception as e:
                print(f"[ThreatIntel DB error] {e}")

        # 4b. Resolve domain to IP and check AbuseIPDB
        try:
            ip_address = socket.gethostbyname(domain)
            reputation = check_ip_reputation(ip_address)
            if reputation:
                abuse_score = reputation.get("abuse_confidence_score")
                if abuse_score is not None and abuse_score >= 50:
                    result = {
                        "domain": domain,
                        "decision": "BLOCK",
                        "threat_type": "malicious_ip",
                        "reason": f"Resolved IP {ip_address} has high abuse confidence score ({abuse_score}%) in AbuseIPDB.",
                        "security_analysis": {
                            "blocklist": "Clean",
                            "threat_intel": "Malicious",
                            "dga_ml": "Low Risk",
                            "behavioral": "Normal",
                        },
                        "risk_score": abuse_score,
                        "risk_level": "High Risk" if abuse_score < 80 else "Critical Risk",
                        "ip_address": ip_address,
                        "abuse_confidence_score": abuse_score,
                        "ml_confidence": None,
                        "entropy": entropy_val,
                    }
                    if self.cache is not None:
                        self.cache.set_decision(domain, result, ttl=300)
                    return result
        except socket.gaierror:
            # Domain could not be resolved currently; continue pipeline checks
            pass
        except Exception as e:
            print(f"[AbuseIPDB check error] {e}")

        # ==========================================
        # 5. AI/ML ANALYSIS (DGA Detection)
        # ==========================================
        try:
            ml_result = detect_dga(domain)
            ml_conf = ml_result.get("confidence")
            if ml_result.get("is_malicious"):
                conf_pct = ml_conf * 100 if ml_conf else 85.0
                result = {
                    "domain": domain,
                    "decision": "BLOCK",
                    "threat_type": "DGA_ML",
                    "reason": f"DGA/ML detection flagged high-risk algorithmically generated domain (confidence: {conf_pct:.1f}%).",
                    "security_analysis": {
                        "blocklist": "Clean",
                        "threat_intel": "Clean",
                        "dga_ml": "High Risk",
                        "behavioral": "Normal",
                    },
                    "risk_score": int(conf_pct),
                    "risk_level": "Critical Risk" if conf_pct >= 85 else "High Risk",
                    "ip_address": ip_address,
                    "abuse_confidence_score": abuse_score,
                    "ml_confidence": ml_conf,
                    "entropy": entropy_val,
                }
                if self.cache is not None:
                    self.cache.set_decision(domain, result, ttl=300)
                return result
        except Exception as e:
            print(f"[ML detector error] {e}")

        # ==========================================
        # 6. BEHAVIORAL ANALYSIS
        # ==========================================
        behavior = self.behavioral_analyzer.analyze(domain, record_hit=record_behavior)
        if behavior["status"] == "High Risk":
            result = {
                "domain": domain,
                "decision": "BLOCK",
                "threat_type": behavior["anomaly_type"] or "behavioral_anomaly",
                "reason": behavior["reason"],
                "security_analysis": {
                    "blocklist": "Clean",
                    "threat_intel": "Clean",
                    "dga_ml": "Low Risk",
                    "behavioral": "High Risk",
                },
                "risk_score": 90,
                "risk_level": "Critical Risk",
                "ip_address": ip_address,
                "abuse_confidence_score": abuse_score,
                "ml_confidence": ml_conf,
                "entropy": entropy_val,
            }
            if self.cache is not None:
                self.cache.set_decision(domain, result, ttl=180)
            return result

        if behavior["status"] == "Moderate Anomaly":
            result = {
                "domain": domain,
                "decision": "FLAG",
                "threat_type": behavior["anomaly_type"] or "suspicious_behavior",
                "reason": behavior["reason"],
                "security_analysis": {
                    "blocklist": "Clean",
                    "threat_intel": "Clean",
                    "dga_ml": "Low Risk",
                    "behavioral": "Suspicious",
                },
                "risk_score": 55,
                "risk_level": "Moderate Risk",
                "ip_address": ip_address,
                "abuse_confidence_score": abuse_score,
                "ml_confidence": ml_conf,
                "entropy": entropy_val,
            }
            if self.cache is not None:
                self.cache.set_decision(domain, result, ttl=180)
            return result



        # ==========================================
        # 7. DECISION ENGINE: TRUSTED DOMAIN (ALLOW)
        # ==========================================
        result = {
            "domain": domain,
            "decision": "ALLOW",
            "threat_type": "trusted_domain",
            "reason": "Domain is allowlisted and passed the security checks.",
            "security_analysis": {
                "blocklist": "Clean",
                "threat_intel": "Clean",
                "dga_ml": "Low Risk",
                "behavioral": "Normal",
            },
            "risk_score": 0,
            "risk_level": "Low Risk",
            "ip_address": ip_address,
            "abuse_confidence_score": abuse_score,
            "ml_confidence": ml_conf,
            "entropy": entropy_val,
        }

        if self.cache is not None:
            self.cache.set_decision(domain, result, ttl=300)

        return result
