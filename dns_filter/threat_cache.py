import time
from collections import OrderedDict


class ThreatIntelCache:

    def __init__(self, max_size=10000, ttl=3600):
        self.max_size = max_size
        self.ttl = ttl
        self.cache = OrderedDict()

    def get(self, ip_address):

        if ip_address not in self.cache:
            return None

        result, timestamp = self.cache[ip_address]

        if time.time() - timestamp > self.ttl:
            del self.cache[ip_address]
            return None

        self.cache.move_to_end(ip_address)

        return result

    def set(self, ip_address, result):

        if ip_address in self.cache:
            del self.cache[ip_address]

        self.cache[ip_address] = (
            result,
            time.time()
        )

        while len(self.cache) > self.max_size:
            self.cache.popitem(last=False)

    def clear(self):
        self.cache.clear()

    def size(self):
        return len(self.cache)