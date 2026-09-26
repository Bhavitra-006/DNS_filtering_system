import queue
import threading


class DNSLogger:

    def __init__(self, database, max_size=10000):

        self.database = database

        self.queue = queue.Queue(
            maxsize=max_size
        )

        self.worker = threading.Thread(
            target=self._worker,
            daemon=True
        )

    def start(self):

        self.worker.start()

        print("DNS logging worker started.")

    def log(
        self,
        domain,
        query_type,
        decision,
        threat_type=None,
        response_code=None,
        response_time_ms=None,
    ):

        entry = (
            domain,
            query_type,
            decision,
            threat_type,
            response_code,
            response_time_ms,
        )

        try:
            self.queue.put_nowait(entry)

        except queue.Full:

            print(
                "WARNING: DNS logging queue is full."
            )

    def _worker(self):

        while True:

            entry = self.queue.get()

            try:

                self.database.log_dns_query(
                    *entry
                )

            except Exception as e:

                print(
                    f"Logging error: {e}"
                )

            finally:

                self.queue.task_done()