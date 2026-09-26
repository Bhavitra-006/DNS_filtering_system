class Blocklist:

    def __init__(self, database):
        self.database = database
        self.domains = set()

    def load(self):
        self.domains = self.database.load_blocked_domains()

        print(
            f"Loaded {len(self.domains)} blocked domains."
        )

    def contains(self, domain):

        domain = domain.rstrip(".").lower()

        return domain in self.domains

    def add(self, domain):

        domain = domain.rstrip(".").lower()

        self.domains.add(domain)

    def remove(self, domain):

        domain = domain.rstrip(".").lower()

        self.domains.discard(domain)