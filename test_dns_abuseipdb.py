from dnslib import DNSRecord
import socket


DNS_SERVER = "127.0.0.1"
DNS_PORT = 5354


def query_dns(domain):
    request = DNSRecord.question(domain, "A")

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(5)

    try:
        sock.sendto(
            request.pack(),
            (DNS_SERVER, DNS_PORT)
        )

        response, _ = sock.recvfrom(4096)

        reply = DNSRecord.parse(response)

        print("\n==============================")
        print("DNS TEST")
        print("==============================")
        print("Domain:", domain)
        print("Response Code:", reply.header.rcode)

        for answer in reply.rr:
            print("Answer:", answer)

    except Exception as e:
        print("DNS test failed:", e)

    finally:
        sock.close()


query_dns("google.com")