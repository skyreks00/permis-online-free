
import json
import subprocess

filepath = "public/data/examen_B.json"
ids_to_fix = [582, 665, 675, 755, 836, 874, 1029, 1067, 1072, 1118, 1195, 1212, 1330, 1347, 1495]

try:
    # Get previous version content
    result = subprocess.run(['git', 'show', 'HEAD~1:' + filepath], capture_output=True, text=True, encoding='utf-8')
    if result.returncode != 0:
        print("Error fetching previous version")
        exit(1)
        
    data = json.loads(result.stdout)
    questions = data.get('questions', [])
    
    found_questions = [q for q in questions if q.get('id') in ids_to_fix]
    
    with open('extracted_lost_questions.json', 'w', encoding='utf-8') as f:
        json.dump(found_questions, f, indent=2, ensure_ascii=False)
        
    print(f"Extracted {len(found_questions)} questions to extracted_lost_questions.json")
except Exception as e:
    print(f"Error: {e}")
