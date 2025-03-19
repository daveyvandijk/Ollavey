document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages'); 
    const userInput = document.getElementById('user-input');       
    const sendButton = document.getElementById('send-button');   
    const themeSelector = document.getElementById('theme');
    const personalitySelector = document.getElementById('personality');  
    const customPersonalityContainer = document.getElementById('custom-personality-container');
    const customPersonalityInput = document.getElementById('custom-personality');  
    const savePersonalityButton = document.getElementById('save-personality');
    const themeButton = document.getElementById('theme-button');
    const themeOptions = document.getElementById('theme-options');
    const personalityButton = document.getElementById('personality-button');
    const personalityOptions = document.getElementById('personality-options');
    const modelButton = document.getElementById('model-button');
    const modelOptions = document.getElementById('model-options');
    const personalitySelect = document.getElementById('personality');
    const deletePersonalityButton = document.getElementById('delete-personality');
    const toggleSettingsButton = document.getElementById('toggle-settings');
    const settingsContainer = document.getElementById('settings-container');
    const modelSelect = document.getElementById('model');
    const customModelInput = document.getElementById('custom-model');

    themeButton.addEventListener('click', () => {
        themeOptions.style.display = themeOptions.style.display === 'none' ? 'block' : 'none';
        personalityOptions.style.display = 'none';
        modelOptions.style.display = 'none';
    });

    personalityButton.addEventListener('click', () => {
        themeOptions.style.display = 'none';
        personalityOptions.style.display = personalityOptions.style.display === 'none' ? 'block' : 'none';
        modelOptions.style.display = 'none';
    });

    modelButton.addEventListener('click', () => {
        themeOptions.style.display = 'none';
        personalityOptions.style.display = 'none';
        modelOptions.style.display = modelOptions.style.display === 'none' ? 'block' : 'none';
    });

    personalitySelect.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            customPersonalityContainer.style.display = 'block';
        } else {
            customPersonalityContainer.style.display = 'none';
        }
    });

    const savedTheme = localStorage.getItem('chatTheme') || 'default';
    document.body.setAttribute('data-theme', savedTheme);
    themeSelector.value = savedTheme;

    const savedPersonality = localStorage.getItem('chatPersonality') || 'default';
    personalitySelector.value = savedPersonality;

    const savedCustomPersonality = localStorage.getItem('customPersonality') || '';
    customPersonalityInput.value = savedCustomPersonality;

    if (savedPersonality === 'custom') {
        customPersonalityContainer.style.display = 'flex';
    }

    themeSelector.addEventListener('change', (e) => {
        const newTheme = e.target.value;
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('chatTheme', newTheme);
    });

    personalitySelector.addEventListener('change', (e) => {
        const newPersonality = e.target.value;
        localStorage.setItem('chatPersonality', newPersonality);
        
        if (newPersonality === 'custom') {
            customPersonalityContainer.style.display = 'flex';
        } else {
            customPersonalityContainer.style.display = 'none';
        }
    });

    savePersonalityButton.addEventListener('click', () => {
        const customPersonality = customPersonalityInput.value.trim();
        if (customPersonality) {
            localStorage.setItem('customPersonality', customPersonality);
            addMessage('Custom persoonlijkheid opgeslagen! 🎉', false);
            
            const newOption = document.createElement('option');
            newOption.value = customPersonality;
            newOption.text = customPersonality;
            newOption.classList.add('custom-saved-personality');
            personalitySelect.insertBefore(newOption, personalitySelect.querySelector('option[value="custom"]'));
            
            personalitySelect.value = customPersonality;
            personalitySelect.dispatchEvent(new Event('change'));
        }
    });

    toggleSettingsButton.addEventListener('click', () => {
        toggleSettingsButton.classList.add('rotate');
        setTimeout(() => {
            toggleSettingsButton.classList.remove('rotate');
        }, 500);

        if (settingsContainer.classList.contains('open')) {
            settingsContainer.classList.remove('open');
            settingsContainer.classList.add('close');
        } else {
            settingsContainer.classList.remove('close');
            settingsContainer.classList.add('open');
        }
    });

    function processBoldText(text) {
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    function processNumberedList(text) {
        const lines = text.split('\n');
        let inList = false;
        let formattedLines = [];

        lines.forEach((line, index) => {

            if (line.match(/^\d+\./)) {
                if (!inList) {
                    inList = true;
                    formattedLines.push('<ol>');
                }
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

    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        const parts = content.split(/(```[\s\S]*?```)/g);

        parts.forEach(part => {

            if (part.startsWith('```') && part.endsWith('```')) {
                const lines = part.slice(3, -3).trim().split('\n');
                let language = 'plaintext'; 
                let code = lines.join('\n');

                if (lines[0].match(/^[a-zA-Z]+$/)) {
                    language = lines[0].toLowerCase();
                    code = lines.slice(1).join('\n');
                }

                const pre = document.createElement('pre');
                const codeElement = document.createElement('code');
                codeElement.className = `language-${language}`; 
                codeElement.textContent = code;
                pre.appendChild(codeElement);
                messageDiv.appendChild(pre);
                
                Prism.highlightElement(codeElement);
            } else if (part.trim()) {
                const p = document.createElement('p');
                let processedText = processBoldText(part);
                processedText = processNumberedList(processedText);
                p.innerHTML = processedText;
                messageDiv.appendChild(p);
            }
        });

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendMessage(message) {
        try {
            const selectedOption = personalitySelector.options[personalitySelector.selectedIndex];
            let personality = personalitySelector.value;
            let customPersonality = '';

            if (selectedOption.classList.contains('custom-saved-personality')) {
                personality = 'custom';
                customPersonality = selectedOption.value;
            } else if (personality === 'custom') {
                customPersonality = customPersonalityInput.value.trim();
            }

            console.log('Sending message with:', {
                message,
                personality,
                customPersonality
            });

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

            if (!response.ok) {
                if (response.status === 400) {
                    throw new Error('Model is niet opgegeven.'); 
                }
                throw new Error('Netwerk response was niet ok');
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Error:', error);
            return error.message === 'Model is niet opgegeven.' ? 'Model is niet opgegeven. Zorg ervoor dat je een model selecteert.' : 'Sorry, er is een fout opgetreden bij het verwerken van je bericht.';
        }
    }

    sendButton.addEventListener('click', async () => {
        const message = userInput.value.trim();
        if (message) {
            addMessage(message, true);
            userInput.value = '';
            addMessage('...', false);
            const response = await sendMessage(message);
            chatMessages.removeChild(chatMessages.lastChild);
            addMessage(response, false);
        }
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();  
            sendButton.click();  
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const toggleSettingsButton = document.getElementById('toggle-settings');
    const settingsContainer = document.getElementById('settings-container');

    toggleSettingsButton.addEventListener('click', () => {
        settingsContainer.classList.toggle('open');
    });
});
