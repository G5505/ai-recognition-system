import os

def count_images(folder):
    total = 0
    for root, dirs, files in os.walk(folder):
        total += len([
            f for f in files
            if f.lower().endswith(('.png', '.jpg', '.jpeg'))
        ])
    return total

digits_count = count_images("datasets/digits")
letters_count = count_images("datasets/letters")
signatures_count = count_images("datasets/signatures")

total = digits_count + letters_count + signatures_count

print("Digits:", digits_count)
print("Letters:", letters_count)
print("Signatures:", signatures_count)
print("Total Images:", total)