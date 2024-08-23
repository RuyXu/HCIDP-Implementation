// Monitor which model is using now
document.addEventListener('DOMContentLoaded', function() {
    fetch(apiUrl + '/current_model')
    .then(response => response.json())
    .then(data => {
        var modelSelect = document.getElementById('model-select');
        modelSelect.value = data.model;
    })
    .catch(error => {
        console.error('Error fetching current model:', error);
    });
});

// Switch online or offline model
var modelSelect = document.getElementById('model-select');

// Monitor the change of model selection
modelSelect.addEventListener('change', function() {
    var selectedModel = modelSelect.value;

    // Send request to the backend server
    fetch(apiUrl + '/switch_model', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: selectedModel })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Model switched to:', selectedModel);
        } else {
            console.error('Failed to switch model:', data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});
