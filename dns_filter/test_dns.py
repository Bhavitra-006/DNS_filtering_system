import sys

from dnslib import DNSRecord

from .config import DNS_HOST, DNS_PORT


if len(sys.argv) > 1:
    domain = sys.argv[1]
else:
    domain = "google.com"


request = DNSRecord.question(
    domain,
    "A"
)

response = request.send(
    DNS_HOST,
    DNS_PORT,
    timeout=5
)

dns_response = DNSRecord.parse(
    response
)

print("Domain:", domain)
print("Response:")
print(dns_response)