import time
from datetime import datetime

from .database import Database
from .feed_manager import FeedManager


FEED_URL = (
    "http://127.0.0.1:8000/"
    "remote_test_source.txt"
)

LOCAL_FILE = (
    "data/feeds/"
    "scheduled_remote_feed.txt"
)

SOURCE = "scheduled_remote_feed"

CONFIDENCE = 90

# 60 seconds for testing
UPDATE_INTERVAL = 60


class ThreatFeedScheduler:

    def __init__(self):

        self.database = Database()

        self.manager = FeedManager(
            self.database
        )

        self.running = True

    def update_feed(self):

        print()
        print("======================================")
        print("       THREAT FEED UPDATE")
        print("======================================")

        print(
            f"Time: {datetime.now()}"
        )

        print(
            f"Source: {SOURCE}"
        )

        print(
            f"URL: {FEED_URL}"
        )

        print("--------------------------------------")

        try:

            result = self.manager.process_remote_feed(
                url=FEED_URL,
                local_file=LOCAL_FILE,
                source=SOURCE,
                confidence=CONFIDENCE,
            )

            print("--------------------------------------")

            if result.get("success"):

                print("Feed update successful.")

                print(
                    f"Downloaded: "
                    f"{result.get('downloaded')}"
                )

                print(
                    f"Processed: "
                    f"{result.get('processed')}"
                )

                print(
                    f"Entries read: "
                    f"{result.get('read')}"
                )

                print(
                    f"Valid entries: "
                    f"{result.get('valid')}"
                )

                print(
                    f"Indicators added: "
                    f"{result.get('added')}"
                )

                print(
                    f"Blocklist synchronized: "
                    f"{result.get('synced')}"
                )

            else:

                print("Feed update failed.")
                print(result)

        except Exception as error:

            print(
                f"Feed update error: {error}"
            )

        print("--------------------------------------")

    def run(self):

        print()
        print("======================================")
        print("       THREAT FEED SCHEDULER")
        print("======================================")

        print(
            f"Update interval: "
            f"{UPDATE_INTERVAL} seconds"
        )

        print(
            f"Feed source: {FEED_URL}"
        )

        print("--------------------------------------")

        # Run immediately
        self.update_feed()

        while self.running:

            print()
            print(
                f"Next update in "
                f"{UPDATE_INTERVAL} seconds..."
            )

            try:

                time.sleep(
                    UPDATE_INTERVAL
                )

            except KeyboardInterrupt:

                print()
                print(
                    "Stopping scheduler..."
                )

                self.running = False
                break

            if self.running:

                self.update_feed()


def main():

    scheduler = ThreatFeedScheduler()

    try:

        scheduler.run()

    except KeyboardInterrupt:

        scheduler.running = False

        print()
        print(
            "Threat feed scheduler stopped."
        )


if __name__ == "__main__":
    main()