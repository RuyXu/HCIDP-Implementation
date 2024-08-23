# import
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import OllamaEmbeddings
from langchain_text_splitters import CharacterTextSplitter

# load the document and split it into chunks
loader = PyPDFLoader("C:/Users/xurin/OneDrive/Desktop/Ruy/UCD/Trimester 3/HCI Design Project/Week 10/Implementation 20240805/Uploads/pdfs/2024-08-05T14-04-41_939Z_HCI_Design_Project_Zoom_Link_2024.pdf")
documents = loader.load()

# split it into chunks
text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
docs = text_splitter.split_documents(documents)

# create the open-source embedding function
embedding_function = OllamaEmbeddings(model="nomic-embed-text", show_progress=True)

# load it into Chroma
db2 = Chroma.from_documents(docs, embedding_function, persist_directory="./KnowledgeBase")
# query it
query = "What is the zoom link"
db3 = Chroma(persist_directory="./KnowledgeBase", embedding_function=embedding_function)
docs = db3.similarity_search(query)
# query = "What is the zoom link"
# docs = db2.similarity_search(query)

# # print results
print(docs[0].page_content)