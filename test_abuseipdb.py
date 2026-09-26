import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_KEY = os.getenv("ABUSEIPDB_API_KEY")

url = "https://api.abuseipdb.com/api/v2/check"

headers = {
    "Key": API_KEY,
    "Accept": "application/json"
}

params = {
    "ipAddress": "8.8.8.8",
    "maxAgeInDays": 90
}

try:
    response = requests.get(
        url,
        headers=headers,
        params=params,
        timeout=10
    )

    print("HTTP Status:", response.status_code)

    if response.ok:
        data = response.json()

        ip_data = data["data"]

        print("IP:", ip_data["ipAddress"])
        print("Abuse Confidence Score:", ip_data["abuseConfidenceScore"])
        print("Total Reports:", ip_data["totalReports"])
        print("Country:", ip_data["countryCode"])
        print("ISP:", ip_data["isp"])

    else:
        print("API request failed")
        print("Response:", response.text)

except requests.exceptions.RequestException as e:
    print("Connection error:", e)