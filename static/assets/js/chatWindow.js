function adjustChatBodyHeight() {
    var filePreview = document.getElementById('file-preview');
    var chatBody = document.getElementById('chat-body');
    var filePreviewHeight = filePreview.offsetHeight;
    var chatBodyHeight = chatBody.getAttribute('data-original-height');

    if (!chatBodyHeight) {
        chatBodyHeight = chatBody.offsetHeight;
        chatBody.setAttribute('data-original-height', chatBodyHeight);
    }

    if (filePreview.children.length === 0) {
        chatBody.style.height = chatBodyHeight + 'px';
    } else {
        chatBody.style.height = (chatBodyHeight - filePreviewHeight) + 'px';
    }
}

// Show the chat popup and hide the chat button
document.getElementById('chat-button').addEventListener('click', function() {
    document.getElementById('chat-popup').style.display = 'block';
    document.getElementById('chat-button').style.display = 'none';
});

// Refresh chat window and clear history
document.getElementById('refresh-chat').addEventListener('click', function() {
    // Call the server to clean up uploads
    fetch(apiUrl + '/cleanup_uploads')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Cleanup successful:', data);
            // Clear chat messages on the screen but retain the initial bot message
            const chatBody = document.getElementById('chat-body');
            const filePreview = document.getElementById('file-preview');
            const initialBotMessage = chatBody.querySelector('.message.bot-message');

            // Remove all child elements
            chatBody.innerHTML = '';
            filePreview.innerHTML = '';
            adjustChatBodyHeight();

            // Re-add the initial bot message
            if (initialBotMessage) {
                chatBody.appendChild(initialBotMessage);
            }

            // Reset the chat history on the server
            return fetch(apiUrl + '/reset_history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response for history reset was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Chat history cleared:', data);
        })
        .catch(error => {
            console.error('Error in refresh operation:', error);
        });
});

// Minimise the chat window and show the chat button
function minimiseChatPopup() {
    document.getElementById('chat-popup').style.display = 'none';
    document.getElementById('chat-button').style.display = 'block';
}

// Minimise the chat window when the minimise button is clicked
document.getElementById('minimise-chat').addEventListener('click', minimiseChatPopup);

// Minimise the chat window when clicking outside of it
document.addEventListener('click', function(event) {
    var chatPopup = document.getElementById('chat-popup');
    var chatButton = document.getElementById('chat-button');
    var isClickInsidePopup = chatPopup.contains(event.target);
    var isClickInsideButton = chatButton.contains(event.target);

    if (!isClickInsidePopup && !isClickInsideButton) {
        minimiseChatPopup();
    }
});

// Function to drag the chat popup
document.querySelector('.chat-header').addEventListener('mousedown', function(e) {
    var chatPopup = document.getElementById('chat-popup');
    var offsetX = e.clientX - chatPopup.offsetLeft;
    var offsetY = e.clientY - chatPopup.offsetTop;

    function mouseMoveHandler(e) {
        var newX = e.clientX - offsetX;
        var newY = e.clientY - offsetY;

        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
        if (newX + chatPopup.clientWidth > window.innerWidth) newX = window.innerWidth - chatPopup.clientWidth;
        if (newY + chatPopup.clientHeight > window.innerHeight) newY = window.innerHeight - chatPopup.clientHeight;

        chatPopup.style.left = `${newX}px`;
        chatPopup.style.top = `${newY}px`;
    }

    function reset() {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', reset);
    }

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', reset);
});