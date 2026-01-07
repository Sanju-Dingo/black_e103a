# ---------------- IMPORTS ----------------
from PyPDF2 import PdfReader

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA


# ---------------- PDF PROCESSING ----------------
def process_pdf(uploaded_file, api_key):
    """
    Reads PDF -> Splits -> Embeds locally -> Saves to FAISS
    """
    if not uploaded_file:
        return None

    # Read PDF
    pdf_reader = PdfReader(uploaded_file)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text() or ""

    # Split text
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=100
    )
    chunks = splitter.split_text(text)

    # Local embeddings (NO Gemini quota issues)
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/paraphrase-MiniLM-L3-v2"
    )

    # Vector store
    vectorstore = FAISS.from_texts(
        texts=chunks,
        embedding=embeddings
    )

    return vectorstore


# ---------------- QUESTION ANSWERING ----------------
def get_answer(vectorstore, question, complexity, api_key):
    """
    Uses Gemini + RetrievalQA to answer questions
    """

    # Persona control
    if complexity == "Beginner":
        style = "Explain simply like to a 10-year-old with examples."
    elif complexity == "Intermediate":
        style = "Explain clearly to a high school student."
    else:
        style = "Explain technically at university level."

    # Gemini Chat Model (STABLE + COMPATIBLE)
    llm = ChatGoogleGenerativeAI(
    model="models/gemini-pro",
    google_api_key=api_key,
    temperature=0.3,
    convert_system_message_to_human=True
)


    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vectorstore.as_retriever()
    )

    response = qa_chain.invoke(
        f"Instruction: {style}\nQuestion: {question}"
    )

    return response["result"]
