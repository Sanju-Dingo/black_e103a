// Check authentication
if (!localStorage.getItem('currentUser')) {
    window.location.href = 'login.html';
}

let selectedLevel = 'beginner';
let uploadedPDFs = [];
let aiContentCache = new Map();

// Initialize student interface
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is a student
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id || currentUser.role !== 'student') {
        window.location.href = 'login.html';
        return;
    }
    
    // Display user info
    document.querySelector('h1').textContent = `Welcome, ${currentUser.name}!`;
    
    setupStudentFileUpload();
    updateLevelDescription();
    
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

function selectLevel(level) {
    selectedLevel = level;
    
    // Update button states
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-level="${level}"]`).classList.add('active');
    
    updateLevelDescription();
}

function updateLevelDescription() {
    const descriptions = {
        beginner: '<p><strong>Beginner Level:</strong> Simple explanations with basic concepts and plenty of examples</p>',
        intermediate: '<p><strong>Intermediate Level:</strong> Detailed explanations with moderate complexity and practical applications</p>',
        advanced: '<p><strong>Advanced Level:</strong> In-depth analysis with complex concepts and theoretical foundations</p>'
    };
    
    document.getElementById('levelDescription').innerHTML = descriptions[selectedLevel];
}

function setupStudentFileUpload() {
    const uploadArea = document.getElementById('studentUpload');
    const fileInput = document.getElementById('studentFileInput');
    
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
        handleStudentFiles(e.dataTransfer.files);
    });
    
    fileInput.addEventListener('change', (e) => {
        handleStudentFiles(e.target.files);
    });
}

function handleStudentFiles(files) {
    const uploadedFilesDiv = document.getElementById('studentUploadedFiles');
    
    Array.from(files).forEach(async file => {
        if (validatePDFFile(file)) {
            uploadedPDFs.push(file);
            displayStudentFile(file, uploadedFilesDiv);
            
            // Extract PDF text with Gemini AI
            if (window.geminiAI) {
                showPDFProcessing(file.name);
                const result = await window.geminiAI.extractPDFText(file);
                
                if (result.success) {
                    showPDFSuccess(file.name, result.pages);
                } else {
                    showPDFError(file.name, result.error);
                }
            }
        }
    });
}

function showPDFProcessing(fileName) {
    const processingDiv = document.createElement('div');
    processingDiv.id = `processing-${fileName}`;
    processingDiv.innerHTML = `
        <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0;">
            <p>🔄 Processing ${fileName}... Extracting text with AI</p>
        </div>
    `;
    document.getElementById('studentUploadedFiles').appendChild(processingDiv);
}

function showPDFSuccess(fileName, pages) {
    const processingDiv = document.getElementById(`processing-${fileName}`);
    if (processingDiv) {
        processingDiv.innerHTML = `
            <div style="background: #d4edda; padding: 10px; border-radius: 5px; margin: 10px 0;">
                <p>✅ ${fileName} processed successfully (${pages} pages)</p>
                <button onclick="generateFromPDF()" class="btn btn-primary">Generate Content from PDF</button>
            </div>
        `;
    }
}

function showPDFError(fileName, error) {
    const processingDiv = document.getElementById(`processing-${fileName}`);
    if (processingDiv) {
        processingDiv.innerHTML = `
            <div style="background: #f8d7da; padding: 10px; border-radius: 5px; margin: 10px 0;">
                <p>❌ ${fileName}: ${error}</p>
            </div>
        `;
    }
}

async function generateFromPDF() {
    if (!window.geminiAI || !window.geminiAI.pdfText) {
        alert('No PDF content available');
        return;
    }
    
    const loading = document.getElementById('studentLoading');
    const output = document.getElementById('studentOutput');
    const videoSection = document.getElementById('videoRecommendations');
    
    loading.style.display = 'block';
    output.innerHTML = '';
    videoSection.innerHTML = '';
    
    try {
        const aiResult = await window.geminiAI.generateContentFromPDF(selectedLevel);
        
        if (aiResult.success) {
            const content = formatAIContent(aiResult.content, 'PDF Analysis', selectedLevel);
            const videos = generatePDFVideoRecommendations(window.geminiAI.pdfText, selectedLevel);
            
            loading.style.display = 'none';
            output.innerHTML = content;
            videoSection.innerHTML = videos;
        } else {
            loading.style.display = 'none';
            output.innerHTML = `<p style="color: red;">${aiResult.error || aiResult.fallback}</p>`;
        }
    } catch (error) {
        loading.style.display = 'none';
        output.innerHTML = '<p style="color: red;">Error processing PDF content.</p>';
    }
}

function generatePDFVideoRecommendations(pdfText, level) {
    // Extract key topics from PDF text
    const topics = extractTopicsFromPDF(pdfText);
    
    console.log('Extracted topics from PDF:', topics); // Debug log
    
    let videoHTML = `
        <h3>📹 Videos Related to Your PDF Content (${level.charAt(0).toUpperCase() + level.slice(1)} Level)</h3>
        <div class="video-recommendations">
    `;
    
    topics.forEach((topic, index) => {
        const channels = getChannelsForLevel(level);
        const channel = channels[index % channels.length];
        
        videoHTML += `
            <div class="video-card">
                <div class="video-thumbnail">🎬</div>
                <h4>${topic}</h4>
                <p><strong>Channel:</strong> ${channel.name}</p>
                <p><strong>Level:</strong> ${level.charAt(0).toUpperCase() + level.slice(1)}</p>
                <p><strong>From PDF:</strong> Topic extracted from your document</p>
                <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' ' + channel.search + ' tutorial ' + level)}" target="_blank" class="btn btn-secondary">Watch on YouTube</a>
            </div>
        `;
    });
    
    videoHTML += `
        </div>
        <div class="video-note">
            <p><strong>📌 Note:</strong> These videos are based on topics and headings extracted from your uploaded PDF document.</p>
        </div>
    `;
    
    return videoHTML;
}

function extractTopicsFromPDF(pdfText) {
    const topics = [];
    
    // Extract headings (lines that are likely titles - short lines, capitalized, etc.)
    const lines = pdfText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    lines.forEach(line => {
        // Look for potential headings (short lines, mostly uppercase, or title case)
        if (line.length < 100 && line.length > 5) {
            const upperCaseRatio = (line.match(/[A-Z]/g) || []).length / line.length;
            const hasNumbers = /\d/.test(line);
            const isLikelyHeading = upperCaseRatio > 0.3 || /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(line);
            
            if (isLikelyHeading && !hasNumbers) {
                topics.push(line);
            }
        }
    });
    
    // If no headings found, extract key terms
    if (topics.length === 0) {
        const keyTerms = extractKeyTerms(pdfText);
        topics.push(...keyTerms);
    }
    
    // Return top 3 topics
    return topics.slice(0, 3).length > 0 ? topics.slice(0, 3) : ['PDF Content', 'Study Material', 'Educational Content'];
}

function extractKeyTerms(pdfText) {
    const words = pdfText.toLowerCase().split(/\s+/);
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'a', 'an', 'chapter', 'section', 'page', 'figure', 'table']);
    
    // Count word frequency
    const wordCount = {};
    words.forEach(word => {
        const cleanWord = word.replace(/[^a-z]/g, '');
        if (cleanWord.length > 4 && !commonWords.has(cleanWord)) {
            wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
        }
    });
    
    // Get top 3 most frequent words as topics
    return Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
}

function getChannelsForLevel(level) {
    const channels = {
        beginner: [
            { name: 'Khan Academy', search: 'khan academy tutorial' },
            { name: 'Crash Course', search: 'crash course' },
            { name: 'TED-Ed', search: 'ted ed explained' }
        ],
        intermediate: [
            { name: 'MIT OpenCourseWare', search: 'MIT lecture' },
            { name: '3Blue1Brown', search: '3blue1brown' },
            { name: 'Professor Leonard', search: 'professor leonard' }
        ],
        advanced: [
            { name: 'Stanford Online', search: 'stanford university' },
            { name: 'Harvard Extension', search: 'harvard lecture' },
            { name: 'Nature Video', search: 'nature video research' }
        ]
    };
    
    return channels[level] || channels.intermediate;
}

function validatePDFFile(file) {
    if (file.type !== 'application/pdf') {
        alert('Please upload only PDF files');
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

function displayStudentFile(file, container) {
    const fileDiv = document.createElement('div');
    fileDiv.className = 'uploaded-file';
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    fileDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: white; border-radius: 5px; margin: 5px 0; border: 1px solid #ddd;">
            <span>📄 ${file.name} (${fileSizeMB} MB)</span>
            <button onclick="removeStudentFile('${file.name}')" style="background: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Remove</button>
        </div>
    `;
    container.appendChild(fileDiv);
}

function removeStudentFile(fileName) {
    uploadedPDFs = uploadedPDFs.filter(file => file.name !== fileName);
    document.getElementById('studentUploadedFiles').innerHTML = '';
    uploadedPDFs.forEach(file => displayStudentFile(file, document.getElementById('studentUploadedFiles')));
}

async function generateStudentContent() {
    const topic = document.getElementById('studentTopic').value;
    
    if (!topic.trim()) {
        alert('Please enter a topic you want to learn about');
        return;
    }
    
    const loading = document.getElementById('studentLoading');
    const output = document.getElementById('studentOutput');
    const videoSection = document.getElementById('videoRecommendations');
    
    loading.style.display = 'block';
    output.innerHTML = '';
    videoSection.innerHTML = '';
    
    try {
        let content;
        
        // Use Gemini Pro AI for dynamic content generation
        if (window.geminiAI) {
            const prompt = createStudentPrompt(topic, selectedLevel);
            const aiResult = await window.geminiAI.generateContent(prompt, selectedLevel, 'general');
            
            if (aiResult.success) {
                content = formatAIContent(aiResult.content, topic, selectedLevel);
            } else {
                content = `<p style="color: red;">${aiResult.error || aiResult.fallback}</p>`;
            }
        } else {
            content = '<p style="color: orange;">Gemini AI not available. Please add API key.</p>';
        }
        
        // Generate video recommendations with real YouTube API
        if (window.videoService) {
            const videos = await window.videoService.getVideoRecommendations(topic, selectedLevel);
            window.videoService.addVideoStyles();
            const videoHTML = window.videoService.createVideoPreviewHTML(videos);
            videoSection.innerHTML = videoHTML;
        } else {
            const videos = generateVideoRecommendations(topic, selectedLevel);
            videoSection.innerHTML = videos;
        }
        
    } catch (error) {
        loading.style.display = 'none';
        output.innerHTML = '<p style="color: red;">Error generating content. Please try again.</p>';
    }
}

function createStudentPrompt(topic, level) {
    const levelPrompts = {
        beginner: `Explain "${topic}" for complete beginners. Use:
        - Very simple language and short sentences
        - Basic definitions without jargon
        - Everyday examples and analogies
        - Step-by-step explanations
        - Visual descriptions
        - 3-5 simple practice questions
        - Encouraging tone
        Format in HTML with headings.`,
        
        intermediate: `Explain "${topic}" for intermediate learners. Include:
        - Clear definitions with some technical terms
        - Detailed explanations with examples
        - Real-world applications
        - Connections to other concepts
        - Problem-solving approaches
        - 5-7 practice questions of varying difficulty
        - Critical thinking prompts
        Format in HTML with proper structure.`,
        
        advanced: `Provide an advanced explanation of "${topic}" including:
        - Comprehensive theoretical framework
        - Technical terminology and precise definitions
        - Complex examples and case studies
        - Research findings and current developments
        - Interdisciplinary connections
        - Analysis and synthesis questions
        - Future implications and trends
        Format in HTML with detailed structure.`
    };
    
    return levelPrompts[level] || levelPrompts.intermediate;
}

function formatAIContent(aiContent, topic, level) {
    return `
        <div class="ai-generated-content">
            <div class="ai-header">
                <h3>🤖 Gemini Pro AI: ${topic}</h3>
                <div class="level-badge">
                    <span class="badge ${level}">${level.toUpperCase()} LEVEL</span>
                </div>
            </div>
            <div class="ai-content-body">
                ${aiContent}
            </div>
            <div class="ai-footer">
                <div class="quality-indicators">
                    <span class="indicator">✅ AI Generated</span>
                    <span class="indicator">✅ Dynamic Content</span>
                    <span class="indicator">✅ Level-Appropriate</span>
                    <span class="indicator">🤖 Gemini Pro</span>
                </div>
                <p class="ai-disclaimer"><small>Content dynamically generated by Google Gemini Pro AI</small></p>
            </div>
        </div>
    `;
}

// Remove all template functions - everything is now AI-generated
// Templates removed: generateLevelAppropriateContent, generateBeginnerContent, 
// generateIntermediateContent, generateAdvancedContent, generateCurriculumAlignedContent

function generateVideoRecommendations(topic, level) {
    // Real YouTube video recommendations based on topic and level
    const videoData = {
        beginner: [
            { 
                title: `${topic} Basics for Beginners`, 
                channel: "Khan Academy", 
                duration: "8:45", 
                thumbnail: "🎬",
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' basics beginner tutorial')}`
            },
            { 
                title: `Introduction to ${topic}`, 
                channel: "Crash Course", 
                duration: "12:30", 
                thumbnail: "📺",
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent('crash course ' + topic + ' introduction')}`
            },
            { 
                title: `${topic} Explained Simply`, 
                channel: "TED-Ed", 
                duration: "6:20", 
                thumbnail: "🎥",
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent('ted ed ' + topic + ' explained')}`
            }
        ],
        intermediate: [
            { 
                title: `Understanding ${topic} in Detail`, 
                channel: "MIT OpenCourseWare", 
                duration: "15:45", 
                thumbnail: "🎬",
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent('MIT ' + topic + ' lecture')}`
            },
            { 
                title: `${topic} Applications and Examples`, 
                channel: "3Blue1Brown", 
                duration: "18:20", 
                thumbnail: "📺",
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent('3blue1brown ' + topic)}`
            },
            { 
                title: `Mastering ${topic} Concepts`, 
                channel: "Professor Leonard", 
                duration: "22:15", 
                thumbnail: "🎥",
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent('professor leonard ' + topic)}`
            }
        ],
        advanced: [
            { 
                title: `Advanced ${topic} Theory`, 
                channel: "Stanford Online", 
                duration: "35:20", 
                thumbnail: "🎬",
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent('stanford ' + topic + ' advanced')}`
            },
            { 
                title: `${topic} Research and Applications`, 
                channel: "Harvard Extension", 
                duration: "28:45", 
                thumbnail: "📺",
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent('harvard ' + topic + ' research')}`
            },
            { 
                title: `Cutting-edge ${topic} Developments`, 
                channel: "Nature Video", 
                duration: "42:10", 
                thumbnail: "🎥",
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent('nature video ' + topic + ' latest')}`
            }
        ]
    };
    
    const videos = videoData[level];
    
    let videoHTML = `
        <h3>📹 Recommended Videos for ${topic} (${level.charAt(0).toUpperCase() + level.slice(1)} Level)</h3>
        <div class="video-recommendations">
    `;
    
    videos.forEach(video => {
        videoHTML += `
            <div class="video-card">
                <div class="video-thumbnail">${video.thumbnail}</div>
                <h4>${video.title}</h4>
                <p><strong>Channel:</strong> ${video.channel}</p>
                <p><strong>Duration:</strong> ${video.duration}</p>
                <a href="${video.url}" target="_blank" class="btn btn-secondary">Watch on YouTube</a>
            </div>
        `;
    });
    
    videoHTML += `
        </div>
        <div class="video-note">
            <p><strong>📌 Note:</strong> These videos are curated based on your learning level and will open YouTube search results for the best matches.</p>
        </div>
    `;
    
    return videoHTML;
}