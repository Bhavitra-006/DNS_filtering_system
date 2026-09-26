import re


MAX_DOMAIN_LENGTH = 253


def normalize_domain(domain):
    """
    Normalize a domain into a canonical form.

    Examples:
        "Google.COM." -> "google.com"
        "  Example.com  " -> "example.com"
    """

    if not domain:
        return None

    domain = domain.strip().lower()

    # Remove trailing dot
    domain = domain.rstrip(".")

    # Remove surrounding whitespace again
    domain = domain.strip()

    # Domain length validation
    if not domain or len(domain) > MAX_DOMAIN_LENGTH:
        return None

    # Remove accidental URL prefixes
    if domain.startswith("http://"):
        domain = domain[7:]

    elif domain.startswith("https://"):
        domain = domain[8:]

    # Remove path if feed contains a URL
    domain = domain.split("/", 1)[0]

    # Remove port if present
    domain = domain.split(":", 1)[0]

    # Basic domain validation
    pattern = r"^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$"

    if not re.match(pattern, domain):
        return None

    return domain


def normalize_domains(domains):
    """
    Normalize and deduplicate multiple domains.
    """

    normalized = set()

    for domain in domains:

        clean_domain = normalize_domain(domain)

        if clean_domain:
            normalized.add(clean_domain)

    return normalized
    