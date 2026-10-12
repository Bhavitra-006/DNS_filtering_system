from flask import Flask, jsonify, request
from flask_cors import CORS

from .database import Database
from .blocklist import Blocklist
from .checker import DNSChecker
from .cache import DNSCache
from .threat_intel import ThreatIntelManager
from .normalizer import normalize_domain


app = Flask(__name__)
CORS(app)


# Global instances (can be injected by server.py or lazily initialized)
database = None
blocklist = None
checker = None
cache = None
logger = None


def get_components():
    global database, blocklist, checker, cache
    if database is None:
        database = Database()
    if blocklist is None:
        blocklist = Blocklist(database)
        blocklist.load()
    if cache is None:
        cache = DNSCache(max_size=10000)
    if checker is None:
        checker = DNSChecker(blocklist, database=database, cache=cache)
    return database, blocklist, checker, cache


def set_components(db, bl, chk, cch, log=None):
    global database, blocklist, checker, cache, logger
    database = db
    blocklist = bl
    checker = chk
    cache = cch
    logger = log


# ============================================================
# STATUS
# ============================================================

@app.route("/api/status", methods=["GET"])
def status():
    db, bl, chk, cch = get_components()
    c_stats = cch.stats() if cch else {}

    # Fetch DB counts for the dashboard
    db_stats = {}
    try:
        raw = db.get_stats() if db else {}
        db_stats = {
            "connected": True,
            "queries_count": raw.get("total_queries", 0),
            "blocked_domains_count": raw.get("blocked_domains", 0),
            "threat_intel_count": raw.get("active_threat_indicators", 0),
        }
    except Exception:
        db_stats = {"connected": False, "queries_count": "N/A",
                    "blocked_domains_count": "N/A", "threat_intel_count": "N/A"}

    # Blocklist info
    bl_info = {
        "domain_count": len(bl.domains) if bl else 0,
        "source": "database + hosts file",
    }

    # Cache info
    cache_info = {
        "decision_count": c_stats.get("decision_cache_size", c_stats.get("size", 0)),
        "dns_count": c_stats.get("dns_cache_size", 0),
    }

    # ML info — try to get feature count from model
    ml_info = {"model": "dga_model.pkl", "features": "16"}
    try:
        from .ml.detector import _model_data
        if _model_data and "features" in _model_data:
            ml_info["features"] = str(len(_model_data["features"]))
    except Exception:
        pass

    return jsonify({
        "status": "READY",
        "api_host": "127.0.0.1",
        "api_port": 5000,
        "dns_host": "127.0.0.1",
        "dns_port": 5354,
        "upstream_dns": "8.8.8.8",
        "upstream_port": 53,
        "dns_server_running": True,
        "database": db_stats,
        "blocklist": bl_info,
        "cache": cache_info,
        "ml": ml_info,
        # Legacy flat keys for backward compat
        "database_status": "ONLINE" if db_stats.get("connected") else "OFFLINE",
        "cache_stats": c_stats,
        "blocked_domains_count": bl_info["domain_count"],
        "ml_model_status": "LOADED"
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
    db, bl, _, _ = get_components()
    try:
        details = db.get_blocked_domains_details()
        domain_names = sorted(list(bl.domains))
        return jsonify({
            "count": len(domain_names),
            "domains": domain_names,
            "details": details
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# ADD BLOCKED DOMAIN
# ============================================================

@app.route("/api/domains", methods=["POST"])
def add_domain():
    db, bl, _, cch = get_components()
    data = request.get_json()

    if not data or not data.get("domain"):
        return jsonify({"error": "Domain is required"}), 400

    raw_domain = data["domain"]
    domain = normalize_domain(raw_domain)

    if not domain:
        return jsonify({"error": "Invalid domain name"}), 400

    source = data.get("source", "manual")
    threat_type = data.get("threat_type", "blocked_domain")

    connection = None
    cursor = None
    try:
        connection = db.get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO blocked_domains (domain, source, threat_type)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE
                source = VALUES(source),
                threat_type = VALUES(threat_type)
            """,
            (domain, source, threat_type)
        )
        connection.commit()

        # Update in-memory blocklist
        bl.add(domain)

        # Invalidate any cache entries for this domain immediately
        if cch:
            cch.invalidate(domain)

        return jsonify({
            "message": "Domain blocked successfully",
            "domain": domain,
            "threat_type": threat_type,
            "source": source
        }), 201

    except Exception as e:
        if connection:
            connection.rollback()
        return jsonify({"error": str(e)}), 400

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
    db, bl, _, cch = get_components()
    clean_domain = normalize_domain(domain) or domain.strip().lower().rstrip(".")

    connection = None
    cursor = None
    try:
        connection = db.get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "DELETE FROM blocked_domains WHERE domain = %s",
            (clean_domain,)
        )
        connection.commit()

        # Update in-memory blocklist
        bl.remove(clean_domain)

        # Invalidate cache for domain
        if cch:
            cch.invalidate(clean_domain)

        return jsonify({
            "message": "Domain removed successfully",
            "domain": clean_domain
        })

    except Exception as e:
        if connection:
            connection.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# ============================================================
# CHECK DOMAIN (Forensic Security Analysis Pipeline)
# ============================================================

@app.route("/api/check", methods=["GET"])
def check_domain():
    _, _, chk, _ = get_components()
    raw_domain = request.args.get("domain", "").strip()

    if not raw_domain:
        return jsonify({"error": "Domain query parameter is required"}), 400

    try:
        result = chk.check(raw_domain, record_behavior=False)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# STATISTICS
# ============================================================

@app.route("/api/stats", methods=["GET"])
def stats():
    db, _, _, cch = get_components()
    try:
        res = db.get_stats()
        c_stats = cch.stats() if cch else {}
        res["cache_hit_rate"] = f"{c_stats.get('hit_rate', 0):.1f}%"
        res["cache_hits"] = c_stats.get("hits", 0)
        res["cache_misses"] = c_stats.get("misses", 0)
        return jsonify(res)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# RECENT DNS QUERIES
# ============================================================

@app.route("/api/queries", methods=["GET"])
def queries():
    db, _, _, _ = get_components()
    try:
        limit = min(int(request.args.get("limit", 50)), 200)
        rows = db.get_recent_queries(limit=limit)
        return jsonify({
            "count": len(rows),
            "queries": rows
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# ANALYTICS
# ============================================================

@app.route("/api/analytics", methods=["GET"])
def analytics():
    db, _, _, _ = get_components()
    try:
        data = db.get_analytics()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# THREAT INTELLIGENCE
# ============================================================

@app.route("/api/threat-intel", methods=["GET"])
def threat_intel():
    db, _, _, _ = get_components()
    try:
        indicators = db.get_active_threat_indicators(limit=100)
        return jsonify({
            "count": len(indicators),
            "indicators": indicators
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/threat-intel/sync", methods=["POST"])
def sync_threat_intel():
    db, bl, _, cch = get_components()
    try:
        import threading

        def _run_sync():
            try:
                from .feed_updater import update_feeds
                result = update_feeds(database=db, max_per_feed=2000)
                # Reload blocklist into memory after feed update
                bl.load()
                # Clear decision cache so new blocks take effect immediately
                if cch:
                    cch.clear()
                print(f"[Sync] Complete: {result}")
            except Exception as e:
                print(f"[Sync] Error: {e}")

        # Run feed download in background (it can take 10-30 seconds)
        t = threading.Thread(target=_run_sync, daemon=True)
        t.start()

        return jsonify({
            "message": "Threat feed sync started in background. URLHaus, Hagezi and StevenBlack feeds downloading...",
            "note": "Blocklist will reload automatically when download completes (~10-30 seconds).",
            "total_blocked_domains": len(bl.domains)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# STANDALONE ENTRY POINT
# ============================================================

if __name__ == "__main__":
    get_components()
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )