import mysql.connector
from mysql.connector import pooling

from .config import (
    MYSQL_HOST,
    MYSQL_PORT,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DATABASE,
    MYSQL_POOL_SIZE,
)


class Database:

    def __init__(self):

        if not MYSQL_PASSWORD:
            raise RuntimeError(
                "MYSQL_PASSWORD environment variable is not set."
            )

        self.pool = pooling.MySQLConnectionPool(
            pool_name="dns_filter_pool",
            pool_size=MYSQL_POOL_SIZE,
            pool_reset_session=True,

            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE,
        )

    def get_connection(self):
        return self.pool.get_connection()

    def load_blocked_domains(self):

        connection = self.get_connection()

        try:
            cursor = connection.cursor()

            cursor.execute("""
                SELECT domain
                FROM blocked_domains
            """)

            domains = {
                row[0].rstrip(".").lower()
                for row in cursor.fetchall()
            }

            return domains

        finally:
            cursor.close()
            connection.close()

    def is_allowed_domain(self, domain):
        """Return True for active trusted domains and their subdomains."""
        domain = domain.rstrip(".").lower()

        connection = self.get_connection()
        cursor = None

        try:
            cursor = connection.cursor()
            cursor.execute("""
                SELECT domain
                FROM allowed_domains
                WHERE active = 1
            """)

            allowed_domains = {
                row[0].rstrip(".").lower()
                for row in cursor.fetchall()
            }

            return any(
                domain == trusted or domain.endswith("." + trusted)
                for trusted in allowed_domains
            )

        finally:
            if cursor is not None:
                cursor.close()
            connection.close()

    def get_blocked_domains_details(self):
        connection = self.get_connection()
        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("""
                SELECT
                    id,
                    domain,
                    source,
                    threat_type,
                    created_at
                FROM blocked_domains
                ORDER BY id DESC
            """)
            rows = cursor.fetchall()
            for row in rows:
                if row.get("created_at"):
                    row["created_at"] = row["created_at"].strftime("%Y-%m-%d %H:%M:%S")
            return rows
        finally:
            cursor.close()
            connection.close()

    def check_threat_intel(self, domain):
        """
        Check if domain is registered in the active threat intelligence table.
        """
        domain = domain.rstrip(".").lower()
        connection = self.get_connection()
        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("""
                SELECT
                    domain,
                    threat_type,
                    source,
                    confidence
                FROM threat_intel
                WHERE active = 1 AND domain = %s
                LIMIT 1
            """, (domain,))
            return cursor.fetchone()
        finally:
            cursor.close()
            connection.close()

    def get_active_threat_indicators(self, limit=100):
        connection = self.get_connection()
        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("""
                SELECT
                    id,
                    domain,
                    threat_type,
                    source,
                    confidence,
                    first_seen,
                    last_seen,
                    active
                FROM threat_intel
                WHERE active = 1
                ORDER BY last_seen DESC
                LIMIT %s
            """, (limit,))
            rows = cursor.fetchall()
            for r in rows:
                if r.get("first_seen"):
                    r["first_seen"] = r["first_seen"].strftime("%Y-%m-%d %H:%M:%S")
                if r.get("last_seen"):
                    r["last_seen"] = r["last_seen"].strftime("%Y-%m-%d %H:%M:%S")
            return rows
        finally:
            cursor.close()
            connection.close()

    def log_dns_query(
        self,
        domain,
        query_type,
        decision,
        threat_type=None,
        response_code=None,
        response_time_ms=None,
    ):

        connection = self.get_connection()

        try:
            cursor = connection.cursor()

            cursor.execute("""
                INSERT INTO dns_queries
                (
                    domain,
                    query_type,
                    decision,
                    threat_type,
                    response_code,
                    response_time_ms
                )
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                domain,
                query_type,
                decision,
                threat_type,
                response_code,
                response_time_ms,
            ))

            connection.commit()

        finally:
            cursor.close()
            connection.close()

    def get_stats(self):
        connection = self.get_connection()
        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("""
                SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN decision = 'BLOCK' THEN 1 ELSE 0 END) AS blocked,
                    SUM(CASE WHEN decision = 'ALLOW' THEN 1 ELSE 0 END) AS allowed,
                    SUM(CASE WHEN decision = 'FLAG' THEN 1 ELSE 0 END) AS flagged,
                    SUM(CASE WHEN threat_type IS NOT NULL AND threat_type != '' AND decision != 'ALLOW' THEN 1 ELSE 0 END) AS threats_detected
                FROM dns_queries
            """)
            result = cursor.fetchone() or {}

            cursor.execute("SELECT COUNT(*) AS active_rules FROM blocked_domains")
            rules_res = cursor.fetchone() or {}

            cursor.execute("SELECT COUNT(*) AS active_indicators FROM threat_intel WHERE active = 1")
            ti_res = cursor.fetchone() or {}

            total = int(result.get("total") or 0)
            blocked = int(result.get("blocked") or 0)
            allowed = int(result.get("allowed") or 0)
            flagged = int(result.get("flagged") or 0)
            threats = int(result.get("threats_detected") or 0)

            block_rate = f"{(blocked / total * 100):.1f}%" if total > 0 else "0.0%"

            return {
                "total": total,
                "blocked": blocked,
                "allowed": allowed,
                "flagged": flagged,
                "threats_detected": threats,
                "block_rate": block_rate,
                "active_rules": int(rules_res.get("active_rules") or 0),
                "active_indicators": int(ti_res.get("active_indicators") or 0),
            }
        finally:
            cursor.close()
            connection.close()

    def get_recent_queries(self, limit=50):
        connection = self.get_connection()
        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("""
                SELECT
                    id,
                    domain,
                    query_type,
                    decision,
                    threat_type,
                    response_code,
                    response_time_ms,
                    queried_at
                FROM dns_queries
                ORDER BY queried_at DESC, id DESC
                LIMIT %s
            """, (limit,))
            rows = cursor.fetchall()
            for row in rows:
                if row.get("queried_at"):
                    row["queried_at"] = row["queried_at"].strftime("%Y-%m-%d %H:%M:%S")
                if row.get("response_time_ms") is not None:
                    row["response_time_ms"] = float(row["response_time_ms"])
            return rows
        finally:
            cursor.close()
            connection.close()

    def get_analytics(self):
        connection = self.get_connection()
        try:
            cursor = connection.cursor(dictionary=True)

            # 1. Top queried domains
            cursor.execute("""
                SELECT domain, COUNT(*) as count
                FROM dns_queries
                GROUP BY domain
                ORDER BY count DESC
                LIMIT 10
            """)
            top_queried = cursor.fetchall()

            # 2. Top blocked domains
            cursor.execute("""
                SELECT domain, threat_type, COUNT(*) as count
                FROM dns_queries
                WHERE decision = 'BLOCK'
                GROUP BY domain, threat_type
                ORDER BY count DESC
                LIMIT 10
            """)
            top_blocked = cursor.fetchall()

            # 3. Query type distribution
            cursor.execute("""
                SELECT query_type, COUNT(*) as count
                FROM dns_queries
                GROUP BY query_type
                ORDER BY count DESC
            """)
            query_types = cursor.fetchall()

            # 4. Threat category breakdown
            cursor.execute("""
                SELECT threat_type, COUNT(*) as count
                FROM dns_queries
                WHERE threat_type IS NOT NULL AND threat_type != ''
                GROUP BY threat_type
                ORDER BY count DESC
            """)
            threat_cats = cursor.fetchall()

            # 5. Hourly timeline (last 24 hours)
            cursor.execute("""
                SELECT
                    DATE_FORMAT(queried_at, '%H:00') as time,
                    COUNT(*) as total,
                    SUM(CASE WHEN decision = 'ALLOW' THEN 1 ELSE 0 END) as allowed,
                    SUM(CASE WHEN decision = 'BLOCK' THEN 1 ELSE 0 END) as blocked,
                    SUM(CASE WHEN decision = 'FLAG' THEN 1 ELSE 0 END) as flagged
                FROM dns_queries
                WHERE queried_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                GROUP BY DATE_FORMAT(queried_at, '%H:00')
                ORDER BY MIN(queried_at) ASC
            """)
            hourly = cursor.fetchall()

            return {
                "top_queried": top_queried,
                "top_blocked": top_blocked,
                "query_types": query_types,
                "threat_categories": threat_cats,
                "hourly_timeline": hourly,
            }
        finally:
            cursor.close()
            connection.close()