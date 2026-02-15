
import re

file_path = "public/data/16_depassement.json"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix the specific corruption pattern
# Pattern: +16 – ‘Le dépassement’.  some text","image": "https: //url"
# We want: "explanation": "16 – ‘Le dépassement’. some text",\n"image": "https://url"

# Note: The +16 line usually appears after "correctAnswer": "VAL",
# and it lacks the "explanation" key, and seems to be merged with image key in a weird way?
# Actually looking at the view_file output:
#       "correctAnswer": "OUI",
#       +16 – ‘Le dépassement’.  Mais un camion ...","image": "https: //examen...
#
# It seems the previous line has a comma? yes.
# The +16 line is raw text not in quotes? Yes, causing syntax error.
# And it ends with quote and comma and image key?
# Wait: `...gauche.","image": ...`
# So the end of the text is `...gauche."` then `,` then `"image":`.
# But the start is `+16 ...` which is invalid JSON.

# I will use a regex to capture this line and format it correctly.
# The line starts with whitespace then +16
# It ends with `"

def replacement(match):
    text = match.group(1).replace('"', '\\"') # Escape quotes in text if any, though likely not needed if logic aligns
    # actually the text ends at `","image` so it might contain quotes?
    # The corrupted line is:
    # +16 – ‘Le dépassement’.  TEXT","image": "https: //URL"
    
    # We want:
    # "explanation": "16 – ‘Le dépassement’. TEXT",
    # "image": "https://URL"
    
    content_text = match.group(1)
    reminder = match.group(2)
    
    return f'"explanation": "16 – ‘Le dépassement’. {content_text}",\n      "image": "https://{reminder}"'

# Regex Explanation:
# \s*\+16 – ‘Le dépassement’\.  Matches the start
# (.*?) Matches the explanation text non-greedy
# ","image": "https: // Matches the malformed image separator
# (.*)" Matches the rest of the url until the closing quote
pattern = r'\+16 – ‘Le dépassement’\.(.*?)","image": "https: //(.*?)"'

fixed_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# There is another pattern:
# Some lines don't have +16 but just text starting?
# Example line 171:
#       Dans ou avant un virage dangereux...","image": "https://...
# This also lacks "explanation" key.
# It seems any line that is not a key ("id", "type"...) and just starts with text inside the object is broken?
# But let's verify if there are other corruptions.
# Line 171 starts with `      Dans ou avant...`
# It seems it's just raw text.

# Broader approach:
# Look for lines that look like: `      TEXT","image": "https: //URL"`
# or `      TEXT","image": "https://URL"`
# AND are not valid keys.
# Most explanations end with `","image":` in this corrupted file.

# Pattern 2: Generic raw text explanation leading to image
# We look for lines that do NOT start with " (ignoring whitespace)
# But contain `","image":`
# pattern2 = r'^\s*([^"]+?)","image": "(https: //|https://)(.*?)"'
# Wait, `+16` matches `[^"]+`

# Let's try to capture lines that end with `","image": ...` and don't start with `"`
pattern_generic = r'^\s*(?!"|})(.*?)","image": "(.*?)"'
# This matches lines like:
#       +16 ...","image": "..."
#       Dans ou avant ...","image": "..."

def generic_replacement(match):
    text = match.group(1)
    url_part = match.group(2)
    # Fix url if it has space
    url_part = url_part.replace("https: //", "https://")
    
    # Escape quotes in text?
    # If text contains `"` it might be an issue, but usually in this file it seems quotes are used properly or absent.
    # The corruption seems to be missing the opening "explanation": " and the opening quote for the value.
    
    return f'      "explanation": "{text}",\n      "image": "{url_part}"'

# apply regex line by line might be safer to avoid crossing boundaries
lines = content.split('\n')
new_lines = []
for line in lines:
    stripped = line.strip()
    # Check if line has the corruption signature: Ends with `","image": "..."` (ignoring trailing comma if any? no, usually ends with `"` inside the line?)
    # The previous view showed: `...gauche.","image": "https: //..."`
    # It seems the line ends with the image url quote?
    # `...jpg"`
    
    if '","image": "' in line and not stripped.startswith('"'):
        # This is a corrupted line
        # Split by `","image": "`
        parts = line.split('","image": "')
        explanation_raw = parts[0].strip()
        image_raw = parts[1].strip().rstrip('"')
        
        # fix image raw
        image_raw = image_raw.replace('https: //', 'https://')
        
        # explanation_raw is the text. We need to quote it as value for "explanation".
        # escape double quotes if any
        explanation_val = explanation_raw.replace('"', '\\"')
        
        # indent
        indent = "      "
        new_line = f'{indent}"explanation": "{explanation_val}",\n{indent}"image": "{image_raw}"'
        new_lines.append(new_line)
    else:
        new_lines.append(line)

final_content = '\n'.join(new_lines)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(final_content)

print("Fixed 16_depassement.json")
