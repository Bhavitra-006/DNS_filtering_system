import time
import threading

from .api import app

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


class DNSFilterResolver(BaseResolver):

    def __init__(self, checker, logger, cache):
        self.checker = checker
        self.logger = logger
        self.cache = cache

    def resolve(self, request, handler):

        start_time = time.perf_counter()

        # ==========================================
        # EXTRACT DOMAIN AND QUERY TYPE
        # ==========================================

        domain = str(request.q.qname).rstrip(".").lower()
        query_type = QTYPE[request.q.qtype]

        print(
            f"DNS Query: {domain} "
            f"[{query_type}]"
        )

        # ==========================================
        # THREAT / BLOCKLIST CHECK
        # ==========================================

        # DNSChecker performs:
        # 1. Local blocklist check
        # 2. Domain -> IP resolution
        # 3. Threat Intelligence lookup
        # 4. AbuseIPDB reputation check

        check_result = self.checker.check(domain)

        decision = check_result["decision"]
        threat_type = check_result["threat_type"]
        ip_address = check_result["ip_address"]
        abuse_score = check_result["abuse_confidence_score"]

        print(
            f"Filtering decision: {domain} "
            f"-> {decision}"
        )

        if threat_type:
            print(
                f"Threat type: {threat_type}"
            )

        if ip_address:
            print(
                f"Resolved IP: {ip_address}"
            )

        if abuse_score is not None:
            print(
                f"Abuse Confidence Score: "
                f"{abuse_score}"
            )

        # ==========================================
        # BLOCK
        # ==========================================

        if decision == "BLOCK":

            reply = request.reply()

            # NXDOMAIN
            reply.header.rcode = 3

            response_time = (
                time.perf_counter() - start_time
            ) * 1000

            self.logger.log(
                domain=domain,
                query_type=query_type,
                decision="BLOCK",
                threat_type=threat_type,
                response_code="NXDOMAIN",
                response_time_ms=response_time,
            )

            print(
                f"BLOCKED: {domain} "
                f"({threat_type})"
            )

            return reply

        # ==========================================
        # DNS CACHE LOOKUP
        # ==========================================

        cache_key = f"{domain}:{query_type}"

        cached_response = self.cache.get(cache_key)

        if cached_response is not None:

            reply = DNSRecord.parse(cached_response)

            response_time = (
                time.perf_counter() - start_time
            ) * 1000

            response_code = str(
                reply.header.rcode
            )

            self.logger.log(
                domain=domain,
                query_type=query_type,
                decision="ALLOW",
                threat_type=threat_type,
                response_code=response_code,
                response_time_ms=response_time,
            )

            print(
                f"CACHE HIT: {domain} "
                f"[{query_type}] "
                f"({response_time:.2f} ms)"
            )

            return reply

        # ==========================================
        # CACHE MISS → UPSTREAM DNS
        # ==========================================

        print(
            f"CACHE MISS: {domain} "
            f"[{query_type}]"
        )

        try:

            # Send request to upstream DNS
            response = request.send(
                UPSTREAM_DNS,
                UPSTREAM_PORT,
                timeout=5,
            )

            # Convert response bytes into DNSRecord
            reply = DNSRecord.parse(response)

            # ======================================
            # DETERMINE TTL
            # ======================================

            ttls = []

            # Answer records
            for rr in reply.rr:
                ttls.append(rr.ttl)

            # Authority records
            for rr in reply.auth:
                ttls.append(rr.ttl)

            # Additional records
            for rr in reply.ar:
                ttls.append(rr.ttl)

            # ======================================
            # STORE RESPONSE IN CACHE
            # ======================================

            if ttls:

                ttl = min(ttls)

                self.cache.set(
                    cache_key,
                    response,
                    ttl,
                )

                print(
                    f"CACHE STORE: {domain} "
                    f"[{query_type}] "
                    f"TTL={ttl}s"
                )

            # ======================================
            # RESPONSE TIME
            # ======================================

            response_time = (
                time.perf_counter() - start_time
            ) * 1000

            response_code = str(
                reply.header.rcode
            )

            # ======================================
            # LOG QUERY
            # ======================================

            self.logger.log(
                domain=domain,
                query_type=query_type,
                decision="ALLOW",
                threat_type=threat_type,
                response_code=response_code,
                response_time_ms=response_time,
            )

            print(
                f"FORWARDED: {domain} "
                f"({response_time:.2f} ms)"
            )

            return reply

        # ==========================================
        # UPSTREAM ERROR
        # ==========================================

        except Exception as e:

            print(
                f"DNS forwarding error: {e}"
            )

            response_time = (
                time.perf_counter() - start_time
            ) * 1000

            self.logger.log(
                domain=domain,
                query_type=query_type,
                decision="ERROR",
                threat_type=None,
                response_code="SERVFAIL",
                response_time_ms=response_time,
            )

            reply = request.reply()

            # SERVFAIL
            reply.header.rcode = 2

            return reply


def main():

    print("======================================")
    print("       DNS FILTERING SYSTEM")
    print("======================================")

    # ==========================================
    # DATABASE
    # ==========================================

    print("Connecting to MySQL...")

    database = Database()

    print("MySQL connection established.")

    # ==========================================
    # BLOCKLIST
    # ==========================================

    print("Loading blocked domains...")

    blocklist = Blocklist(database)
    blocklist.load()

    print(
        f"Loaded {len(blocklist.domains)} "
        f"blocked domains."
    )

    # ==========================================
    # CHECKER
    # ==========================================

    checker = DNSChecker(blocklist)

    print("DNS filtering engine initialized.")

    # ==========================================
    # DNS CACHE
    # ==========================================

    cache = DNSCache(
        max_size=10000
    )

    print(
        "DNS cache initialized "
        "(max 10000 entries)."
    )

    # ==========================================
    # LOGGER
    # ==========================================

    logger = DNSLogger(
        database,
        max_size=LOG_QUEUE_SIZE
    )

    logger.start()

    # ==========================================
    # API SERVER
    # ==========================================

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

    # ==========================================
    # DNS RESOLVER
    # ==========================================

    resolver = DNSFilterResolver(
        checker,
        logger,
        cache
    )

    # ==========================================
    # DNS SERVER
    # ==========================================

    server = DNSServer(
        resolver,
        port=DNS_PORT,
        address=DNS_HOST
    )

    print()
    print("======================================")
    print("       DNS FILTERING SYSTEM READY")
    print("======================================")
    print(
        f"DNS Server     : "
        f"{DNS_HOST}:{DNS_PORT}"
    )
    print(
        f"Upstream DNS   : "
        f"{UPSTREAM_DNS}:{UPSTREAM_PORT}"
    )
    print(
        f"Blocked Domains: "
        f"{len(blocklist.domains)}"
    )
    print("Cache          : Enabled")
    print("AbuseIPDB      : Enabled")
    print("Threat Intel   : Enabled")
    print("Logging        : Enabled")
    print("Web API        : http://127.0.0.1:5000")
    print("Dashboard      : Open frontend/index.html")
    print("======================================")
    print()

    # ==========================================
    # START DNS SERVER
    # ==========================================

    server.start()


if __name__ == "__main__":
    main()
