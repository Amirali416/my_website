document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const backgroundText = document.querySelector('.background-text');
    const translationPopup = document.getElementById('translation-popup');

    const model = 'gemini-2.5-flash-lite';
    const workerBaseUrl = 'https://gemini-proxy.bazrgaramirali.workers.dev'; // <-- IMPORTANT: REPLACE WITH YOUR WORKER URL

    const words = "apple banana orange grape strawberry watermelon pineapple mango kiwi peach plum cherry blueberry raspberry blackberry cranberry".split(" ");

    function populateBackground() {
        words.forEach(word => {
            const span = document.createElement('span');
            span.textContent = word;
            backgroundText.appendChild(span);
        });
    }

    async function translateWord(word) {
        const url = `${workerBaseUrl}/gemini-2.5-flash-lite`;
        const prompt = `Provide only the Persian translation for the word "${word}", without any additional text or explanation.`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text.trim();
        } catch (error) {
            console.error('Error translating word:', error);
            return 'Translation failed';
        }
    }

    function showTranslationPopup(word, x, y) {
        translateWord(word).then(translation => {
            translationPopup.textContent = translation;
            translationPopup.style.display = 'block';
            translationPopup.style.left = `${x}px`;
            translationPopup.style.top = `${y}px`;

            setTimeout(() => {
                translationPopup.style.display = 'none';
            }, 3000);
        });
    }

    backgroundText.addEventListener('click', async (e) => {
        if (e.target.tagName === 'SPAN') {
            const word = e.target.textContent;
            showTranslationPopup(word, e.pageX, e.pageY);
        }
    });

    chatBox.addEventListener('click', async (e) => {
        if (e.target.tagName === 'SPAN' && e.target.closest('.message')) {
            const word = e.target.textContent.replace(/[^a-zA-Z]/g, '');
            if (word) {
                showTranslationPopup(word, e.pageX, e.pageY);
            }
        }
    });

    async function sendMessage() {
        const userMessage = userInput.value.trim();
        if (userMessage === '') return;

        appendMessage(userMessage, 'user-message');
        userInput.value = '';

        try {
            const url = `${workerBaseUrl}/${model}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: userMessage
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const geminiMessage = data.candidates[0].content.parts[0].text.trim();
            appendMessage(geminiMessage, 'gemini-message');
        } catch (error) {
            console.error('Error sending message:', error);
            appendMessage('Sorry, something went wrong. Please try again.', 'gemini-message');
        }
    }

    function appendMessage(message, className) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', className);

        const words = message.split(' ');
        words.forEach(word => {
            const span = document.createElement('span');
            span.textContent = word + ' ';
            messageElement.appendChild(span);
        });

        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    populateBackground();
});

