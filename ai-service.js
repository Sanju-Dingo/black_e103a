// Real Gemini Pro AI Service - No Fallbacks
class GeminiAIService {
    constructor() {
        this.apiKey = "AIzaSyDkMrNlrDsfnT1dgtdRZ-cAg5yfRVB2Qis"; // Replace with actual key from https://makersuite.google.com/app/apikey
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
        this.pdfText = null;
    }

    async extractPDFText(file) {
        try {
            if (typeof pdfjsLib === 'undefined') {
                await this.loadPDFJS();
            }

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }

            if (fullText.trim().length === 0) {
                return {
                    success: false,
                    error: 'PDF is not readable or contains no extractable text'
                };
            }

            this.pdfText = fullText;
            return {
                success: true,
                text: fullText,
                pages: pdf.numPages
            };

        } catch (error) {
            return {
                success: false,
                error: 'PDF is not readable or contains no extractable text'
            };
        }
    }

    async loadPDFJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async generateContentFromPDF(level) {
        if (!this.pdfText) {
            return {
                success: false,
                error: 'No PDF content available'
            };
        }

        const prompt = `Based on this PDF content, create ${level} level educational material. Extract the main topics and create comprehensive explanations with examples and questions. Format in HTML with proper headings:\n\n${this.pdfText.substring(0, 8000)}\n\nCreate detailed educational content based on the topics found in this PDF.`;
        return await this.callGeminiAPI(prompt);
    }

    async generateContent(prompt, level = 'intermediate', subject = 'general') {
        const fullPrompt = `Create ${level} level educational content for ${subject}. ${prompt}. Format response in HTML with headings and structure.`;
        return await this.callGeminiAPI(fullPrompt);
    }

    async listAvailableModels() {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`);
            const data = await response.json();
            console.log('Available models:', data.models?.map(m => m.name));
            return data.models;
        } catch (error) {
            console.error('Error listing models:', error);
            return [];
        }
    }

    cleanHTMLResponse(content) {
        // Remove markdown code blocks and clean up HTML
        return content
            .replace(/```html\s*/gi, '')
            .replace(/```\s*/g, '')
            .replace(/^html\s*/gi, '')
            .trim();
    }

    async callGeminiAPI(prompt) {
        try {
            const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 4096
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                
                // Handle rate limit specifically
                if (response.status === 429) {
                    return {
                        success: false,
                        error: 'API quota exceeded. Please wait a moment and try again, or the system will work with local content generation.'
                    };
                }
                
                throw new Error(`API Error ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            
            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error('Invalid API response format');
            }

            const cleanedContent = this.cleanHTMLResponse(data.candidates[0].content.parts[0].text);
            
            return {
                success: true,
                content: cleanedContent,
                model: 'gemini-2.5-flash'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Initialize Gemini AI service
const geminiAI = new GeminiAIService();

// Export for use in other files
if (typeof window !== 'undefined') {
    window.GeminiAIService = GeminiAIService;
    window.geminiAI = geminiAI;
}