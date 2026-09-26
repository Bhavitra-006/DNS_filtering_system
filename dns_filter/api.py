from flask import Flask, jsonify, request
from flask_cors import CORS

from .database import Database
from .blocklist import Blocklist
from .checker import DNSChecker


app = Flask(__name__)
CORS(app)


# ============================================================
# INITIALIZE BACKEND COMPONENTS
# ============================================================

print("======================================")
print("       DNS FILTERING API")
print("======================================")

print("Connecting to MySQL...")

database = Database()

print("MySQL connection established.")

print("Loading blocked domains...")

blocklist = Blocklist(database)
blocklist.load()

print(
    f"Loaded {len(blocklist.domains)} blocked domains."
)

print("Initializing DNS checker...")

checker = DNSChecker(blocklist)

print("DNS checker initialized.")
print("--------------------------------------")
print("API Server: 127.0.0.1:5353")
print("DNS Server: 127.0.0.1:5354")
print("--------------------------------------")


# ============================================================
# STATUS
# ============================================================

@app.route("/api/status", methods=["GET"])
def status():

    return jsonify({
        "status": "READY",
        "api_host": "127.0.0.1",
        "api_port": 5353,
        "dns_host": "127.0.0.1",
        "dns_port": 5354,
        "upstream_dns": "8.8.8.8"
    })


# ============================================================
# HEALTH
# ============================================================

@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "status": "OK",
        "message": "DNS Filtering API is running"
    })


# ============================================================
# GET BLOCKED DOMAINS
# ============================================================

@app.route("/api/domains", methods=["GET"])
def get_domains():

    try:

        domains = database.load_blocked_domains()

        return jsonify({
            "count": len(domains),
            "domains": sorted(domains)
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# ADD BLOCKED DOMAIN
# ============================================================

@app.route("/api/domains", methods=["POST"])
def add_domain():

    data = request.get_json()

    if not data or not data.get("domain"):

        return jsonify({
            "error": "Domain is required"
        }), 400

    domain = (
        data["domain"]
        .strip()
        .lower()
        .rstrip(".")
    )

    connection = None
    cursor = None

    try:

        connection = database.get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO blocked_domains (domain)
            VALUES (%s)
            """,
            (domain,)
        )

        connection.commit()

        # Update API's in-memory blocklist
        blocklist.add(domain)

        return jsonify({
            "message": "Domain blocked successfully",
            "domain": domain
        }), 201

    except Exception as e:

        if connection:
            connection.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# DELETE BLOCKED DOMAIN
# ============================================================

@app.route("/api/domains/<path:domain>", methods=["DELETE"])
def delete_domain(domain):

    domain = (
        domain
        .strip()
        .lower()
        .rstrip(".")
    )

    connection = None
    cursor = None

    try:

        connection = database.get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM blocked_domains
            WHERE domain = %s
            """,
            (domain,)
        )

        connection.commit()

        # Update API's in-memory blocklist
        blocklist.remove(domain)

        return jsonify({
            "message": "Domain removed successfully",
            "domain": domain
        })

    except Exception as e:

        if connection:
            connection.rollback()

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# CHECK DOMAIN
# ============================================================

@app.route("/api/check", methods=["GET"])
def check_domain():

    domain = (
        request.args.get("domain", "")
        .strip()
        .lower()
        .rstrip(".")
    )

    if not domain:

        return jsonify({
            "error": "Domain is required"
        }), 400

    try:

        result = checker.check(domain)

        return jsonify({
            "domain": domain,
            **result
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# STATISTICS
# ============================================================

@app.route("/api/stats", methods=["GET"])
def stats():

    connection = None
    cursor = None

    try:

        connection = database.get_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(
            """
            SELECT
                COUNT(*) AS total,

                SUM(
                    CASE
                        WHEN decision = 'BLOCK'
                        THEN 1
                        ELSE 0
                    END
                ) AS blocked,

                SUM(
                    CASE
                        WHEN decision = 'ALLOW'
                        THEN 1
                        ELSE 0
                    END
                ) AS allowed

            FROM dns_queries
            """
        )

        result = cursor.fetchone()

        return jsonify({
            "total": result["total"] or 0,
            "blocked": result["blocked"] or 0,
            "allowed": result["allowed"] or 0
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# RECENT DNS QUERIES
# ============================================================

@app.route("/api/queries", methods=["GET"])
def queries():

    connection = None
    cursor = None

    try:

        connection = database.get_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        cursor.execute(
            """
            SELECT
                domain,
                query_type,
                decision,
                threat_type,
                response_code,
                response_time_ms,
                queried_at

            FROM dns_queries

            ORDER BY queried_at DESC

            LIMIT 50
            """
        )

        rows = cursor.fetchall()

        for row in rows:

            if row.get("queried_at"):

                row["queried_at"] = (
                    row["queried_at"].isoformat()
                )

        return jsonify({
            "count": len(rows),
            "queries": rows
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ============================================================
# START API SERVER
# ============================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5353,
        debug=True
    )