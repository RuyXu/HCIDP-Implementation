from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.retrievers import MultiQueryRetriever
from langchain_community.chat_models import ChatOllama

from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma

###加载文件
loader = PyPDFLoader("../HCIDP Lecture 10 - Communication Design for Impact.pdf")
pages = loader.load()


###文本切分
text_splitter = RecursiveCharacterTextSplitter(chunk_size = 300,chunk_overlap = 50,)

docs = text_splitter.split_documents(pages[:4])
print(docs)



# Set embeddings model
embeddings = OllamaEmbeddings(model="nomic-embed-text", show_progress=True)

# Set path to knowledge base
db = Chroma.from_documents(documents=docs,
            embedding=embeddings)

# Create retriever
retriever = db.as_retriever(
    search_type="similarity",
    search_kwargs= {"k": 3}
)


local_llm_name = "gemma2"
llm = ChatOllama(model=local_llm_name,
                 keep_alive="3h", 
                 max_tokens=512,  
                 temperature=0)


# Create prompt template
template = """Answer the question based only on the following context:
{context}

Question: {question}

Answer: """
prompt = ChatPromptTemplate.from_template(template)


# Create the RAG chain using LCEL with prompt printing and streaming output
rag_chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | llm
)

# Function to ask questions
def ask_question(question):
    print("Answer:", end=" ", flush=True)
    for chunk in rag_chain.stream(question):
        print(chunk.content, end="", flush=True)
    print("\n")


# Example usage
if __name__ == "__main__":
    while True:
        user_question = input("Ask a question (or type 'quit' to exit): ")
        if user_question.lower() == 'quit':
            break
        answer = ask_question(user_question)
        # print("\nFull answer received.\n")