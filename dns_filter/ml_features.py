import math
import re
from collections import Counter
from urllib.parse import urlparse


def calculate_entropy(text):
    """
    Calculate Shannon entropy of a string.
    Higher entropy can indicate randomly generated domains.
    """

    if not text:
        return 0.0

    counts = Counter(text)
    length = len(text)

    entropy = 0.0

    for count in counts.values():
        probability = count / length
        entropy -= probability * math.log2(probability)

    return entropy


def extract_features(domain):
    """
    Extract numerical features from a domain name
    for DGA detection.

    Returns:
        dict: Extracted domain features
    """

    # Remove protocol if accidentally provided
    if "://" in domain:
        domain = urlparse(domain).netloc

    # Normalize
    domain = domain.lower().strip().rstrip(".")

    # Remove port if present
    domain = domain.split(":")[0]

    # Split domain into labels
    labels = domain.split(".")

    # Main domain characters
    domain_without_dots = domain.replace(".", "")

    # TLD
    tld = labels[-1] if len(labels) > 1 else ""

    # Subdomains
    subdomain_count = max(len(labels) - 2, 0)

    # Character counts
    domain_length = len(domain_without_dots)

    digit_count = sum(
        character.isdigit()
        for character in domain_without_dots
    )

    letter_count = sum(
        character.isalpha()
        for character in domain_without_dots
    )

    hyphen_count = domain_without_dots.count("-")

    special_count = sum(
        not character.isalnum() and character != "-"
        for character in domain_without_dots
    )

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

    # Vowels
    vowels = set("aeiou")

    vowel_count = sum(
        character in vowels
        for character in domain_without_dots
        if character.isalpha()
    )

    vowel_ratio = (
        vowel_count / letter_count
        if letter_count > 0
        else 0.0
    )

    # Consonants
    consonant_count = letter_count - vowel_count

    consonant_ratio = (
        consonant_count / letter_count
        if letter_count > 0
        else 0.0
    )

    # Label lengths
    label_lengths = [len(label) for label in labels]

    max_label_length = (
        max(label_lengths)
        if label_lengths
        else 0
    )

    average_label_length = (
        sum(label_lengths) / len(label_lengths)
        if label_lengths
        else 0.0
    )

    # Entropy
    entropy = calculate_entropy(
        domain_without_dots
    )

    # Punycode
    has_punycode = int(
        any(label.startswith("xn--") for label in labels)
    )

    # Long random-looking label
    longest_label = (
        max(labels, key=len)
        if labels
        else ""
    )

    longest_label_entropy = calculate_entropy(
        longest_label
    )

    # Repeated characters
    repeated_character_count = sum(
        1
        for i in range(1, len(domain_without_dots))
        if domain_without_dots[i]
        == domain_without_dots[i - 1]
    )

    # Digit sequence
    digit_sequences = re.findall(
        r"\d+",
        domain_without_dots
    )

    longest_digit_sequence = max(
        [len(sequence) for sequence in digit_sequences],
        default=0
    )

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
        "repeated_character_count": repeated_character_count,
        "longest_digit_sequence": longest_digit_sequence,
    }