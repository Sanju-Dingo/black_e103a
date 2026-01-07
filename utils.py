from PyPDF2 import PdfReader

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_google_genai import (
    GoogleGenerativeAIEmbeddings,
    ChatGoogleGenerativeAI
)
from langchain.chains import RetrievalQA

def process_pdf(uploaded_file, api_key):
    """
    Reads PDF -> Embeds with Gemini -> Saves to FAISS
    """
    if not uploaded_file:
        return None
    
    # 1. Read PDF
    pdf_reader = PdfReader(uploaded_file)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text() or ""
        
    # 2. Split text
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_text(text)
    
    # 3. Embeddings
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001", 
        google_api_key=api_key
    )
    
    # 4. Vector Store
    vectorstore = FAISS.from_texts(texts=chunks, embedding=embeddings)
    
    return vectorstore

def get_answer(vectorstore, question, complexity, api_key):
    # 1. Define Persona
    if complexity == "Beginner":
        style = "Explain this like I am 10 years old. Use simple analogies."
    elif complexity == "Intermediate":
        style = "Explain this to a high school student. Be clear and factual."
    else: 
        style = "Explain this to a university professor. Use technical terms."

    # 2. Setup Google Model
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=api_key,
        temperature=0.3
    )
    
    # 3. Run Chain
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vectorstore.as_retriever(),
    )
    
    full_query = f"Style: {style} \n Question: {question}"
    response = qa_chain.invoke(full_query)
    
    return response['result']
