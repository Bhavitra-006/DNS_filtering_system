import os
import requests
from dotenv import load_dotenv

from .threat_cache import ThreatIntelCache


# ==========================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================

load_dotenv()

ABUSEIPDB_API_KEY = os.getenv("ABUSEIPDB_API_KEY")

ABUSEIPDB_BLOCK_THRESHOLD = int(
    os.getenv("ABUSEIPDB_BLOCK_THRESHOLD", "50")
)

ABUSEIPDB_URL = (
    "https://api.abuseipdb.com/api/v2/check"
)


# ==========================================
# THREAT INTELLIGENCE CACHE
# ==========================================

threat_cache = ThreatIntelCache(
    max_size=10000,
    ttl=3600
)


# ==========================================
# CHECK IP REPUTATION
# ==========================================

def check_ip_reputation(ip_address):
    """
    Check the reputation of an IP address using
    AbuseIPDB.

    Uses an in-memory cache to avoid repeatedly
    querying the external API.

    Returns:
        dict: Reputation information
        None: If the API is unavailable
    """

    # ==========================================
    # 1. CHECK CACHE
    # ==========================================

    cached_result = threat_cache.get(ip_address)

    if cached_result is not None:

        print(
            f"[ThreatIntel] Cache HIT: {ip_address}"
        )

        return cached_result

    print(
        f"[ThreatIntel] Cache MISS: {ip_address}"
    )

    # ==========================================
    # 2. CHECK API KEY
    # ==========================================

    if not ABUSEIPDB_API_KEY:

        raise ValueError(
            "ABUSEIPDB_API_KEY is not configured"
        )

    headers = {
        "Key": ABUSEIPDB_API_KEY,
        "Accept": "application/json"
    }

    params = {
        "ipAddress": ip_address,
        "maxAgeInDays": 90
    }

    # ==========================================
    # 3. CALL ABUSEIPDB
    # ==========================================

    try:

        print(
            f"[AbuseIPDB] Checking IP: {ip_address}"
        )

        response = requests.get(
            ABUSEIPDB_URL,
            headers=headers,
            params=params,
            timeout=10
        )

        response.raise_for_status()

        print(
            f"[AbuseIPDB] API response: "
            f"{response.status_code}"
        )

        data = response.json()["data"]

        result = {
            "ip": data["ipAddress"],
            "abuse_confidence_score":
                data["abuseConfidenceScore"],
            "total_reports":
                data["totalReports"],
            "country":
                data["countryCode"],
            "isp":
                data["isp"]
        }

        # ==========================================
        # 4. STORE RESULT IN CACHE
        # ==========================================

        threat_cache.set(
            ip_address,
            result
        )

        print(
            f"[ThreatIntel] Cached: {ip_address}"
        )

        return result

    # ==========================================
    # 5. HTTP ERRORS
    # ==========================================

    except requests.exceptions.HTTPError:

        status_code = response.status_code

        if status_code in (401, 403):

            print(
                "[AbuseIPDB] Authentication failed. "
                "Check the API key."
            )

        elif status_code == 429:

            print(
                "[AbuseIPDB] API rate limit exceeded."
            )

        elif status_code >= 500:

            print(
                f"[AbuseIPDB] Server error: "
                f"HTTP {status_code}"
            )

        else:

            print(
                f"[AbuseIPDB] HTTP error: "
                f"HTTP {status_code}"
            )

        return None

    # ==========================================
    # 6. TIMEOUT
    # ==========================================

    except requests.exceptions.Timeout:

        print(
            "[AbuseIPDB] Request timed out."
        )

        return None

    # ==========================================
    # 7. CONNECTION ERROR
    # ==========================================

    except requests.exceptions.ConnectionError:

        print(
            "[AbuseIPDB] Connection error."
        )

        return None

    # ==========================================
    # 8. OTHER REQUEST ERRORS
    # ==========================================

    except requests.exceptions.RequestException as e:

        print(
            f"[AbuseIPDB] Request failed: {e}"
        )

        return None


# ==========================================
# MALICIOUS IP CHECK
# ==========================================

def is_malicious_ip(ip_address):
    """
    Determine whether an IP should be considered
    malicious based on the AbuseIPDB confidence
    score threshold configured in .env.

    Returns:
        bool: True if IP should be blocked.
    """

    result = check_ip_reputation(ip_address)

    if result is None:

        return False

    score = result["abuse_confidence_score"]

    print(
        f"[ThreatIntel] Abuse Confidence Score: "
        f"{score}"
    )

    print(
        f"[ThreatIntel] Block Threshold: "
        f"{ABUSEIPDB_BLOCK_THRESHOLD}"
    )

    return score >= ABUSEIPDB_BLOCK_THRESHOLD