import os
import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

from feature_extractor import extract_features


# --------------------------------------------------
# Training domains
# 0 = Benign
# 1 = DGA / Malicious
# --------------------------------------------------

benign_domains = [
    "google.com",
    "example.com",
    "amazon.com",
    "amazon.in",
    "microsoft.com",
    "apple.com",
    "facebook.com",
    "youtube.com",
    "github.com",
    "stackoverflow.com",
    "linkedin.com",
    "wikipedia.org",
    "python.org",
    "ubuntu.com",
    "mozilla.org",
    "cloudflare.com",
    "netflix.com",
    "instagram.com",
    "reddit.com",
    "whatsapp.com",
    "telegram.org",
    "yahoo.com",
    "bing.com",
    "gmail.com",
    "openai.com",
    "sonacollege.edu",
    "microsoftonline.com",
    "zoom.us",
    "dropbox.com",
    "adobe.com"
]

dga_domains = [
    "xj29ak91qz.com",
    "a8f92jd73kq1.xyz",
    "q9x7mz2k1p.net",
    "z8k3j2h9q7.info",
    "m4x8p2q9z1.biz",
    "k7d9s3f1x8.com",
    "v2n8q4m7z1.net",
    "r9x2k7p4m8.org",
    "j8q3z6x1v9.xyz",
    "p7m2k9x4q8.info",
    "x8v3n7q2m9.biz",
    "q4z9k2x7p1.com",
    "m8x1q7z3k9.net",
    "z3p8q1x6m4.org",
    "k9x4v2m7q1.xyz",
    "n7q3z8x2m9.info",
    "b6x9q2m8z4.biz",
    "t8m3x7q1z9.com",
    "w4q8k2x9m1.net",
    "y7z3p9q2x8.org",
    "a9x7k3m2q8.xyz",
    "d8q2z7x4m9.info",
    "f3m9x2q8k7.biz",
    "g7x4p9z2m8.com",
    "h9q3k7x2m6.net",
    "s8z2m7q4x9.org",
    "u3x9q2k7m8.xyz",
    "c7m4z8q2x9.info",
    "e9x3k7m2q8.biz",
    "i8q4z2x7m9.com"
]


# --------------------------------------------------
# Extract features
# --------------------------------------------------

rows = []

for domain in benign_domains:
    features = extract_features(domain)
    features["label"] = 0
    features["domain"] = domain
    rows.append(features)

for domain in dga_domains:
    features = extract_features(domain)
    features["label"] = 1
    features["domain"] = domain
    rows.append(features)


df = pd.DataFrame(rows)

print("=" * 60)
print("DGA ML DATASET")
print("=" * 60)

print(f"Total domains : {len(df)}")
print(f"Benign        : {(df['label'] == 0).sum()}")
print(f"DGA/Malicious : {(df['label'] == 1).sum()}")

print("\nDataset preview:")
print(df.head())


# --------------------------------------------------
# Prepare X and y
# --------------------------------------------------

X = df.drop(columns=["label", "domain"])
y = df["label"]


# --------------------------------------------------
# Train/test split
# --------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.25,
    random_state=42,
    stratify=y
)


# --------------------------------------------------
# Random Forest
# --------------------------------------------------

model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced"
)

model.fit(X_train, y_train)


# --------------------------------------------------
# Evaluation
# --------------------------------------------------

predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("\n" + "=" * 60)
print("MODEL RESULTS")
print("=" * 60)

print(f"Accuracy: {accuracy * 100:.2f}%")

print("\nClassification Report:")
print(classification_report(
    y_test,
    predictions,
    target_names=["Benign", "DGA/Malicious"]
))


# --------------------------------------------------
# Save dataset
# --------------------------------------------------

dataset_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "dataset.csv"
)

df.to_csv(dataset_path, index=False)


# --------------------------------------------------
# Save model
# --------------------------------------------------

model_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "dga_model.pkl"
)

joblib.dump(
    {
        "model": model,
        "features": list(X.columns)
    },
    model_path
)


print("=" * 60)
print("FILES SAVED")
print("=" * 60)

print(f"Dataset : {dataset_path}")
print(f"Model   : {model_path}")