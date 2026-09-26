from dns_filter.threat_cache import ThreatIntelCache


cache = ThreatIntelCache(
    max_size=100,
    ttl=60
)

ip = "8.8.8.8"

result = {
    "abuse_confidence_score": 0,
    "total_reports": 193
}

print("Initial cache:", cache.get(ip))

cache.set(ip, result)

print("After storing:", cache.get(ip))

print("Cache size:", cache.size())

cache.clear()

print("After clearing:", cache.get(ip))