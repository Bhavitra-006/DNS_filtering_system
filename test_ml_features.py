from dns_filter.ml_features import extract_features


domains = [
    "google.com",
    "example.com",
    "amazon.in",
    "xj29ak91qz.com",
    "a8f92jd73kq1.xyz",
]


print("=" * 50)
print("DGA FEATURE EXTRACTION TEST")
print("=" * 50)


for domain in domains:

    print(f"\nDomain: {domain}")

    features = extract_features(domain)

    for name, value in features.items():
        print(f"{name}: {value}")