
file_path = "public/data/16_depassement.json"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
buffer_line = None

for i, line in enumerate(lines):
    stripped = line.strip()
    
    # Logic to identify stranded lines:
    # 1. Not empty
    # 2. Does not start with " (property key)
    # 3. Does not start with } or ] or { (JSON structure)
    # 4. Does not end with ","image": ... (because those were fixed by part 1, ideally, but if part 1 missed some, we should handle them?)
    #    Actually part 1 fixed lines that bad "image" at the end.
    #    These lines line 927 do NOT have image at end.
    
    is_stranded = False
    if stripped and not stripped.startswith('"') and not stripped.startswith('}') and not stripped.startswith(']') and not stripped.startswith('{'):
        is_stranded = True
    
    if is_stranded:
        # Check if it was already fixed by part 1?
        # Part 1 script might have produced lines starting with "explanation": ...
        # So properly formatted lines start with ".
        # So `is_stranded` is correct for broken lines.
        
        buffer_line = stripped
        continue
        
    if buffer_line:
        # We have a buffered line.
        # We expect the current line to contain the rest of the explanation.
        # It might start with "explanation": " (if the previous line was just text)
        # OR it might just be the rest of the text ending with ","image": ...? 
        # No, from observation, the split happens inside the string.
        # The next line usually starts with `"explanation": "suffix"` OR `"suffix","image":...` (which part 1 fixed to `"explanation": "suffix", "image":...`)
        
        # In line 928 it is `"explanation": "5 mètre.",`
        
        if '"explanation": "' in line:
            parts = line.split('"explanation": "')
            prefix = parts[0]
            suffix = parts[1]
            
            # Escape quotes in buffer?
            buffer_safe = buffer_line.replace('"', '\\"')
            
            combined_text = buffer_safe + " " + suffix
            new_line = prefix + '"explanation": "' + combined_text
            new_lines.append(new_line)
            buffer_line = None
            continue
        
        elif '"image": "' in line:
            # Case where there is no explanation key, but image key?
            # Maybe the explanation was ONLY the stranded line?
            # Example:
            # Stranded line
            # "image": "..."
            # We should wrap stranded line in explanation.
            
            buffer_safe = buffer_line.replace('"', '\\"')
            new_line = f'      "explanation": "{buffer_safe}",\n' + line
            new_lines.append(new_line)
            buffer_line = None
            continue
            
        else:
            # Fallback: just append the buffer line (it will likely still be invalid JSON but we don't prefer losing data)
            # Or maybe merge with current line if current line is text?
            # But we assumed current line starts with " or } etc.
            print(f"Warning: Could not merge buffer line at {i}: {buffer_line}")
            new_lines.append(buffer_line) # Put it back to avoid deletion if logic fails
            new_lines.append(line)
            buffer_line = None
            continue

    new_lines.append(line)

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Fixed multiline issues in 16_depassement.json (Part 2 Revised)")
