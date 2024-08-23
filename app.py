from flask import Flask
from flask_cors import CORS
from chatbot import ChatbotService
from fileHandler import FileHandler
import os
import signal
import sys
import schedule
import time
import threading

app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = './Uploads/'
KNOWLEDGE_BASE_FOLDER = './KnowledgeBase'  
LOCAL_MODEL_PATH = "gemma2"  # Set to None to use default
API_KEY = os.getenv("OPENAI_API_KEY", None)  # Set to None to use local model

# Initialize FileHandler and ChatbotService
file_handler = FileHandler(app, UPLOAD_FOLDER, KNOWLEDGE_BASE_FOLDER)
chatbot_service = ChatbotService(app, LOCAL_MODEL_PATH, API_KEY, test_mode=False)  # Set test_mode=False for using

def handle_exit(signum, frame):
    print(f"Received signal {signum}, performing cleanup...")
    file_handler.cleanup_uploads()
    sys.exit(0)

# Set up signal handlers for termination and interrupt signals
signal.signal(signal.SIGTERM, handle_exit)
signal.signal(signal.SIGINT, handle_exit)

# Function to run scheduled tasks
def run_scheduler():
    while True:
        schedule.run_pending()
        time.sleep(1)  # Check for pending tasks every second

# Schedule the cleanup_uploads method to run every day for testing
schedule.every(1).hour.do(file_handler.cleanup_uploads)

# Start the scheduler in a separate thread
scheduler_thread = threading.Thread(target=run_scheduler)
scheduler_thread.start()

# Main program
if __name__ == "__main__":
    print("Starting the application...")
    try:
        app.run(host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        handle_exit(None, None)
