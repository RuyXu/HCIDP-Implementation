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

// File upload button functionality
document.getElementById('upload-file').addEventListener('click', function() {
    document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', function(event) {
    var fileInput = event.target;
    handleFiles(fileInput.files);
    fileInput.value = ''; // Reset the file input value
});

var chatPopup = document.getElementById('chat-popup');
chatPopup.addEventListener('dragover', function(event) {
    event.preventDefault();
    event.stopPropagation();
    chatPopup.classList.add('dragging');
});

chatPopup.addEventListener('dragleave', function(event) {
    chatPopup.classList.remove('dragging');
});

chatPopup.addEventListener('drop', function(event) {
    event.preventDefault();
    event.stopPropagation();
    chatPopup.classList.remove('dragging');
    handleFiles(event.dataTransfer.files);
});

var allFiles = [];

function handleFiles(files) {
    var filePreview = document.getElementById('file-preview');
    var formData = new FormData();
    var timestamp = new Date().toISOString(); // Generate a unique timestamp

    Array.from(files).forEach(file => {
        var fileId = generateUniqueId(); // Generate a unique file ID
        // var timestamp = new Date().toISOString(); // Generate a unique timestamp

        formData.append('files', file);
        formData.append('fileIds', fileId);
        formData.append('timestamps', timestamp);
        allFiles.push({ file, timestamp, fileId }); // Save the info of files in the front

        // Create a container for each file thumbnail with a delete button
        var fileContainer = document.createElement('div');
        fileContainer.className = 'file-thumbnail-container';

        var allowedFileTypes = ['txt', 'pdf', 'png', 'jpg', 'jpeg', 'docx', 'pptx', 'xlsx', '.xls', 'csv'];
        var fileExtension = file.name.split('.').pop().toLowerCase();
        if (allowedFileTypes.includes(fileExtension)) {
            if (file.type.startsWith('image/')) {
                var thumbnail = document.createElement('img');
                thumbnail.src = URL.createObjectURL(file);
                thumbnail.className = 'file-thumbnail';
                fileContainer.appendChild(thumbnail);
            } else {
                var fileIcon = document.createElement('div');
                fileIcon.className = 'file-thumbnail';
                fileIcon.textContent = file.name.split('.').pop().toUpperCase();
                fileContainer.appendChild(fileIcon);
            }
        } else {
            alert("Only support .txt, .pdf, .png, .jpg, .jpeg, .docx, .pptx, .xlsx, .xls, .csv");
        }

        // Design the delete button
        var deleteButton = document.createElement('button');
        deleteButton.className = 'delete-file-button';
        deleteButton.textContent = '✕';
        deleteButton.addEventListener('click', function(event) {
            event.stopPropagation();
            // Send deletion request to backend
            fetch(apiUrl + '/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fileId: fileId, timestamp: timestamp }) // Send the fileId and timestamp to the backend
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    filePreview.removeChild(fileContainer);
                    allFiles = allFiles.filter(f => f.fileId !== fileId); // Delete the saved info
                    adjustChatBodyHeight();
                } else {
                    alert('Failed to delete file: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while trying to delete the file.');
            });
        });

        fileContainer.appendChild(deleteButton);
        filePreview.appendChild(fileContainer);
    });

    adjustChatBodyHeight();  // Offset the increased height of fileContainer

    // Upload files to the server
    fetch(apiUrl + '/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Files uploaded:', data);
        // Handle successful upload response
    })
    .catch(error => {
        console.error('Error uploading files:', error);
        // Handle upload error
    });
}

function generateUniqueId() {
    return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, function() {
        return Math.floor(Math.random() * 16).toString(16);
    });
}
