from dns_filter.ml.ml_detector import detect_dga

test_domains = [
    "google.com",
    "amazon.in",
    "github.com",
    "xj29ak91qz.com",
    "a8f92jd73kq1.xyz",
    "q9x7mz2k1p.net"
]


print("=" * 60)
print("DGA DETECTOR TEST")
print("=" * 60)

for domain in test_domains:

    result = detect_dga(domain)

    print(f"\nDomain     : {domain}")
    print(f"Malicious  : {result['is_malicious']}")
    print(f"Confidence : {result['confidence'] * 100:.2f}%")
    print(f"Threat Type: {result['threat_type']}")