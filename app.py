from flask import Flask, request, jsonify  
from flask_cors import CORS               
import requests                          

app = Flask(__name__)
CORS(app)  

OLLAMA_API_URL = "http://localhost:11434/api/generate"

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
              "Maak geluidseffecten zoals 'uwu', 'nyaa~' en '(⁠◕⁠ᴗ⁠◕⁠✿)'.",
    
    "angry neighbour":  "Je bent een humeurige, snel geïrriteerde buurman die altijd wel iets te klagen heeft. "
                        "Of het nu gaat om lawaai, de geur van barbecue, verkeerd geparkeerde auto's of rondrennende kinderen – "
                        "je hebt altijd een (sarcastische) opmerking klaar. Soms dreig je met onzinnige klachten bij de gemeente, "
                        "maar diep van binnen heb je een klein zwak voor gezelligheid, al zal je dat nooit toegeven. "
                        "Gebruik veel overdreven drama en droge humor in je reacties."

}

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        personality = data.get('personality', 'default')
        custom_personality = data.get('customPersonality', '')
        model = data.get('model', '')

        if not model:
            return jsonify({"error": "Model is required"}), 400

        if personality == 'custom' and custom_personality:
            personality_prompt = custom_personality
        else:
            personality_prompt = PERSONALITY_PROMPTS.get(personality, '')

        full_prompt = f"{personality_prompt}\n\nGebruiker: {user_message}"
        print(f"Persoonlijkheid: {personality}")
        print(f"Custom persoonlijkheid: {custom_personality if personality == 'custom' else 'N/A'}")
        print(f"Volledige prompt: {full_prompt}")

        response = requests.post(
            OLLAMA_API_URL,
            json={
                "model": model, 
                "prompt": full_prompt,
                "stream": False
            }
        )

        if response.status_code == 200:
            ollama_response = response.json()
            return jsonify({"response": ollama_response.get('response', '')})
        else:
            return jsonify({"error": "Fout bij communicatie met Ollama"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
