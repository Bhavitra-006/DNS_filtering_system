from dns_filter.checker import DNSChecker


class TestBlocklist:

    def contains(self, domain):
        return False


# ==========================================
# MOCK THREAT INTELLIGENCE
# ==========================================

import dns_filter.checker as checker_module


def fake_check_ip_reputation(ip_address):

    print(f"[TEST] Simulating AbuseIPDB for: {ip_address}")

    return {
        "ip": ip_address,
        "abuse_confidence_score": 85,
        "total_reports": 100,
        "country": "TEST",
        "isp": "Test ISP"
    }


checker_module.check_ip_reputation = fake_check_ip_reputation


# ==========================================
# CREATE CHECKER
# ==========================================

blocklist = TestBlocklist()

checker = DNSChecker(blocklist)


# ==========================================
# TEST
# ==========================================

result = checker.check("example.com")

print()
print("===== THREAT INTELLIGENCE BLOCK TEST =====")
print(result)