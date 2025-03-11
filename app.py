# Importeer de benodigde libraries
from flask import Flask, request, jsonify  # Flask voor de webserver
from flask_cors import CORS               # CORS voor communicatie tussen frontend en backend
import requests                          # requests voor communicatie met Ollama

# Maak een nieuwe Flask applicatie
app = Flask(__name__)
# Sta toe dat de frontend (die op een andere poort draait) met deze server kan praten
CORS(app)  # Dit staat cross-origin requests toe voor ontwikkeling

# Dit is het adres waar Ollama op draait
OLLAMA_API_URL = "http://localhost:11434/api/generate"

# Persoonlijkheids-prompts voor verschillende karakters
PERSONALITY_PROMPTS = {
    "default": "",
    "nerd": "Je bent nu een super nerd die heel enthousiast is over technologie en wetenschap. "
            "Gebruik veel technische termen en maak referenties naar populaire sci-fi series. "
            "Begin je zinnen vaak met 'Actually...' en 'Technically speaking...'",
    
    "mario": "Je bent nu Mario van Super Mario Bros. "
             "Gebruik Mario's catchphrases zoals 'It's-a me!' en 'Wahoo!' "
             "Verwijs vaak naar munten verzamelen, paddenstoelen, en Princess Peach. "
             "Eindig zinnen vaak met 'Mama mia!'",
    
    "pirate": "Je bent nu een piraat. Gebruik veel piraten-taal zoals 'Arrr!', 'Aye!', "
              "en 'Shiver me timbers!'. Verwijs naar schatten, schepen, en de zee. "
              "Gebruik woorden als 'matey', 'landlubber', en 'ye'.",
    
    "yoda": "Spreek je als Yoda. Zet werkwoorden aan het einde van de zin. "
            "Gebruik wijze, mystieke taal en verwijs naar The Force. "
            "Bijvoorbeeld: 'Help you, I will' in plaats van 'I will help you'.",
    
    "kawaii": "Je bent nu super schattig en kawaii! Gebruik veel emoji's en vrolijke uitdrukkingen. "
              "Voeg '-chan' en '-kun' toe aan woorden. Gebruik veel uitroeptekens! "
              "Maak geluidseffecten zoals 'uwu', 'nyaa~' en '(⁠◕⁠ᴗ⁠◕⁠✿)'."
}

# Dit is het eindpunt waar de frontend berichten naartoe stuurt
@app.route('/chat', methods=['POST'])
def chat():
    try:
        # Haal het bericht en de persoonlijkheid op uit het verzoek
        data = request.json
        user_message = data.get('message', '')
        personality = data.get('personality', 'default')
        custom_personality = data.get('customPersonality', '')
        model = data.get('model', 'llama2')  # Get the selected model from the request

        # Bepaal welke persoonlijkheids-prompt we moeten gebruiken
        if personality == 'custom' and custom_personality:
            personality_prompt = custom_personality
        else:
            personality_prompt = PERSONALITY_PROMPTS.get(personality, '')

        # Maak de volledige prompt met persoonlijkheid
        full_prompt = f"{personality_prompt}\n\nGebruiker: {user_message}"

        print(f"Persoonlijkheid: {personality}")
        print(f"Custom persoonlijkheid: {custom_personality if personality == 'custom' else 'N/A'}")
        print(f"Volledige prompt: {full_prompt}")

        # Stuur het bericht door naar Ollama
        response = requests.post(
            OLLAMA_API_URL,
            json={
                "model": model,  # Use the selected model
                "prompt": full_prompt,
                "stream": False
            }
        )

        # Als Ollama succesvol antwoordt
        if response.status_code == 200:
            ollama_response = response.json()
            return jsonify({"response": ollama_response.get('response', '')})
        else:
            # Als er iets mis gaat met Ollama
            return jsonify({"error": "Fout bij communicatie met Ollama"}), 500

    except Exception as e:
        # Als er een andere fout optreedt
        return jsonify({"error": str(e)}), 500

# Start de Flask server als dit script direct wordt uitgevoerd
if __name__ == '__main__':
    app.run(debug=True)  # debug=True zorgt ervoor dat we handige foutmeldingen krijgen
