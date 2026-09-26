from dns_filter.checker import check_domain


domains = [
    "google.com",
    "malicious.test",
    "phishing.test",
    "PHISHING.TEST.",
]


for domain in domains:
    print(f"{domain}: {check_domain(domain)}")