
import json

ids_to_check = [71, 106, 172, 437, 507, 543, 582, 665, 675, 755, 836, 874, 1029, 1067, 1072, 1118, 1195, 1212, 1330, 1347, 1495]
file_path = "public/data/examen_B.json"

with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

for q in data["questions"]:
    if q["id"] in ids_to_check:
        print(f"ID: {q['id']}")
        print(f"Type: {q['type']}")
        print(f"Question: {q['question']}")
        print(f"Answer: {q['correctAnswer']}")
        if "propositions" in q:
            print(f"Propositions: {q['propositions']}")
        print(f"Explanation: {q['explanation']}")
        print("-" * 20)
