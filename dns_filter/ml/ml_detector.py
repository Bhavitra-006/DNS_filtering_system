import os
import joblib
import pandas as pd

from .feature_extractor import extract_features

MODEL_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "dga_model.pkl"
)


# Load model once when the module starts
saved_data = joblib.load(MODEL_PATH)

model = saved_data["model"]
feature_names = saved_data["features"]


def detect_dga(domain, threshold=0.80):
    """
    Detect whether a domain appears to be DGA-like.

    Returns:
        {
            "is_malicious": bool,
            "confidence": float,
            "threat_type": str
        }
    """

    features = extract_features(domain)

    X = pd.DataFrame(
        [[features[name] for name in feature_names]],
        columns=feature_names
    )

    prediction = model.predict(X)[0]
    probabilities = model.predict_proba(X)[0]

    if prediction == 1:
        confidence = float(probabilities[1])

        if confidence >= threshold:
            return {
                "is_malicious": True,
                "confidence": confidence,
                "threat_type": "DGA_ML"
            }

    confidence = float(probabilities[0])

    return {
        "is_malicious": False,
        "confidence": confidence,
        "threat_type": "BENIGN_ML"
    }