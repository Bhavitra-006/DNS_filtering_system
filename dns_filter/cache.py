import time
import threading


class DNSCache:
    """
    Thread-safe DNS response and security decision cache.
    Guarantees that a cached response will never allow a blocked domain.
    """

    def __init__(self, max_size=10000):
        self.max_size = max_size
        self.response_cache = {}   # cache_key -> (response_bytes, expiry)
        self.decision_cache = {}   # domain -> (decision_dict, expiry)
        self.lock = threading.Lock()

        self.hits = 0
        self.misses = 0

    def get(self, key):
        """
        Return cached DNS response bytes if valid.
        """
        with self.lock:
            entry = self.response_cache.get(key)
            if entry is None:
                self.misses += 1
                return None

            response, expiry = entry
            if time.time() >= expiry:
                del self.response_cache[key]
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
            if len(self.response_cache) >= self.max_size:
                oldest_key = next(iter(self.response_cache))
                del self.response_cache[oldest_key]

            expiry = time.time() + ttl
            self.response_cache[key] = (response, expiry)

    def get_decision(self, domain):
        """
        Return cached security evaluation if valid.
        """
        domain = domain.lower().strip().rstrip(".")
        with self.lock:
            entry = self.decision_cache.get(domain)
            if entry is None:
                return None

            decision_data, expiry = entry
            if time.time() >= expiry:
                del self.decision_cache[domain]
                return None

            return decision_data.copy()

    def set_decision(self, domain, decision_data, ttl=300):
        """
        Store security evaluation with TTL.
        """
        domain = domain.lower().strip().rstrip(".")
        if ttl <= 0:
            return

        with self.lock:
            if len(self.decision_cache) >= self.max_size:
                oldest_key = next(iter(self.decision_cache))
                del self.decision_cache[oldest_key]

            expiry = time.time() + ttl
            self.decision_cache[domain] = (decision_data.copy(), expiry)

    def invalidate(self, domain):
        """
        Remove any cached responses and security decisions for a domain.
        Must be called when a domain is added to or removed from blocklist.
        """
        domain = domain.lower().strip().rstrip(".")
        with self.lock:
            if domain in self.decision_cache:
                del self.decision_cache[domain]

            # Invalidate all query types for this domain in response cache
            keys_to_delete = [
                k for k in self.response_cache
                if k.startswith(f"{domain}:") or k == domain
            ]
            for k in keys_to_delete:
                del self.response_cache[k]

    def clear(self):
        """Clear the entire cache."""
        with self.lock:
            self.response_cache.clear()
            self.decision_cache.clear()

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
                "size": len(self.response_cache),
                "decisions_cached": len(self.decision_cache),
                "hits": self.hits,
                "misses": self.misses,
                "hit_rate": round(hit_rate, 2)
            }