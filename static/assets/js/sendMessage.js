function sendMessage() {
    var userInput = document.getElementById('user-input').value;
    var filePreview = document.getElementById('file-preview');
    var refreshButton = document.getElementById('refresh-chat');
    var sendButton = document.getElementById('send-message');
    var uploadButton = document.getElementById('upload-file');
    var modelSelectButton = document.getElementById('model-select');
    var chatBody = document.getElementById('chat-body');

    if (userInput.trim() !== "" || filePreview.children.length > 0) {
        var userMessage = document.createElement('div');
        userMessage.className = 'message user-message';

        if (userInput.trim() !== "") {
            var textContent = document.createElement('p');
            textContent.className = 'message-text';
            textContent.innerHTML = userInput.replace(/\n/g, '<br>'); // Handle line breaks
            userMessage.appendChild(textContent);
        }

        if (filePreview.children.length > 0) {
            var fileContainer = document.createElement('div');
            fileContainer.className = 'message-files';
            Array.from(filePreview.children).forEach(fileThumbnail => {
                var clonedThumbnail = fileThumbnail.cloneNode(true);
                var deleteButton = clonedThumbnail.querySelector('.delete-file-button');
                fileContainer.appendChild(clonedThumbnail);
                if (deleteButton) {
                    clonedThumbnail.removeChild(deleteButton);
                }
            });
            userMessage.appendChild(fileContainer);
        }

        chatBody.appendChild(userMessage);

        // Clear the input area
        document.getElementById('user-input').value = "";
        filePreview.innerHTML = "";

        // Scroll chat to the bottom
        chatBody.scrollTop = chatBody.scrollHeight;

        // Display waiting message
        var waitingMessage = document.createElement('div');
        waitingMessage.className = 'message bot-message';
        waitingMessage.textContent = ".";
        chatBody.appendChild(waitingMessage);

        // Disable several buttons while waiting for a response
        refreshButton.disabled = true;
        sendButton.disabled = true;
        uploadButton.disabled = true;
        modelSelectButton.disabled = true;
        refreshButton.classList.add('disabled');
        sendButton.classList.add('disabled');
        uploadButton.classList.add('disabled');
        modelSelectButton.classList.add('disabled');

        // Animation for waiting message
        let dotCount = 1;
        const maxDots = 3;
        const interval = 500; // 0.5 seconds
        const waitingAnimation = setInterval(() => {
            waitingMessage.textContent = '.'.repeat(dotCount);
            dotCount = (dotCount % maxDots) + 1;
        }, interval);

        fetch(apiUrl + '/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userInput })
        })
        .then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let isFirstChunk = true;
            function read() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        // Re-enable send button and remove disabled style
                        refreshButton.disabled = false;
                        sendButton.disabled = false;
                        uploadButton.disabled = false;
                        modelSelectButton.disabled = false;

                        refreshButton.classList.remove('disabled');
                        sendButton.classList.remove('disabled');
                        uploadButton.classList.remove('disabled');
                        modelSelectButton.classList.remove('disabled');
                        return;
                    }
                    if (isFirstChunk) {
                        clearInterval(waitingAnimation); // Stop animation on first chunk
                        waitingMessage.textContent = ""; // Clear waiting message text
                        isFirstChunk = false;
                    }
                    const chunk = decoder.decode(value, { stream: true });
                    waitingMessage.textContent += chunk; // Append new chunk to the existing content
                    chatBody.scrollTop = chatBody.scrollHeight;
                    read();
                });
            }
            read();
        })
        .catch(error => {
            clearInterval(waitingAnimation); // Stop animation
            console.error('Error:', error);
            waitingMessage.textContent = "An error occurred, please try again.";
            
            // Re-enable send button and remove disabled style
            refreshButton.disabled = false;
            sendButton.disabled = false;
            uploadButton.disabled = false;
            modelSelectButton.disabled = false;

            refreshButton.classList.remove('disabled');
            sendButton.classList.remove('disabled');
            uploadButton.classList.remove('disabled');
            modelSelectButton.classList.remove('disabled');
        });
    }
}

// Attach sendMessage function to send button click
document.getElementById('send-message').addEventListener('click', sendMessage);

// Handle Enter and Alt+Enter key events
document.getElementById('user-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        if (event.altKey) {
            // Alt + Enter for newline
            event.preventDefault();
            this.value += '\n';
        } else {
            // Enter for sending message
            event.preventDefault();
            sendMessage();
        }
    }
});

// Disable send button if input field is empty
function updateSendButtonState() {
    var userInput = document.getElementById('user-input').value;
    var sendButton = document.getElementById('send-message');
    sendButton.disabled = userInput.trim() === "";
    if (sendButton.disabled) {
        sendButton.classList.add('disabled');
    } else {
        sendButton.classList.remove('disabled');
    }
}

// Add event listener to input field to monitor changes
document.getElementById('user-input').addEventListener('input', updateSendButtonState);

// Initial check to disable send button if input is empty on page load
updateSendButtonState();
