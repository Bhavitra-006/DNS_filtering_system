import time
import threading


class DNSCache:

    def __init__(self, max_size=10000):
        self.max_size = max_size
        self.cache = {}
        self.lock = threading.Lock()

        self.hits = 0
        self.misses = 0

    def get(self, key):
        """
        Return cached DNS response bytes if valid.
        """

        with self.lock:

            entry = self.cache.get(key)

            if entry is None:
                self.misses += 1
                return None

            response, expiry = entry

            # TTL expired
            if time.time() >= expiry:
                del self.cache[key]
                self.misses += 1
                return None

            self.hits += 1

            return response

    def set(self, key, response, ttl):
        """
        Store DNS response bytes with TTL.
        """

        if ttl <= 0:
            return

        with self.lock:

            # Remove oldest entry if cache is full
            if len(self.cache) >= self.max_size:
                oldest_key = next(iter(self.cache))
                del self.cache[oldest_key]

            expiry = time.time() + ttl

            self.cache[key] = (
                response,
                expiry
            )

    def clear(self):
        """Clear the cache."""

        with self.lock:
            self.cache.clear()

    def stats(self):
        """Return cache statistics."""

        with self.lock:

            total = self.hits + self.misses

            hit_rate = (
                (self.hits / total) * 100
                if total > 0
                else 0
            )

            return {
                "size": len(self.cache),
                "hits": self.hits,
                "misses": self.misses,
                "hit_rate": round(hit_rate, 2)
            }