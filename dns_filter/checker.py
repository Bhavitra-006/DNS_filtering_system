import socket

from .threat_intelligence import check_ip_reputation
from .ml.ml_detector import detect_dga


class DNSChecker:

    def __init__(self, blocklist):
        self.blocklist = blocklist

    def check(self, domain):

        # ==========================================
        # 1. CHECK LOCAL BLOCKLIST
        # ==========================================

        if self.blocklist.contains(domain):

            return {
                "decision": "BLOCK",
                "threat_type": "blocked_domain",
                "ip_address": None,
                "abuse_confidence_score": None,
            }

        # ==========================================
        # 2. ML-BASED DGA DETECTION
        # ==========================================

        try:

            ml_result = detect_dga(domain)

            if ml_result["is_malicious"]:

                return {
                    "decision": "BLOCK",
                    "threat_type": "DGA_ML",
                    "ip_address": None,
                    "abuse_confidence_score": None,
                    "ml_confidence": ml_result["confidence"],
                }

        except Exception as e:

            print(f"ML detector error: {e}")

        # ==========================================
        # 3. RESOLVE DOMAIN TO IP
        # ==========================================

        try:

            ip_address = socket.gethostbyname(domain)

        except socket.gaierror:

            return {
                "decision": "ALLOW",
                "threat_type": None,
                "ip_address": None,
                "abuse_confidence_score": None,
            }

        # ==========================================
        # 4. CHECK THREAT INTELLIGENCE
        # ==========================================

        reputation = check_ip_reputation(ip_address)

        # ==========================================
        # 5. ABUSEIPDB UNAVAILABLE
        # ==========================================

        if reputation is None:

            return {
                "decision": "ALLOW",
                "threat_type": None,
                "ip_address": ip_address,
                "abuse_confidence_score": None,
            }

        # ==========================================
        # 6. GET ABUSE CONFIDENCE SCORE
        # ==========================================

        score = reputation["abuse_confidence_score"]

        # ==========================================
        # 7. MALICIOUS IP
        # ==========================================

        if score >= 50:

            return {
                "decision": "BLOCK",
                "threat_type": "malicious_ip",
                "ip_address": ip_address,
                "abuse_confidence_score": score,
            }

        # ==========================================
        # 8. SAFE IP
        # ==========================================

        return {
            "decision": "ALLOW",
            "threat_type": None,
            "ip_address": ip_address,
            "abuse_confidence_score": score,
        }