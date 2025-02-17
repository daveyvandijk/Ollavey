// Wacht tot de pagina volledig is geladen voordat we beginnen
document.addEventListener('DOMContentLoaded', () => {
    // Haal de belangrijke elementen op van onze HTML pagina
    const chatMessages = document.getElementById('chat-messages');  // Het gebied waar alle berichten komen
    const userInput = document.getElementById('user-input');       // Het tekstvak waar de gebruiker typt
    const sendButton = document.getElementById('send-button');     // De verzendknop
    const themeSelector = document.getElementById('theme');
    const personalitySelector = document.getElementById('personality');  // Update custom personality input selector
    const customPersonalityContainer = document.getElementById('custom-personality-container');
    const customPersonalityInput = document.getElementById('custom-personality');  // Update custom personality input selector
    const savePersonalityButton = document.getElementById('save-personality');  // Update custom personality input selector

    // Laad opgeslagen thema of gebruik standaard
    const savedTheme = localStorage.getItem('chatTheme') || 'default';
    document.body.setAttribute('data-theme', savedTheme);
    themeSelector.value = savedTheme;

    // Laad opgeslagen persoonlijkheid of gebruik standaard
    const savedPersonality = localStorage.getItem('chatPersonality') || 'default';
    personalitySelector.value = savedPersonality;

    // Laad opgeslagen custom persoonlijkheid als die er is
    const savedCustomPersonality = localStorage.getItem('customPersonality') || '';
    customPersonalityInput.value = savedCustomPersonality;

    // Als de opgeslagen persoonlijkheid 'custom' is, toon dan het custom veld
    if (savedPersonality === 'custom') {
        customPersonalityContainer.style.display = 'flex';
    }

    // Thema wijzigen wanneer gebruiker een andere optie kiest
    themeSelector.addEventListener('change', (e) => {
        const newTheme = e.target.value;
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('chatTheme', newTheme);
    });

    // Persoonlijkheid wijzigen wanneer gebruiker een andere optie kiest
    personalitySelector.addEventListener('change', (e) => {
        const newPersonality = e.target.value;
        localStorage.setItem('chatPersonality', newPersonality);
        
        // Toon of verberg het custom personality veld
        if (newPersonality === 'custom') {
            customPersonalityContainer.style.display = 'flex';
        } else {
            customPersonalityContainer.style.display = 'none';
        }
    });

    // Custom persoonlijkheid opslaan
    savePersonalityButton.addEventListener('click', () => {
        const customPersonality = customPersonalityInput.value.trim();
        if (customPersonality) {
            localStorage.setItem('customPersonality', customPersonality);
            addMessage('Custom persoonlijkheid opgeslagen! 🎉', false);
        }
    });

    // Deze functie zet tekst met ** om naar HTML bold tags
    function processBoldText(text) {
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    // Deze functie formatteert genummerde lijsten
    function processNumberedList(text) {
        const lines = text.split('\n');
        let inList = false;
        let formattedLines = [];

        lines.forEach((line, index) => {
            // Check voor regels die beginnen met een nummer en een punt
            if (line.match(/^\d+\./)) {
                if (!inList) {
                    inList = true;
                    formattedLines.push('<ol>');
                }
                // Verwijder het nummer en maak er een list item van
                const content = line.replace(/^\d+\./, '').trim();
                formattedLines.push(`<li>${content}</li>`);
            } else {
                if (inList) {
                    inList = false;
                    formattedLines.push('</ol>');
                }
                formattedLines.push(line);
            }
        });

        if (inList) {
            formattedLines.push('</ol>');
        }

        return formattedLines.join('\n');
    }

    // Deze functie voegt een nieuw bericht toe aan de chat
    function addMessage(content, isUser = false) {
        // Maak een nieuwe div voor het bericht
        const messageDiv = document.createElement('div');
        // Geef het bericht een klasse op basis van wie het stuurt (gebruiker of AI)
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

        // Zoek naar stukjes code in het bericht (tekst tussen ```)
        // split() verdeelt de tekst in delen: normale tekst en code
        const parts = content.split(/(```[\s\S]*?```)/g);
        
        // Voor elk deel van het bericht
        parts.forEach(part => {
            // Als dit deel begint en eindigt met ``` dan is het code
            if (part.startsWith('```') && part.endsWith('```')) {
                // Haal de ``` weg en verdeel de code in regels
                const lines = part.slice(3, -3).trim().split('\n');
                let language = 'plaintext';  // Standaard taal als geen wordt opgegeven
                let code = lines.join('\n');

                // Kijk of de eerste regel de programmeertaal aangeeft
                // bijvoorbeeld: ```python of ```javascript
                if (lines[0].match(/^[a-zA-Z]+$/)) {
                    language = lines[0].toLowerCase();
                    code = lines.slice(1).join('\n');  // Verwijder de taal-regel uit de code
                }

                // Maak de HTML elementen voor de code
                const pre = document.createElement('pre');
                const codeElement = document.createElement('code');
                codeElement.className = `language-${language}`;  // Belangrijk voor syntax highlighting
                codeElement.textContent = code;
                pre.appendChild(codeElement);
                messageDiv.appendChild(pre);
                
                // Maak de code mooi met syntax highlighting
                Prism.highlightElement(codeElement);
            } else if (part.trim()) {
                // Als het geen code is, maak er dan een gewone tekst paragraaf van
                const p = document.createElement('p');
                // Verwerk bold tekst en genummerde lijsten
                let processedText = processBoldText(part);
                processedText = processNumberedList(processedText);
                p.innerHTML = processedText;
                messageDiv.appendChild(p);
            }
        });

        // Voeg het bericht toe aan de chat en scroll naar beneden
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Deze functie stuurt het bericht naar de server (waar Ollama draait)
    async function sendMessage(message) {
        try {
            // Vind de geselecteerde optie
            const selectedOption = personalitySelector.options[personalitySelector.selectedIndex];
            
            // Bepaal de persoonlijkheid
            let personality = personalitySelector.value;
            let customPersonality = '';

            // Check of het een opgeslagen custom personality is
            if (selectedOption.classList.contains('custom-saved-personality')) {
                personality = 'custom';
                customPersonality = selectedOption.value;
            } else if (personality === 'custom') {
                // Als 'custom' is geselecteerd, gebruik de textarea
                customPersonality = customPersonalityInput.value.trim();
            }

            console.log('Sending message with:', {
                message,
                personality,
                customPersonality
            });

            // Stuur een POST verzoek naar onze Flask server
            const response = await fetch('http://localhost:5000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    personality: personality,
                    customPersonality: customPersonality
                })
            });

            // Controleer of het verzoek succesvol was
            if (!response.ok) {
                throw new Error('Netwerk response was niet ok');
            }

            // Haal het antwoord op en stuur het terug
            const data = await response.json();
            return data.response;
        } catch (error) {
            // Als er iets fout gaat, log de fout en stuur een vriendelijke foutmelding
            console.error('Error:', error);
            return 'Sorry, er is een fout opgetreden bij het verwerken van je bericht.';
        }
    }

    // Als op de verzendknop wordt geklikt
    sendButton.addEventListener('click', async () => {
        const message = userInput.value.trim();  // Haal spaties aan begin en eind weg
        if (message) {  // Alleen versturen als er echt een bericht is
            // Toon het bericht van de gebruiker
            addMessage(message, true);
            // Maak het invoerveld leeg
            userInput.value = '';
            
            // Toon een laad-indicator (...)
            addMessage('...', false);
            // Wacht op antwoord van de AI
            const response = await sendMessage(message);
            // Verwijder de laad-indicator
            chatMessages.removeChild(chatMessages.lastChild);
            // Toon het antwoord van de AI
            addMessage(response, false);
        }
    });

    // Zorg dat Enter ook werkt om een bericht te versturen
    // (Shift+Enter kan nog steeds gebruikt worden voor nieuwe regel)
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();  // Voorkom nieuwe regel
            sendButton.click();  // Doe alsof er op de verzendknop is geklikt
        }
    });
});
