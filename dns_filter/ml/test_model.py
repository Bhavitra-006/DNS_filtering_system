import os
import joblib
import pandas as pd

from feature_extractor import extract_features


# Load trained model
model_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "dga_model.pkl"
)

saved_data = joblib.load(model_path)

model = saved_data["model"]
feature_names = saved_data["features"]


def predict_domain(domain):
    features = extract_features(domain)

    # Keep exactly the same feature order used during training
    X = pd.DataFrame(
        [[features[name] for name in feature_names]],
        columns=feature_names
    )

    prediction = model.predict(X)[0]
    probability = model.predict_proba(X)[0]

    if prediction == 1:
        result = "DGA / MALICIOUS"
        confidence = probability[1]
    else:
        result = "BENIGN"
        confidence = probability[0]

    return result, confidence


# Test domains
test_domains = [
    "google.com",
    "example.com",
    "amazon.in",
    "xj29ak91qz.com",
    "a8f92jd73kq1.xyz",
    "q9x7mz2k1p.net",
    "microsoft.com",
    "github.com"
]


print("=" * 60)
print("DGA ML MODEL TEST")
print("=" * 60)

for domain in test_domains:

    result, confidence = predict_domain(domain)

    print(f"\nDomain    : {domain}")
    print(f"Prediction: {result}")
    print(f"Confidence: {confidence * 100:.2f}%")