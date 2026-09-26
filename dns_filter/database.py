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