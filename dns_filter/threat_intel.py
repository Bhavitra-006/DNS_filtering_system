from datetime import datetime

from .normalizer import normalize_domain


class ThreatIntelManager:

    def __init__(self, database):
        self.database = database

    def add_indicator(
        self,
        domain,
        threat_type,
        source,
        confidence=0,
    ):
        """
        Add or update a threat intelligence indicator.
        """

        domain = normalize_domain(domain)

        if not domain:
            return False

        if not threat_type:
            return False

        if not source:
            return False

        confidence = max(0, min(100, int(confidence)))

        connection = self.database.get_connection()

        try:
            cursor = connection.cursor()

            now = datetime.now()

            cursor.execute(
                """
                INSERT INTO threat_intel
                (
                    domain,
                    threat_type,
                    source,
                    confidence,
                    first_seen,
                    last_seen,
                    active
                )
                VALUES (%s, %s, %s, %s, %s, %s, TRUE)

                ON DUPLICATE KEY UPDATE
                    threat_type = VALUES(threat_type),
                    confidence = VALUES(confidence),
                    last_seen = VALUES(last_seen),
                    active = TRUE
                """,
                (
                    domain,
                    threat_type,
                    source,
                    confidence,
                    now,
                    now,
                ),
            )

            connection.commit()

            return True

        finally:
            cursor.close()
            connection.close()

    def add_indicators(self, indicators):
        """
        Add multiple threat intelligence indicators.
        """

        added = 0

        for indicator in indicators:

            success = self.add_indicator(
                domain=indicator.get("domain"),
                threat_type=indicator.get("threat_type"),
                source=indicator.get("source"),
                confidence=indicator.get("confidence", 0),
            )

            if success:
                added += 1

        return added

    def deactivate_indicator(self, domain, source):
        """
        Mark a threat indicator as inactive.
        """

        domain = normalize_domain(domain)

        if not domain:
            return False

        connection = self.database.get_connection()

        try:
            cursor = connection.cursor()

            cursor.execute(
                """
                UPDATE threat_intel
                SET active = FALSE,
                    last_seen = %s
                WHERE domain = %s
                  AND source = %s
                """,
                (
                    datetime.now(),
                    domain,
                    source,
                ),
            )

            connection.commit()

            return cursor.rowcount > 0

        finally:
            cursor.close()
            connection.close()

    def get_active_indicators(self):
        """
        Return all active threat intelligence indicators.
        """

        connection = self.database.get_connection()

        try:
            cursor = connection.cursor(dictionary=True)

            cursor.execute(
                """
                SELECT
                    domain,
                    threat_type,
                    source,
                    confidence
                FROM threat_intel
                WHERE active = TRUE
                """
            )

            return cursor.fetchall()

        finally:
            cursor.close()
            connection.close()

    def sync_blocklist(self):
        """
        Synchronize active threat intelligence indicators
        into blocked_domains.

        Only entries generated from threat intelligence
        are modified.

        Manual blocklist entries remain untouched.
        """

        connection = self.database.get_connection()

        try:
            cursor = connection.cursor()

            # Remove only previously synchronized
            # threat-intelligence entries.
            cursor.execute(
                """
                DELETE FROM blocked_domains
                WHERE source = 'threat_intel'
                """
            )

            # Insert currently active threat indicators.
            cursor.execute(
                """
                INSERT INTO blocked_domains
                (
                    domain,
                    source,
                    threat_type
                )
                SELECT
                    domain,
                    'threat_intel',
                    threat_type
                FROM threat_intel
                WHERE active = TRUE
                ON DUPLICATE KEY UPDATE
                    source = 'threat_intel',
                    threat_type = VALUES(threat_type)
                """
            )

            connection.commit()

            return cursor.rowcount

        finally:
            cursor.close()
            connection.close()