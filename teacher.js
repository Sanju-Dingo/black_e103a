// Check authentication
if (!localStorage.getItem('currentUser')) {
    window.location.href = 'login.html';
}

let curriculumSettings = {};
let uploadedMaterials = [];

// Initialize teacher interface
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is a teacher
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id || currentUser.role !== 'teacher') {
        window.location.href = 'login.html';
        return;
    }
    
    // Display user info
    document.querySelector('h1').textContent = `Welcome, ${currentUser.name}!`;
    
    setupFileUpload();
    setupCurriculumForm();
    
    // Add logout functionality
    addLogoutButton();
});

function addLogoutButton() {
    const header = document.querySelector('header');
    if (header && !document.getElementById('logout-btn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logout-btn';
        logoutBtn.textContent = 'Logout';
        logoutBtn.className = 'btn btn-secondary';
        logoutBtn.style.cssText = 'position: absolute; top: 20px; right: 20px;';
        logoutBtn.onclick = () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        };
        header.appendChild(logoutBtn);
    }
}

function setupCurriculumForm() {
    document.getElementById('curriculumForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        curriculumSettings = {
            subject: document.getElementById('subject').value,
            grade: document.getElementById('grade').value,
            standards: document.getElementById('standards').value
        };
        
        alert('Curriculum settings saved successfully!');
    });
}

function setupFileUpload() {
    const uploadArea = document.getElementById('teacherUpload');
    const fileInput = document.getElementById('teacherFileInput');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
}

function handleFiles(files) {
    const uploadedFilesDiv = document.getElementById('uploadedFiles');
    
    Array.from(files).forEach(async file => {
        if (validateFile(file)) {
            uploadedMaterials.push(file);
            displayUploadedFile(file, uploadedFilesDiv);
            
            // Process PDF with Gemini AI
            if (file.type === 'application/pdf' && window.geminiAI) {
                const processingDiv = document.createElement('div');
                processingDiv.innerHTML = `
                    <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0;">
                        <p>🔄 Processing ${file.name} with Gemini AI...</p>
                    </div>
                `;
                uploadedFilesDiv.appendChild(processingDiv);
                
                const result = await window.geminiAI.extractPDFText(file);
                
                if (result.success) {
                    processingDiv.innerHTML = `
                        <div style="background: #d4edda; padding: 10px; border-radius: 5px; margin: 10px 0;">
                            <p>✅ ${file.name} processed successfully (${result.pages} pages)</p>
                            <p><small>PDF content extracted and ready for lesson generation</small></p>
                        </div>
                    `;
                } else {
                    processingDiv.innerHTML = `
                        <div style="background: #f8d7da; padding: 10px; border-radius: 5px; margin: 10px 0;">
                            <p>❌ ${file.name}: ${result.error}</p>
                        </div>
                    `;
                }
            }
        }
    });
}

function validateFile(file) {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    
    if (!allowedTypes.includes(file.type)) {
        alert(`File type ${file.type} is not supported. Please upload PDF, DOC, or TXT files.`);
        return false;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
        alert('File size must be less than 50MB');
        return false;
    }
    
    if (file.size === 0) {
        alert('File appears to be empty');
        return false;
    }
    
    return true;
}

function displayUploadedFile(file, container) {
    const fileDiv = document.createElement('div');
    fileDiv.className = 'uploaded-file';
    fileDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: white; border-radius: 5px; margin: 5px 0; border: 1px solid #ddd;">
            <span>📄 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            <button onclick="removeFile('${file.name}')" style="background: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Remove</button>
        </div>
    `;
    container.appendChild(fileDiv);
}

function removeFile(fileName) {
    uploadedMaterials = uploadedMaterials.filter(file => file.name !== fileName);
    document.getElementById('uploadedFiles').innerHTML = '';
    uploadedMaterials.forEach(file => displayUploadedFile(file, document.getElementById('uploadedFiles')));
}

async function generateTeacherContent() {
    const topic = document.getElementById('topic').value;
    const contentType = document.getElementById('contentType').value;
    
    if (!topic.trim()) {
        alert('Please enter a topic');
        return;
    }
    
    if (!curriculumSettings.subject) {
        alert('Please set up curriculum settings first');
        return;
    }
    
    const loading = document.getElementById('teacherLoading');
    const output = document.getElementById('teacherOutput');
    
    loading.style.display = 'block';
    output.innerHTML = '';
    
    try {
        let content;
        
        // Use Gemini Pro AI for dynamic content generation
        if (window.geminiAI) {
            const prompt = createTeacherPrompt(topic, contentType, curriculumSettings);
            const aiResult = await window.geminiAI.generateContent(prompt, 'intermediate', curriculumSettings.subject);
            
            if (aiResult.success) {
                content = formatTeacherAIContent(aiResult.content, topic, contentType, curriculumSettings);
            } else {
                content = `<p style="color: red;">${aiResult.error || aiResult.fallback}</p>`;
            }
        } else {
            content = '<p style="color: orange;">Gemini AI not loaded. Please refresh the page.</p>';
        }
        
        loading.style.display = 'none';
        output.innerHTML = content;
        
    } catch (error) {
        loading.style.display = 'none';
        output.innerHTML = '<p style="color: red;">Error generating content. Please try again.</p>';
    }
}

function createTeacherPrompt(topic, contentType, settings) {
    const prompts = {
        quiz: `Create a complete quiz about "${topic}" for ${settings.grade} ${settings.subject} students. 

Format the quiz with proper HTML structure including:
- A clear title
- 5 multiple choice questions with 4 options each (A, B, C, D)
- Mark the correct answers clearly
- 3 short answer questions
- Clear instructions for students

Use proper HTML formatting with <h3>, <ol>, <li>, <p> tags. Do not use markdown. Make it a complete, ready-to-use quiz.`,
        
        explanation: `Create a detailed explanation of "${topic}" for ${settings.grade} ${settings.subject} students. Include definition, key concepts, examples, and 3 practice questions. Use HTML headings and formatting. Do not use markdown.`
    };
    
    return prompts[contentType] || prompts.explanation;
}

function formatTeacherAIContent(aiContent, topic, contentType, settings) {
    return `
        <div class="ai-generated-content teacher-content">
            <div class="content-header">
                <h3>🤖 Gemini Pro Generated ${contentType}: ${topic}</h3>
                <div class="curriculum-info">
                    <span class="info-badge">Subject: ${settings.subject}</span>
                    <span class="info-badge">Grade: ${settings.grade}</span>
                    <span class="info-badge">🤖 Gemini AI</span>
                </div>
            </div>
            <div class="ai-content-body">
                ${aiContent}
            </div>
            <div class="curriculum-alignment">
                <h4>📚 Curriculum Alignment</h4>
                <p><strong>Standards:</strong> ${settings.standards || 'General curriculum standards'}</p>
            </div>
            <div class="quality-assurance">
                <div class="qa-indicators">
                    <span class="qa-indicator">✅ AI Generated</span>
                    <span class="qa-indicator">✅ Dynamic Content</span>
                    <span class="qa-indicator">✅ Curriculum-aligned</span>
                    <span class="qa-indicator">🤖 Gemini 2.5</span>
                </div>
            </div>
        </div>
    `;
}

// All template functions removed - content is now 100% AI-generated
// Removed: generateCurriculumAlignedContent, generateLessonPlan, generateWorksheet, generateQuiz, generateExplanation