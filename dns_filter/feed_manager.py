from pathlib import Path
import time

import requests

from .database import Database
from .feed_collector import FeedCollector
from .feed_validator import FeedValidator


class FeedManager:

    def __init__(self, database):
        self.database = database
        self.collector = FeedCollector(database)
        self.validator = FeedValidator()

    # ==========================================================
    # FEED VALIDATION
    # ==========================================================

    def validate_feed_file(self, file_path):
        """
        Validate and normalize a downloaded/local feed
        before sending it to the database.
        """

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Feed file not found: {file_path}"
            )

        with path.open(
            "r",
            encoding="utf-8"
        ) as file:

            lines = file.readlines()

        result = self.validator.validate_feed(lines)

        print("--------------------------------------")
        print("Feed validation")
        print(f"File: {file_path}")
        print(f"Valid entries: {result['valid']}")
        print(f"Invalid entries: {result['invalid']}")
        print("--------------------------------------")

        return result

    # ==========================================================
    # LOCAL FEED
    # ==========================================================

    def process_local_feed(
        self,
        file_path,
        source,
        confidence=90,
    ):
        """
        Validate and process a local threat-intelligence feed.
        """

        path = Path(file_path)

        if not path.exists():
            raise FileNotFoundError(
                f"Feed file not found: {file_path}"
            )

        print("--------------------------------------")
        print("Processing local threat feed")
        print(f"Source: {source}")
        print(f"File: {file_path}")
        print("--------------------------------------")

        # ------------------------------------------------------
        # VALIDATE FIRST
        # ------------------------------------------------------

        validation = self.validate_feed_file(
            file_path
        )

        if validation["valid"] == 0:

            print(
                "Feed rejected: "
                "no valid threat indicators found."
            )

            return {
                "read": validation["valid"]
                       + validation["invalid"],
                "valid": 0,
                "invalid": validation["invalid"],
                "added": 0,
                "synced": 0,
            }

        # ------------------------------------------------------
        # PROCESS THROUGH COLLECTOR
        # ------------------------------------------------------

        result = self.collector.process_local_feed(
            file_path=str(path),
            source=source,
            confidence=confidence,
        )

        # ------------------------------------------------------
        # SYNCHRONIZE BLOCKLIST
        # ------------------------------------------------------

        synced = self.collector.threat_intel.sync_blocklist()

        return {
            "read": result["read"],
            "valid": result["valid"],
            "invalid": validation["invalid"],
            "added": result["added"],
            "synced": synced,
        }

    # ==========================================================
    # REMOTE FEED DOWNLOAD
    # ==========================================================

    def download_feed(
        self,
        url,
        output_file,
        timeout=30,
        retries=3,
    ):
        """
        Download a remote threat-intelligence feed.

        The feed is written to a temporary file first.
        The existing feed is replaced only after a
        successful download.
        """

        output_path = Path(output_file)

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        print("--------------------------------------")
        print("Downloading remote threat feed")
        print(f"URL: {url}")
        print("--------------------------------------")

        last_error = None

        for attempt in range(1, retries + 1):

            try:

                print(
                    f"Download attempt "
                    f"{attempt}/{retries}"
                )

                response = requests.get(
                    url,
                    timeout=timeout,
                    headers={
                        "User-Agent":
                        "DNS-Filtering-System/1.0"
                    },
                )

                response.raise_for_status()

                if not response.text.strip():
                    raise RuntimeError(
                        "Downloaded feed is empty."
                    )

                # --------------------------------------------------
                # WRITE TEMPORARY FILE
                # --------------------------------------------------

                temporary_file = output_path.with_suffix(
                    output_path.suffix + ".tmp"
                )

                temporary_file.write_text(
                    response.text,
                    encoding="utf-8",
                )

                # --------------------------------------------------
                # VALIDATE TEMPORARY FILE
                # --------------------------------------------------

                validation = self.validate_feed_file(
                    temporary_file
                )

                if validation["valid"] == 0:

                    temporary_file.unlink(
                        missing_ok=True
                    )

                    raise RuntimeError(
                        "Downloaded feed contains "
                        "no valid indicators."
                    )

                print(
                    f"Valid indicators: "
                    f"{validation['valid']}"
                )

                print(
                    f"Invalid entries: "
                    f"{validation['invalid']}"
                )

                # --------------------------------------------------
                # ATOMIC REPLACEMENT
                # --------------------------------------------------

                temporary_file.replace(
                    output_path
                )

                print(
                    "Feed downloaded successfully."
                )

                print(
                    f"Saved to: {output_path}"
                )

                print(
                    f"Size: "
                    f"{len(response.text)} bytes"
                )

                return {
                    "success": True,
                    "file": str(output_path),
                    "bytes": len(response.text),
                    "valid": validation["valid"],
                    "invalid": validation["invalid"],
                }

            except Exception as error:

                last_error = error

                print(
                    f"Download failed: {error}"
                )

                if attempt < retries:
                    time.sleep(2)

        print(
            "Remote feed download failed "
            "after all retries."
        )

        return {
            "success": False,
            "file": str(output_path),
            "bytes": 0,
            "valid": 0,
            "invalid": 0,
            "error": str(last_error),
        }

    # ==========================================================
    # REMOTE FEED → DATABASE
    # ==========================================================

    def process_remote_feed(
        self,
        url,
        local_file,
        source,
        confidence=90,
    ):
        """
        Download, validate and process a remote feed.
        """

        download_result = self.download_feed(
            url=url,
            output_file=local_file,
        )

        # ------------------------------------------------------
        # DOWNLOAD FAILED
        # ------------------------------------------------------

        if not download_result["success"]:

            print(
                "Keeping existing threat-intelligence "
                "data because feed download failed."
            )

            return {
                "success": False,
                "downloaded": False,
                "processed": False,
                "read": 0,
                "valid": 0,
                "invalid": 0,
                "added": 0,
                "synced": 0,
            }

        # ------------------------------------------------------
        # PROCESS VALIDATED FEED
        # ------------------------------------------------------

        result = self.process_local_feed(
            file_path=local_file,
            source=source,
            confidence=confidence,
        )

        return {
            "success": True,
            "downloaded": True,
            "processed": True,
            "download_valid": download_result["valid"],
            "download_invalid": download_result["invalid"],
            **result,
        }


# ==============================================================
# MAIN
# ==============================================================

def main():

    print("======================================")
    print("       THREAT INTELLIGENCE MANAGER")
    print("======================================")

    database = Database()

    manager = FeedManager(database)

    feed_path = "data/feeds/test_feed.txt"

    result = manager.process_local_feed(
        file_path=feed_path,
        source="local_test_feed",
        confidence=90,
    )

    print("--------------------------------------")
    print("Local feed completed.")
    print(f"Read: {result['read']}")
    print(f"Valid: {result['valid']}")
    print(f"Invalid: {result['invalid']}")
    print(f"Added: {result['added']}")
    print(f"Blocklist synced: {result['synced']}")
    print("--------------------------------------")


if __name__ == "__main__":
    main()