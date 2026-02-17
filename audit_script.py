
import json
import os
import re

DATA_DIR = r"c:\Users\test\Documents\permis\permis-online-free\public\data"

def audit_quiz():
    report = []
    
    for filename in os.listdir(DATA_DIR):
        if not filename.endswith('.json') or filename == 'themes.json':
            continue
            
        filepath = os.path.join(DATA_DIR, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            questions = data.get('questions', [])
            for q in questions:
                q_id = q.get('id')
                q_text = q.get('question', "").strip()
                
                issues = []
                
                # 1. Missing propositions markers
                if "propositions manquantes" in q_text.lower():
                    issues.append("MISSING_PROPS_MARKER")

                props = q.get('propositions', [])
                if isinstance(props, list):
                    letters = [p.get('letter') for p in props if p.get('letter')]
                    # 2. Duplicate letters in propositions
                    if len(letters) != len(set(letters)):
                        issues.append(f"DUPLICATE_LETTERS: {letters}")
                    
                    for p in props:
                        p_text = p.get('text', "").strip()
                        # 3. Question-like text in props (long sentences ending in ?)
                        if p_text.endswith("?") and len(p_text) > 20:
                            issues.append(f"QUESTION_ENDING_IN_PROP: {p_text}")

                if issues:
                    report.append(f"FILE: {filename} | ID: {q_id}")
                    for issue in issues:
                        report.append(f"  - {issue}")
                    report.append(f"  Q: {q_text[:200]}")
                    if isinstance(props, list):
                        for p in props:
                           report.append(f"    {p.get('letter')}: {p.get('text')}")
                    report.append("-" * 40)
                    
        except Exception as e:
            pass
            
    with open("audit_targeted_report.txt", "w", encoding="utf-8") as rf:
        rf.write("\n".join(report))

if __name__ == "__main__":
    audit_quiz()
