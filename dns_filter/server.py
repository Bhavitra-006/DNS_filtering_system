import time
import threading

from .api import app, set_components

from dnslib import DNSRecord, QTYPE
from dnslib.server import DNSServer, BaseResolver

from .config import (
    DNS_HOST,
    DNS_PORT,
    UPSTREAM_DNS,
    UPSTREAM_PORT,
    LOG_QUEUE_SIZE,
)

from .database import Database
from .blocklist import Blocklist
from .checker import DNSChecker
from .logger import DNSLogger
from .cache import DNSCache
from .behavioral import BehavioralAnalyzer
from .normalizer import normalize_domain


class DNSFilterResolver(BaseResolver):

    def __init__(self, checker, logger, cache, blocklist):
        self.checker = checker
        self.logger = logger
        self.cache = cache
        self.blocklist = blocklist

    def resolve(self, request, handler):

        start_time = time.perf_counter()

        # 1. DNS QUERY COLLECTION
        raw_domain = str(request.q.qname)
        query_type = QTYPE.get(request.q.qtype, "A")

        print(
            f"DNS Query: {raw_domain} [{query_type}]"
        )

        # 2. DOMAIN NORMALIZATION
        domain = normalize_domain(raw_domain)

        if not domain:
            print(f"INVALID DOMAIN: {raw_domain}")
            reply = request.reply()
            reply.header.rcode = 1  # FORMERR
            response_time = (time.perf_counter() - start_time) * 1000
            self.logger.log(
                domain=raw_domain.strip().lower().rstrip("."),
                query_type=query_type,
                decision="BLOCK",
                threat_type="invalid_domain",
                response_code="FORMERR",
                response_time_ms=response_time,
            )
            return reply

        # 3. CACHE CHECK
        # Check whether there is a valid cached DNS response.
        # DO NOT allow a raw DNS cache hit to bypass security validation.
        # The cache must never cause a malicious domain to be automatically
        # allowed simply because a previous DNS response exists.
        cache_key = f"{domain}:{query_type}"

        # If domain is in blocklist, ANY cached ALLOW entry is invalid!
        if self.blocklist.contains(domain):
            self.cache.invalidate(domain)
            reply = request.reply()
            reply.header.rcode = 3  # NXDOMAIN
            response_time = (time.perf_counter() - start_time) * 1000
            self.logger.log(
                domain=domain,
                query_type=query_type,
                decision="BLOCK",
                threat_type="blocked_domain",
                response_code="NXDOMAIN",
                response_time_ms=response_time,
            )
            print(f"BLOCKED (Blocklist): {domain}")
            return reply

        cached_response = self.cache.get(cache_key)

        if cached_response is not None:
            reply = DNSRecord.parse(cached_response)
            response_time = (time.perf_counter() - start_time) * 1000
            response_code = str(reply.header.rcode)

            self.logger.log(
                domain=domain,
                query_type=query_type,
                decision="ALLOW",
                threat_type=None,
                response_code=response_code,
                response_time_ms=response_time,
            )

            print(
                f"CACHE HIT: {domain} [{query_type}] ({response_time:.2f} ms)"
            )
            return reply

        # ==========================================
        # 4 - 8. SECURITY PIPELINE & DECISION ENGINE
        # ==========================================
        # Evaluates:
        # - Blocklist
        # - Threat Intelligence (feeds & AbuseIPDB)
        # - AI/ML DGA & Malicious Pattern Detection
        # - Behavioral Analysis
        check_result = self.checker.check(domain, record_behavior=True)

        decision = check_result["decision"]
        threat_type = check_result.get("threat_type")
        reason = check_result.get("reason", "")

        print(f"Filtering decision: {domain} -> {decision} ({reason})")

        # ==========================================
        # 9. DNS RESPONSE (BLOCK)
        # ==========================================
        if decision in ("BLOCK", "DENY"):
            reply = request.reply()
            reply.header.rcode = 3  # NXDOMAIN
            response_time = (time.perf_counter() - start_time) * 1000

            self.logger.log(
                domain=domain,
                query_type=query_type,
                decision=decision,
                threat_type=threat_type,
                response_code="NXDOMAIN",
                response_time_ms=response_time,
            )

            print(f"BLOCKED: {domain} ({threat_type})")
            return reply

        # ==========================================
        # 9. DNS RESPONSE (FLAG / ALLOW)
        # ==========================================
        try:
            # Send request to upstream DNS resolver
            response = request.send(
                UPSTREAM_DNS,
                UPSTREAM_PORT,
                timeout=5,
            )

            reply = DNSRecord.parse(response)

            # Extract TTLs and cache if ALLOW
            ttls = []
            for rr in reply.rr:
                ttls.append(rr.ttl)
            for rr in reply.auth:
                ttls.append(rr.ttl)
            for rr in reply.ar:
                ttls.append(rr.ttl)

            if ttls and decision == "ALLOW":
                ttl = min(ttls)
                self.cache.set(cache_key, response, ttl)
                print(f"CACHE STORE: {domain} [{query_type}] TTL={ttl}s")

            response_time = (time.perf_counter() - start_time) * 1000
            response_code = str(reply.header.rcode)

            # ==========================================
            # 10. MYSQL LOGGING
            # ==========================================
            self.logger.log(
                domain=domain,
                query_type=query_type,
                decision=decision,
                threat_type=threat_type,
                response_code=response_code,
                response_time_ms=response_time,
            )

            print(f"RESOLVED ({decision}): {domain} ({response_time:.2f} ms)")
            return reply

        except Exception as e:
            print(f"DNS forwarding error: {e}")
            response_time = (time.perf_counter() - start_time) * 1000

            self.logger.log(
                domain=domain,
                query_type=query_type,
                decision="ERROR",
                threat_type=None,
                response_code="SERVFAIL",
                response_time_ms=response_time,
            )

            reply = request.reply()
            reply.header.rcode = 2  # SERVFAIL
            return reply


def main():

    print("======================================")
    print("       DNS FILTERING SYSTEM")
    print("======================================")

    # 1. Database
    print("Connecting to MySQL...")
    database = Database()
    print("MySQL connection established.")

    # 2. Blocklist
    print("Loading blocked domains...")
    blocklist = Blocklist(database)
    blocklist.load()
    print(f"Loaded {len(blocklist.domains)} blocked domains.")

    # 3. DNS Cache
    cache = DNSCache(max_size=10000)
    print("DNS cache initialized (max 10000 entries).")

    # 4. Behavioral Analyzer
    behavioral = BehavioralAnalyzer()
    print("Behavioral analyzer initialized.")

    # 5. Checker & Decision Engine
    checker = DNSChecker(
        blocklist=blocklist,
        database=database,
        cache=cache,
        behavioral_analyzer=behavioral,
    )
    print("DNS security evaluation engine initialized.")

    # 6. Logger
    logger = DNSLogger(
        database,
        max_size=LOG_QUEUE_SIZE
    )
    logger.start()

    # 7. Share components with API server
    set_components(database, blocklist, checker, cache, logger)

    # 8. Start Flask API server
    api_thread = threading.Thread(
        target=lambda: app.run(
            host="127.0.0.1",
            port=5000,
            debug=False,
            use_reloader=False
        ),
        daemon=True
    )
    api_thread.start()

    # 9. Resolver & DNS Server
    resolver = DNSFilterResolver(
        checker=checker,
        logger=logger,
        cache=cache,
        blocklist=blocklist
    )

    server = DNSServer(
        resolver,
        port=DNS_PORT,
        address=DNS_HOST
    )

    print()
    print("======================================")
    print("       DNS FILTERING SYSTEM READY")
    print("======================================")
    print(f"DNS Server     : {DNS_HOST}:{DNS_PORT}")
    print(f"Upstream DNS   : {UPSTREAM_DNS}:{UPSTREAM_PORT}")
    print(f"Blocked Domains: {len(blocklist.domains)}")
    print("Cache          : Enabled")
    print("Threat Intel   : Enabled")
    print("AI/ML DGA      : Enabled")
    print("Behavioral     : Enabled")
    print("Logging        : Enabled")
    print("Web API        : http://127.0.0.1:5000")
    print("======================================")
    print()

    server.start()


if __name__ == "__main__":
    main()
