import os

from dotenv import load_dotenv


# ==========================================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================================

load_dotenv()


# ==========================================================
# DNS SERVER
# ==========================================================

DNS_HOST = os.getenv(
    "DNS_HOST",
    "127.0.0.1"
)

DNS_PORT = int(
    os.getenv(
        "DNS_PORT",
        "5354"
    )
)


# ==========================================================
# UPSTREAM DNS
# ==========================================================

UPSTREAM_DNS = os.getenv(
    "UPSTREAM_DNS",
    "8.8.8.8"
)

UPSTREAM_PORT = int(
    os.getenv(
        "UPSTREAM_PORT",
        "53"
    )
)


# ==========================================================
# MYSQL DATABASE
# ==========================================================

MYSQL_HOST = os.getenv(
    "MYSQL_HOST",
    "localhost"
)

MYSQL_PORT = int(
    os.getenv(
        "MYSQL_PORT",
        "3306"
    )
)

MYSQL_USER = os.getenv(
    "MYSQL_USER",
    "root"
)

MYSQL_PASSWORD = os.getenv(
    "MYSQL_PASSWORD"
)

MYSQL_DATABASE = os.getenv(
    "MYSQL_DATABASE",
    "dns_filtering"
)


# ==========================================================
# DATABASE CONNECTION POOL
# ==========================================================

MYSQL_POOL_SIZE = int(
    os.getenv(
        "MYSQL_POOL_SIZE",
        "5"
    )
)


# ==========================================================
# DNS LOGGING
# ==========================================================

LOG_QUEUE_SIZE = int(
    os.getenv(
        "LOG_QUEUE_SIZE",
        "10000"
    )
)


# ==========================================================
# THREAT INTELLIGENCE
# ==========================================================

URLHAUS_AUTH_KEY = os.getenv(
    "URLHAUS_AUTH_KEY"
)


# ==========================================================
# THREAT FEED SCHEDULER
# ==========================================================

THREAT_FEED_INTERVAL = int(
    os.getenv(
        "THREAT_FEED_INTERVAL",
        "3600"
    )
)