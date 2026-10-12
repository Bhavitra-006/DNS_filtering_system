"""
dns_filter/feed_updater.py
--------------------------
Downloads real malicious domain lists from free public threat feeds
and imports them into the blocked_domains + threat_intel tables.

Feeds used (all free, no API key):
  - URLHaus: abuse.ch
  - Hagezi DNS blocklist (multi-tier)
  - Steven Black hosts file
  - OISD blocklist
"""

import urllib.request
import re
import time
from .database import Database


# ============================================================
# PUBLIC THREAT FEEDS (free, no API key required)
# ============================================================

FEEDS = [
    {
        "name": "URLHaus",
        "url": "https://urlhaus.abuse.ch/downloads/hostfile/",
        "format": "hosts",
        "threat_type": "Malware C2",
        "max_domains": 5000,
    },
    {
        "name": "Hagezi-Pro",
        "url": "https://raw.githubusercontent.com/hagezi/dns-blocklists/main/hosts/pro.txt",
        "format": "hosts",
        "threat_type": "Malicious Domain",
        "max_domains": 5000,
    },
    {
        "name": "Steven-Black",
        "url": "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts",
        "format": "hosts",
        "threat_type": "Malicious Domain",
        "max_domains": 10000,
    },
]


def parse_hosts_file(text):
    """Extract domain names from a hosts-format file (0.0.0.0 domain.com)."""
    domains = set()
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        # hosts format: "0.0.0.0 domain.com" or "127.0.0.1 domain.com"
        parts = line.split()
        if len(parts) >= 2 and parts[0] in ("0.0.0.0", "127.0.0.1"):
            domain = parts[1].lower().strip().rstrip(".")
            # Filter out invalid / localhost entries
            if domain and domain not in ("localhost", "localhost.localdomain", "0.0.0.0", "broadcasthost") \
                    and "." in domain and len(domain) > 4:
                domains.add(domain)
    return domains


def download_feed(url, timeout=15):
    """Download a URL and return the text content."""
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "DNS-Filter/1.0 (educational project)"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def update_feeds(database=None, max_per_feed=2000):
    """
    Download all configured threat feeds and insert new domains
    into blocked_domains + threat_intel.

    Returns a summary dict.
    """
    if database is None:
        database = Database()

    summary = {"feeds_processed": 0, "domains_added": 0, "errors": []}

    for feed in FEEDS:
        print(f"[FeedUpdater] Downloading: {feed['name']} ...")
        try:
            text = download_feed(feed["url"])
        except Exception as e:
            msg = f"{feed['name']}: download failed — {e}"
            print(f"[FeedUpdater] ERROR: {msg}")
            summary["errors"].append(msg)
            continue

        try:
            if feed["format"] == "hosts":
                domains = parse_hosts_file(text)
            else:
                domains = set()

            # Limit to max_per_feed
            domains = list(domains)[:feed.get("max_domains", max_per_feed)]

            print(f"[FeedUpdater] {feed['name']}: {len(domains)} domains parsed. Inserting...")

            conn = database.get_connection()
            cursor = conn.cursor()
            added = 0

            for domain in domains[:max_per_feed]:
                try:
                    cursor.execute("""
                        INSERT IGNORE INTO blocked_domains (domain, source, threat_type)
                        VALUES (%s, %s, %s)
                    """, (domain, feed["name"], feed["threat_type"]))

                    cursor.execute("""
                        INSERT IGNORE INTO threat_intel (domain, threat_type, source, confidence, active)
                        VALUES (%s, %s, %s, %s, TRUE)
                        ON DUPLICATE KEY UPDATE last_seen = NOW(), active = TRUE
                    """, (domain, feed["threat_type"], feed["name"], 90))

                    added += cursor.rowcount
                except Exception:
                    pass  # Skip individual failures

            conn.commit()
            cursor.close()
            conn.close()

            summary["domains_added"] += added
            summary["feeds_processed"] += 1
            print(f"[FeedUpdater] {feed['name']}: {added} new domains inserted.")

        except Exception as e:
            msg = f"{feed['name']}: processing error — {e}"
            print(f"[FeedUpdater] ERROR: {msg}")
            summary["errors"].append(msg)

    print(f"[FeedUpdater] Complete. Added {summary['domains_added']} domains from {summary['feeds_processed']} feeds.")
    return summary


if __name__ == "__main__":
    print("Running feed updater standalone...")
    result = update_feeds(max_per_feed=2000)
    print(result)
