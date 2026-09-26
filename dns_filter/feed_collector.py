from pathlib import Path

from .database import Database
from .threat_intel import ThreatIntelManager


class FeedCollector:

    def __init__(self, database):
        self.database = database
        self.threat_intel = ThreatIntelManager(database)

    def read_local_feed(self, file_path):
        """Read non-empty, non-comment lines from a feed."""

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Feed not found: {file_path}"
            )

        entries = []

        with path.open("r", encoding="utf-8") as file:

            for line in file:

                line = line.strip()

                if not line:
                    continue

                if line.startswith("#"):
                    continue

                entries.append(line)

        return entries

    def process_local_feed(
        self,
        file_path,
        source,
        confidence=90,
    ):
        """
        Process a local feed containing:

            domain,threat_type

        Example:

            evil.example,PHISHING
            malware.example,MALWARE
            c2.example,C2_BOTNET
        """

        entries = self.read_local_feed(file_path)

        indicators = []

        for line in entries:

            parts = line.split(",", 1)

            if len(parts) != 2:
                print(
                    f"Skipping invalid feed entry: {line}"
                )
                continue

            domain = parts[0].strip()
            threat_type = parts[1].strip().upper()

            if not domain or not threat_type:
                print(
                    f"Skipping invalid feed entry: {line}"
                )
                continue

            indicators.append(
                {
                    "domain": domain,
                    "threat_type": threat_type,
                    "source": source,
                    "confidence": confidence,
                }
            )

        added = self.threat_intel.add_indicators(
            indicators
        )

        return {
            "read": len(entries),
            "valid": len(indicators),
            "added": added,
        }


def main():

    print("======================================")
    print("       THREAT FEED COLLECTOR")
    print("======================================")

    database = Database()

    collector = FeedCollector(database)

    feed_path = "data/feeds/test_feed.txt"

    result = collector.process_local_feed(
        file_path=feed_path,
        source="test_feed",
        confidence=90,
    )

    print(
        f"Feed entries read: {result['read']}"
    )

    print(
        f"Valid entries: {result['valid']}"
    )

    print(
        f"Indicators stored: {result['added']}"
    )

    synced = collector.threat_intel.sync_blocklist()

    print(
        f"Blocklist entries synchronized: {synced}"
    )

    print("--------------------------------------")
    print("Threat feed processing completed.")
    print("--------------------------------------")


if __name__ == "__main__":
    main()