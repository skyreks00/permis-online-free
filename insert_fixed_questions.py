
import json

filepath = r"c:\Users\test\Documents\permis\permis-online-free\public\data\examen_B.json"

questions_to_insert = [
  {
    "id": 582,
    "type": "multiple_choice",
    "question": "Combien de temps la voiture rouge peut-elle être garée à cet endroit ?",
    "correctAnswer": "B",
    "explanation": "La limite de temps commence seulement à partir du panneau, parce que la flèche pointe vers le haut.",
    "image": "https://examen.gratisrijbewijsonline.be/afbeeldingen/197/970.jpg",
    "propositions": [
      { "letter": "A", "text": "30 minutes" },
      { "letter": "B", "text": "Le temps que l'on souhaite" },
      { "letter": "C", "text": "Jusqu'à la fin de la zone bleue" }
    ]
  },
  {
    "id": 665,
    "type": "multiple_choice",
    "question": "De combien de personnes un groupe de cyclistes doit-il être accompagné d'au moins 2 superviseurs ?",
    "correctAnswer": "C",
    "explanation": "À partir de 51 cyclistes.",
    "image": "https://examen.gratisrijbewijsonline.be/afbeeldingen/197/1071.jpg",
    "propositions": [
      { "letter": "A", "text": "À partir de 15 cyclistes" },
      { "letter": "B", "text": "À partir de 31 cyclistes" },
      { "letter": "C", "text": "À partir de 51 cyclistes" }
    ]
  },
  {
    "id": 675,
    "type": "multiple_choice",
    "question": "Vous avez endommagé une autre voiture en vous garant. Vous ne savez pas qui en est le propriétaire. Combien de temps avez-vous pour faire une déclaration au commissariat de police ?",
    "correctAnswer": "C",
    "explanation": "Si vous endommagez la propriété de quelqu’un et que la police ne peut pas se déplacer, vous devez faire une déclaration le plus vite possible.",
    "image": "https://examen.gratisrijbewijsonline.be/afbeeldingen/197/1152.jpg",
    "propositions": [
      { "letter": "A", "text": "Dans les 24 heures" },
      { "letter": "B", "text": "Dans les 12 heures" },
      { "letter": "C", "text": "Aussitôt que possible (sans délai)" }
    ]
  },
  {
    "id": 755,
    "type": "multiple_choice",
    "question": "Disque de stationnement dans une zone bleue. Combien de temps pouvez-vous stationner par défaut ?",
    "correctAnswer": "C",
    "explanation": "Sauf indication contraire, le disque autorise le stationnement pendant 2 heures.",
    "image": "https://examen.gratisrijbewijsonline.be/afbeeldingen/197/1019.jpg",
    "propositions": [
      { "letter": "A", "text": "30 minutes" },
      { "letter": "B", "text": "1 heure" },
      { "letter": "C", "text": "2 heures" }
    ]
  },
  {
    "id": 836,
    "type": "multiple_choice",
    "question": "À partir de combien de cyclistes dans un groupe faut-il deux capitaines de route ?",
    "correctAnswer": "C",
    "explanation": "Les cyclistes qui roulent en groupe de 51 à 150 participants doivent être accompagnés de deux capitaines de route.",
    "image": "https://examen.gratisrijbewijsonline.be/afbeeldingen/197/1509.jpg",
    "propositions": [
      { "letter": "A", "text": "15" },
      { "letter": "B", "text": "31" },
      { "letter": "C", "text": "51" }
    ]
  },
  {
    "id": 874,
    "type": "multiple_choice",
    "question": "Un groupe de cyclistes doit être composé d’au moins combien de personnes pour nécessiter obligatoirement deux capitaines de route ?",
    "correctAnswer": "B",
    "explanation": "Si le groupe compte au moins 51 cyclistes, il doit obligatoirement être encadré par au moins deux capitaines de route.",
    "image": "https://examen.gratisrijbewijsonline.be/afbeeldingen/197/1139.jpg",
    "propositions": [
      { "letter": "A", "text": "15" },
      { "letter": "B", "text": "51" },
      { "letter": "C", "text": "151" }
    ]
  },
  {
    "id": 1029,
    "type": "multiple_choice",
    "question": "Ce signal routier interdit l'accès aux conducteurs transportant quelles marchandises ?",
    "correctAnswer": "B",
    "explanation": "Accès interdit aux conducteurs de véhicules transportant des marchandises dangereuses peu importe le type de danger.",
    "image": "https://examen.gratisrijbewijsonline.be/afbeeldingen/197/1483.jpg",
    "propositions": [
      { "letter": "A", "text": "Matières inflammables uniquement" },
      { "letter": "B", "text": "Matières dangereuses de toute nature" },
      { "letter": "C", "text": "Produits chimiques uniquement" }
    ]
  },
  {
    "id": 1067,
    "type": "multiple_choice",
    "question": "Quelle distance de sécurité minimale (temps) devez-vous laisser entre vous et le véhicule qui vous précède ?",
    "correctAnswer": "A",
    "explanation": "La distance de sécurité doit être d'au moins 2 secondes.",
    "image": "https://examen.gratisrijbewijsonline.be/afbeeldingen/197/1106.jpg",
    "propositions": [
      { "letter": "A", "text": "2 secondes" },
      { "letter": "B", "text": "1 seconde" },
      { "letter": "C", "text": "3 secondes" }
    ]
  },
  {
    "id": 1072,
    "type": "multiple_choice",
    "question": "Vous roulez trop vite en Zone 30. À partir de quel excès de vitesse la police peut-elle retirer votre permis sur-le-champ ?",
    "correctAnswer": "A",
    "explanation": "À partir d’un excès de 20 km/h en agglomération ou zone 30.",
    "image": "https://examen.gratisrijbewijsonline.be/afbeeldingen/197/328.jpg",
    "propositions": [
      { "letter": "A", "text": "20 km/h" },
      { "letter": "B", "text": "30 km/h" },
      { "letter": "C", "text": "40 km/h" }
    ]
  },
  {
    "id": 1118,
    "type": "multiple_choice",
    "question": "Ce signal interdit l'accès aux véhicules transportant des marchandises qui peuvent polluer quoi ?",
    "correctAnswer": "A",
    "explanation": "Accès interdit aux véhicules transportant des marchandises susceptibles de polluer les eaux.",
    "image": "https://examen.gratisrijbewijsonline.be/afbeeldingen/197/254.jpg",
    "propositions": [
      { "letter": "A", "text": "L'eau" },
      { "letter": "B", "text": "L'air" },
      { "letter": "C", "text": "Le sol" }
    ]
  },
  {
    "id": 1195,
    "type": "multiple_choice",
    "question": "La profondeur minimale des rainures d’un pneu doit être de (...) mm.",
    "correctAnswer": "A",
    "explanation": "Au moins 1,6 mm.",
    "image": "https://examen.gratisrijbewijsonline.be/afbeeldingen/197/889.jpg",
    "propositions": [
      { "letter": "A", "text": "1,6 mm" },
      { "letter": "B", "text": "1,0 mm" },
      { "letter": "C", "text": "2,0 mm" }
    ]
  },
  {
    "id": 1212,
    "type": "multiple_choice",
    "question": "Mon véhicule est en panne. Combien de temps ma voiture peut-elle rester sur la voie publique ?",
    "correctAnswer": "C",
    "explanation": "Un véhicule en panne peut rester au maximum 24 heures sur la voie publique.",
    "image": "https://examen.gratisrijbewijsonline.be/afbeeldingen/197/1197.jpg",
    "propositions": [
      { "letter": "A", "text": "2 heures" },
      { "letter": "B", "text": "12 heures" },
      { "letter": "C", "text": "24 heures" }
    ]
  },
  {
    "id": 1330,
    "type": "multiple_choice",
    "question": "À partir de quel excès de vitesse, HORS AGGLOMÉRATION, la police peut-elle retirer votre permis temporairement ?",
    "correctAnswer": "B",
    "explanation": "À partir de 30 km/h d'excès sur les routes ordinaires.",
    "image": "https://examen.gratisrijbewijsonline.be/afbeeldingen/197/325.jpg",
    "propositions": [
      { "letter": "A", "text": "20 km/h" },
      { "letter": "B", "text": "30 km/h" },
      { "letter": "C", "text": "40 km/h" }
    ]
  },
  {
    "id": 1347,
    "type": "multiple_choice",
    "question": "Votre médecin juge que vous n'êtes plus capable de conduire. Sous combien de jours devez-vous rendre votre permis à la commune ?",
    "correctAnswer": "C",
    "explanation": "Vous devez le rendre dans les 4 jours ouvrables.",
    "image": "https://examen.gratisrijbewijsonline.be/afbeeldingen/197/860.jpg",
    "propositions": [
      { "letter": "A", "text": "2 jours" },
      { "letter": "B", "text": "8 jours" },
      { "letter": "C", "text": "4 jours" }
    ]
  },
  {
    "id": 1495,
    "type": "multiple_choice",
    "question": "Quelle est la durée maximale de stationnement autorisée en zone bleue (par défaut) ?",
    "correctAnswer": "A",
    "explanation": "Sauf mention contraire, elle est de 2 heures (120 minutes).",
    "image": "https://examen.gratisrijbewijsonline.be/afbeeldingen/197/788.jpg",
    "propositions": [
      { "letter": "A", "text": "2 heures" },
      { "letter": "B", "text": "1 heure" },
      { "letter": "C", "text": "30 minutes" }
    ]
  }
]

try:
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    existing_questions = data.get('questions', [])
    # Append the repaired questions
    existing_questions.extend(questions_to_insert)
    # Sort to keep things tidy (optional but good)
    existing_questions.sort(key=lambda x: x.get('id', 0))
    
    data['questions'] = existing_questions
    data['totalQuestions'] = len(existing_questions)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Inserted {len(questions_to_insert)} repaired questions. New total: {len(existing_questions)}")

except Exception as e:
    print(f"Error: {e}")
