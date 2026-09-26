from .normalizer import normalize_domain


class FeedValidator:

    ALLOWED_THREAT_TYPES = {
        "PHISHING",
        "MALWARE",
        "C2",
        "C2_BOTNET",
        "BOTNET",
        "SPAM",
        "SCAM",
        "DGA",
    }

    def validate_entry(self, line):

        if not line:
            return None

        line = line.strip()

        if not line:
            return None

        if line.startswith("#"):
            return None

        parts = line.split(",", 1)

        if len(parts) != 2:
            return None

        domain = normalize_domain(parts[0])

        threat_type = parts[1].strip().upper()

        if not domain:
            return None

        if threat_type not in self.ALLOWED_THREAT_TYPES:
            return None

        return {
            "domain": domain,
            "threat_type": threat_type,
        }

    def validate_feed(self, lines):

        valid_entries = []
        invalid = 0
        seen = set()

        for line in lines:

            if not line.strip():
                continue

            if line.strip().startswith("#"):
                continue

            entry = self.validate_entry(line)

            if entry is None:
                invalid += 1
                continue

            key = (
                entry["domain"],
                entry["threat_type"],
            )

            if key in seen:
                continue

            seen.add(key)

            valid_entries.append(entry)

        return {
            "entries": valid_entries,
            "valid": len(valid_entries),
            "invalid": invalid,
        }