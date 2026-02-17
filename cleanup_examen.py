
import json

filepath = r"c:\Users\test\Documents\permis\permis-online-free\public\data\examen_B.json"
ids_to_remove = [582, 665, 675, 755, 836, 874, 1029, 1067, 1072, 1118, 1195, 1212, 1330, 1347, 1495]

try:
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    questions = data.get('questions', [])
    original_count = len(questions)
    
    new_questions = [q for q in questions if q.get('id') not in ids_to_remove]
    removed_count = original_count - len(new_questions)
    
    data['questions'] = new_questions
    data['totalQuestions'] = len(new_questions)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print(f"Removed {removed_count} questions. New total: {len(new_questions)}")
except Exception as e:
    print(f"Error: {e}")
