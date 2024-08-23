from flask import request, jsonify, Response
from openai import OpenAI
import os
import pickle
from langchain_community.chat_models import ChatOllama
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain_community.embeddings import OllamaEmbeddings
from langchain_chroma import Chroma
import time

class ChatbotService:
    def __init__(self, app, local_model_path=None, api_key=None, test_mode=True):
        self.app = app
        self.local_model_path = local_model_path
        self.api_key = api_key
        self.knowledge_base = "./KnowledgeBase"
        self.client = None
        self.config = None
        self.model = None
        self.current_model = 'offline'  # Set offline mode as default
        self.default_model_path = "gemma2"
        self.history = [] # Use for ChatGLM
        self.test_mode = test_mode

        # Create prompt template
        self.template = None
        self.prompt = None
        self.retriever = None
        self.embeddings = OllamaEmbeddings(model="nomic-embed-text", show_progress=True)

        self.setup_routes()

        if not test_mode:
            self.setup_local_model()  # Set offline mode as default
    
    def setup_routes(self):
        self.app.route('/chat', methods=['POST'])(self.chat)
        self.app.route('/current_model', methods=['GET'])(self.current_model_checkpoint)
        self.app.route('/switch_model', methods=['POST'])(self.switch_model)
        self.app.route('/reset_history', methods=['POST'])(self.reset_history)
        self.app.route('/')(self.index)

    def reset_history(self):
        self.histpry = []
        return jsonify({'status': 'success', 'message': 'Chat history cleared'}), 200

    def switch_model(self):
        data = request.get_json()
        model_type = data.get('model')
        
        if model_type == 'offline':
            self.setup_local_model()
        elif model_type == 'online':
            self.setup_api_client()
        else:
            return jsonify({"success": False, "message": "Invalid model type"}), 400
        
        return jsonify({"success": True, "message": f"Switched to {model_type} model"}), 200

    def current_model_checkpoint(self):
        return jsonify({"model": self.current_model}), 200
    
    # Set up models
    def setup_local_model(self):
        self.current_model = 'offline'
        try:
            model_path = self.local_model_path or self.default_model_path
            local_llm_name = model_path
            self.model = ChatOllama(model=local_llm_name,
                            keep_alive="3h", 
                            max_tokens=512,  
                            temperature=0)
            self.template = """Answer the question based only on the following context:
            {context}

            Question: {question}

            Answer: """
            
            self.prompt = ChatPromptTemplate.from_template(self.template)

            print(f"Model loaded from {model_path}")
        except Exception as e:
            print(f"Failed to load model: {e}")
            self.tokenizer, self.model = None, None

    def setup_api_client(self):
        self.current_model = 'online'
        try:
            self.client = OpenAI(api_key=self.api_key)
            print("OpenAI client set up with API key.")
        except Exception as e:
            print(f"Failed to set up OpenAI client: {e}")
            self.client = None

    def setup_retriever(self):
        knowledge_files = [
            os.path.join(self.knowledge_base, file)
            for file in os.listdir(self.knowledge_base)
            if file.endswith(".pkl")
        ]

        if not knowledge_files:
            print("Knowledge base is empty. Using default context.")
            return False

        knowledge = []
        for knowledge_file in knowledge_files:
            with open(knowledge_file, "rb") as pkl_file:
                knowledge.extend(pickle.load(pkl_file))

        db = Chroma.from_documents(documents=knowledge, embedding=self.embeddings)

        self.retriever = db.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 3}
        )
        print("Retriever is set up successfully.")
        return True

    def chat(self):
        user_input = request.json.get('message')
        user_upload = request.files.getlist('file')
        if not user_input and not user_upload:
            return jsonify({'response': 'Please provide a message or upload a file.'}), 400

        if self.test_mode:
            # In test mode, simulate a response without loading any models
            try:
                response = self.test_mode_response(user_input)
                return Response(response, content_type='text/plain'), 200
            except Exception as e:
                return jsonify({'response': f"Error during generation: {str(e)}"}), 500
        else:
            # Normal mode with model or API interaction
            try:
                if self.current_model == 'online' and self.client:
                    response = self.client.chat.completions.create(
                        model="gpt-4o-mini", 
                        messages=[{"role": "user", "content": user_input}], 
                        temperature=0.7
                    ).choices[0].message.content
                elif self.current_model == 'offline' and self.model:
                    response = self.local_model_response(user_input)
                    return Response(response, content_type='text/plain'), 200
                    
                else:
                    response = "No model available."
                return jsonify({'response': response}), 200
            except Exception as e:
                return jsonify({'response': f"Error during generation: {str(e)}"}), 500
            
    def test_mode_response(self, input):
        time.sleep(3)  # Simulate the delay of AI's response
        for chunk in input:
            time.sleep(0.01)
            yield chunk

    def local_model_response(self, input):
        # response = ""
        if self.setup_retriever():
            rag_chain = (
                {"context": self.retriever, "question": RunnablePassthrough()}
                | self.prompt
                | self.model
            )
        else:
            no_context_template = """Question: {question}

            Answer: Let's think step by step."""

            prompt = ChatPromptTemplate.from_template(no_context_template)
            rag_chain = (
                {"question": RunnablePassthrough()}
                | prompt
                | self.model
            )

        for chunk in rag_chain.stream(input):
            # response += chunk.content
            yield chunk.content
            # print(f"chunk content: {chunk.content}")

        # return response

    def index(self):
        return "Server is running"