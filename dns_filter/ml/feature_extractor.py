import math
from collections import Counter


def calculate_entropy(text):
    """Calculate Shannon entropy of a string."""
    if not text:
        return 0.0

    counts = Counter(text)
    length = len(text)

    entropy = 0.0

    for count in counts.values():
        probability = count / length
        entropy -= probability * math.log2(probability)

    return entropy


def longest_digit_sequence(text):
    """Find the longest consecutive sequence of digits."""
    longest = 0
    current = 0

    for char in text:
        if char.isdigit():
            current += 1
            longest = max(longest, current)
        else:
            current = 0

    return longest


def repeated_character_count(text):
    """Count repeated adjacent characters."""
    count = 0

    for i in range(1, len(text)):
        if text[i] == text[i - 1]:
            count += 1

    return count


def extract_features(domain):
    """
    Extract lexical features from a domain name.

    Returns a dictionary suitable for ML training/prediction.
    """

    domain = domain.lower().strip().rstrip(".")

    # Remove protocol if accidentally supplied
    domain = domain.replace("http://", "")
    domain = domain.replace("https://", "")

    # Remove path
    domain = domain.split("/")[0]

    labels = domain.split(".")

    # Main domain characters without dots
    domain_without_dots = "".join(labels)

    # TLD
    tld = labels[-1] if len(labels) > 1 else ""

    # Label lengths
    label_lengths = [len(label) for label in labels if label]

    max_label_length = max(label_lengths) if label_lengths else 0

    average_label_length = (
        sum(label_lengths) / len(label_lengths)
        if label_lengths
        else 0.0
    )

    # Character counts
    digit_count = sum(char.isdigit() for char in domain_without_dots)

    letter_count = sum(char.isalpha() for char in domain_without_dots)

    hyphen_count = domain.count("-")

    special_count = sum(
        not char.isalnum() and char != "-"
        for char in domain_without_dots
    )

    domain_length = len(domain_without_dots)

    # Ratios
    digit_ratio = (
        digit_count / domain_length
        if domain_length > 0
        else 0.0
    )

    letter_ratio = (
        letter_count / domain_length
        if domain_length > 0
        else 0.0
    )

    # Vowels and consonants
    vowels = set("aeiou")

    vowel_count = sum(
        char in vowels
        for char in domain_without_dots
        if char.isalpha()
    )

    consonant_count = sum(
        char.isalpha() and char not in vowels
        for char in domain_without_dots
    )

    vowel_ratio = (
        vowel_count / letter_count
        if letter_count > 0
        else 0.0
    )

    consonant_ratio = (
        consonant_count / letter_count
        if letter_count > 0
        else 0.0
    )

    # Punycode detection
    has_punycode = int(
        any(label.startswith("xn--") for label in labels)
    )

    # Longest label entropy
    longest_label = max(labels, key=len) if labels else ""

    longest_label_entropy = calculate_entropy(longest_label)

    # Overall entropy
    entropy = calculate_entropy(domain_without_dots)

    # Repeated characters
    repeated_count = repeated_character_count(domain_without_dots)

    # Longest digit sequence
    digit_sequence = longest_digit_sequence(domain_without_dots)

    # Number of subdomains
    subdomain_count = max(len(labels) - 2, 0)

    return {
        "domain_length": domain_length,
        "digit_count": digit_count,
        "digit_ratio": digit_ratio,
        "letter_count": letter_count,
        "letter_ratio": letter_ratio,
        "hyphen_count": hyphen_count,
        "special_count": special_count,
        "subdomain_count": subdomain_count,
        "tld_length": len(tld),
        "max_label_length": max_label_length,
        "average_label_length": average_label_length,
        "entropy": entropy,
        "vowel_ratio": vowel_ratio,
        "consonant_ratio": consonant_ratio,
        "has_punycode": has_punycode,
        "longest_label_entropy": longest_label_entropy,
        "repeated_character_count": repeated_count,
        "longest_digit_sequence": digit_sequence
    }