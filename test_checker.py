from dns_filter.blocklist import Blocklist
from dns_filter.database import Database
from dns_filter.checker import DNSChecker


database = Database()

blocklist = Blocklist(database)
blocklist.load()

checker = DNSChecker(blocklist)


print("\n===== BLOCKED DOMAIN TEST =====")

result = checker.check("malicious.test")

print(result)


print("\n===== SAFE DOMAIN TEST =====")

result = checker.check("google.com")

print(result)