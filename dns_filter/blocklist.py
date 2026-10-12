import threading


class Blocklist:

    def __init__(self, database):
        self.database = database
        self.domains = set()
        self.lock = threading.Lock()

    def load(self):
        with self.lock:
            self.domains = self.database.load_blocked_domains()
        print(
            f"Loaded {len(self.domains)} blocked domains."
        )

    def contains(self, domain):
        domain = domain.rstrip(".").lower()
        with self.lock:
            if domain in self.domains:
                return True

            # Match parent domain / subdomains: e.g. sub.bad.com matches bad.com
            parts = domain.split(".")
            for i in range(1, len(parts) - 1):
                parent = ".".join(parts[i:])
                if parent in self.domains:
                    return True

            return False

    def add(self, domain):
        domain = domain.rstrip(".").lower()
        with self.lock:
            self.domains.add(domain)

    def remove(self, domain):
        domain = domain.rstrip(".").lower()
        with self.lock:
            self.domains.discard(domain)