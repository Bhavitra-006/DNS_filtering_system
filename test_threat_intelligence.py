from dns_filter.threat_intelligence import (
    check_ip_reputation,
    is_malicious_ip
)


ip = "8.8.8.8"

result = check_ip_reputation(ip)

if result:
    print("\n===== AbuseIPDB Result =====")
    print("IP:", result["ip"])
    print("Abuse Confidence Score:",
          result["abuse_confidence_score"])
    print("Total Reports:",
          result["total_reports"])
    print("Country:",
          result["country"])
    print("ISP:",
          result["isp"])

    malicious = is_malicious_ip(ip)

    print("\n===== DNS Filtering Decision =====")

    if malicious:
        print("Decision: BLOCK")
    else:
        print("Decision: ALLOW")