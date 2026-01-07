import streamlit as st
from utils import process_pdf, get_answer

# --- CONFIG ---
st.set_page_config(page_title="Tangerine AI", layout="wide")

# --- SESSION STATE ---
defaults = {
    "logged_in": False,
    "role": None,
    "vectorstore": None,
    "api_key": None,
    "messages": []
}

for key, value in defaults.items():
    if key not in st.session_state:
        st.session_state[key] = value

# --- USERS (Demo Only) ---
USERS = {
    "teacher": "admin123",
    "student": "learn123"
}

# --- LOGIN PAGE ---
def login_page():
    st.title("🛡️ Tangerine AI Login")

    col1, col2 = st.columns([1, 2])

    with col1:
        username = st.text_input("Username")
        password = st.text_input("Password", type="password")

        if st.button("Login"):
            if USERS.get(username) == password:
                st.session_state.logged_in = True
                st.session_state.role = username
                st.rerun()
            else:
                st.error("Invalid credentials")

    with col2:
        st.markdown("""
        ### 🔐 Demo Credentials
        | Role | Username | Password |
        |------|----------|----------|
        | Teacher | teacher | admin123 |
        | Student | student | learn123 |
        """)

# --- TEACHER DASHBOARD ---
def teacher_dashboard():
    st.title("👨‍🏫 Teacher Dashboard")
    st.markdown("---")

    # API KEY (SAFE)
    if not st.session_state.api_key:
        try:
            st.session_state.api_key = st.secrets["GOOGLE_API_KEY"]
            st.success("✅ Gemini Connected (Secrets)")
        except:
            st.session_state.api_key = st.text_input(
                "Enter Google API Key",
                type="password"
            )

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("System Status")
        if st.session_state.api_key:
            st.success("Gemini Ready")
        else:
            st.warning("API Key required")

    with col2:
        st.subheader("Upload Syllabus")
        uploaded_file = st.file_uploader(
            "Upload PDF", type="pdf"
        )

        if uploaded_file and st.button(
            "Process PDF",
            disabled=st.session_state.vectorstore is not None
        ):
            with st.spinner("Processing syllabus..."):
                st.session_state.vectorstore = process_pdf(
                    uploaded_file,
                    st.session_state.api_key
                )
            st.success("Knowledge Base Created!")

    st.markdown("---")
    if st.button("Logout"):
        st.session_state.clear()
        st.rerun()

# --- STUDENT DASHBOARD ---
def student_dashboard():
    st.title("🎓 Student Portal")

    if not st.session_state.vectorstore:
        st.warning("No syllabus uploaded yet.")
        if st.button("Logout"):
            st.session_state.clear()
            st.rerun()
        return

    with st.sidebar:
        st.header("Settings")
        complexity = st.select_slider(
            "Understanding Level",
            options=["Beginner", "Intermediate", "Advanced"]
        )

        if st.button("Clear Chat"):
            st.session_state.messages = []
            st.rerun()

        if st.button("Logout"):
            st.session_state.clear()
            st.rerun()

    # Chat History
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])

    # Chat Input
    if prompt := st.chat_input("Ask about your syllabus..."):
        st.session_state.messages.append(
            {"role": "user", "content": prompt}
        )

        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
                answer = get_answer(
                    st.session_state.vectorstore,
                    prompt,
                    complexity,
                    st.session_state.api_key
                )
                st.markdown(answer)

        st.session_state.messages.append(
            {"role": "assistant", "content": answer}
        )

# --- MAIN ---
if not st.session_state.logged_in:
    login_page()
else:
    if st.session_state.role == "teacher":
        teacher_dashboard()
    else:
        student_dashboard()
