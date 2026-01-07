from langchain.chains.retrieval_qa.base import RetrievalQA
from langchain_openai import ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter


def process_pdf(uploaded_file, api_key):
    """
    Reads PDF -> Splits -> Embeds with Gemini -> Saves to FAISS
    """
    if not uploaded_file:
        return None

    # Read PDF
    pdf_reader = PdfReader(uploaded_file)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text() or ""

    # Split text
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    chunks = text_splitter.split_text(text)

    # Gemini Embeddings
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=api_key
    )

    # Vector Store
    vectorstore = FAISS.from_texts(chunks, embeddings)

    return vectorstore


def get_answer(vectorstore, question, complexity, api_key):
    """
    Uses RetrievalQA to answer questions from syllabus
    """

    # Persona based on difficulty
    if complexity == "Beginner":
        style = "Explain simply like to a 10-year-old with examples."
    elif complexity == "Intermediate":
        style = "Explain clearly to a high school student."
    else:
        style = "Explain technically at university level."

    # Gemini Chat Model
    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=api_key,
        temperature=0.3
    )

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vectorstore.as_retriever()
    )

    full_query = f"""
    Instruction: {style}

    Question: {question}
    """

    response = qa_chain.invoke(full_query)
    return response["result"]
