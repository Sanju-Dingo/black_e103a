// Video Recommendation Service
class VideoRecommendationService {
    constructor() {
        this.youtubeApiKey = "AIzaSyDkMrNlrDsfnT1dgtdRZ-cAg5yfRVB2Qis"; // Use same API key
        this.baseURL = "https://www.googleapis.com/youtube/v3";
    }

    async getVideoRecommendations(topic, level = 'intermediate') {
        try {
            const searchQuery = this.buildSearchQuery(topic, level);
            const response = await fetch(
                `${this.baseURL}/search?part=snippet&maxResults=6&q=${encodeURIComponent(searchQuery)}&type=video&key=${this.youtubeApiKey}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch video recommendations');
            }

            const data = await response.json();
            return this.formatVideoResults(data.items);

        } catch (error) {
            console.error('Video recommendation error:', error);
            return this.getFallbackVideos(topic);
        }
    }

    buildSearchQuery(topic, level) {
        const levelKeywords = {
            beginner: 'basics introduction tutorial for beginners',
            intermediate: 'explained tutorial guide',
            advanced: 'advanced deep dive masterclass'
        };

        return `${topic} ${levelKeywords[level] || levelKeywords.intermediate} educational`;
    }

    formatVideoResults(items) {
        return items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`
        }));
    }

    getFallbackVideos(topic) {
        return [
            {
                id: 'dQw4w9WgXcQ',
                title: `Learn ${topic} - Educational Video`,
                description: `Comprehensive guide to understanding ${topic}`,
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                channelTitle: 'Educational Channel',
                publishedAt: new Date().toISOString(),
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
            }
        ];
    }

    createVideoPreviewHTML(videos) {
        if (!videos || videos.length === 0) {
            return '<p>No video recommendations available.</p>';
        }

        return `
            <div class="video-recommendations">
                <h3>📺 Recommended Videos</h3>
                <div class="video-grid">
                    ${videos.map(video => `
                        <div class="video-card" data-video-id="${video.id}">
                            <div class="video-thumbnail" onclick="openVideoModal('${video.embedUrl}', '${video.title}')">
                                <img src="${video.thumbnail}" alt="${video.title}">
                                <div class="play-overlay">
                                    <div class="play-button">▶</div>
                                </div>
                            </div>
                            <div class="video-info">
                                <h4 class="video-title">${video.title}</h4>
                                <p class="video-channel">${video.channelTitle}</p>
                                <div class="video-actions">
                                    <button onclick="openVideoModal('${video.embedUrl}', '${video.title}')" class="btn-preview">
                                        Preview
                                    </button>
                                    <button onclick="window.open('${video.url}', '_blank')" class="btn-watch">
                                        Watch Full
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Video Modal -->
            <div id="video-modal" class="video-modal" onclick="closeVideoModal()">
                <div class="video-modal-content" onclick="event.stopPropagation()">
                    <span class="video-modal-close" onclick="closeVideoModal()">&times;</span>
                    <h3 id="modal-video-title"></h3>
                    <div class="video-container">
                        <iframe id="modal-video-frame" src="" frameborder="0" allowfullscreen></iframe>
                    </div>
                    <div class="modal-actions">
                        <button onclick="closeVideoModal()" class="btn-secondary">Close Preview</button>
                        <button onclick="watchFullVideo()" class="btn-primary">Watch Full Video</button>
                    </div>
                </div>
            </div>
        `;
    }

    addVideoStyles() {
        const styles = `
            <style>
                .video-recommendations {
                    margin: 20px 0;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 10px;
                }
                
                .video-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin-top: 15px;
                }
                
                .video-card {
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    transition: transform 0.3s ease;
                }
                
                .video-card:hover {
                    transform: translateY(-5px);
                }
                
                .video-thumbnail {
                    position: relative;
                    cursor: pointer;
                }
                
                .video-thumbnail img {
                    width: 100%;
                    height: 180px;
                    object-fit: cover;
                }
                
                .play-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .video-thumbnail:hover .play-overlay {
                    opacity: 1;
                }
                
                .play-button {
                    width: 60px;
                    height: 60px;
                    background: rgba(255,255,255,0.9);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    color: #333;
                }
                
                .video-info {
                    padding: 15px;
                }
                
                .video-title {
                    font-size: 14px;
                    font-weight: 600;
                    margin: 0 0 8px 0;
                    line-height: 1.3;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .video-channel {
                    font-size: 12px;
                    color: #666;
                    margin: 0 0 15px 0;
                }
                
                .video-actions {
                    display: flex;
                    gap: 10px;
                }
                
                .btn-preview, .btn-watch {
                    flex: 1;
                    padding: 8px 12px;
                    border: none;
                    border-radius: 5px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                }
                
                .btn-preview {
                    background: #e3f2fd;
                    color: #1976d2;
                }
                
                .btn-preview:hover {
                    background: #bbdefb;
                }
                
                .btn-watch {
                    background: #ff4444;
                    color: white;
                }
                
                .btn-watch:hover {
                    background: #cc0000;
                }
                
                .video-modal {
                    display: none;
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.8);
                }
                
                .video-modal-content {
                    position: relative;
                    background-color: white;
                    margin: 5% auto;
                    padding: 20px;
                    width: 90%;
                    max-width: 800px;
                    border-radius: 10px;
                }
                
                .video-modal-close {
                    position: absolute;
                    right: 15px;
                    top: 15px;
                    font-size: 28px;
                    font-weight: bold;
                    cursor: pointer;
                    color: #aaa;
                }
                
                .video-modal-close:hover {
                    color: #000;
                }
                
                .video-container {
                    position: relative;
                    width: 100%;
                    height: 0;
                    padding-bottom: 56.25%;
                    margin: 15px 0;
                }
                
                .video-container iframe {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }
                
                .modal-actions {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    margin-top: 15px;
                }
                
                .btn-primary, .btn-secondary {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                }
                
                .btn-primary {
                    background: #ff4444;
                    color: white;
                }
                
                .btn-secondary {
                    background: #f5f5f5;
                    color: #333;
                }
            </style>
        `;
        
        if (!document.querySelector('#video-styles')) {
            const styleElement = document.createElement('div');
            styleElement.id = 'video-styles';
            styleElement.innerHTML = styles;
            document.head.appendChild(styleElement);
        }
    }
}

// Global video modal functions
let currentVideoUrl = '';

function openVideoModal(embedUrl, title) {
    const modal = document.getElementById('video-modal');
    const titleElement = document.getElementById('modal-video-title');
    const iframe = document.getElementById('modal-video-frame');
    
    currentVideoUrl = embedUrl.replace('/embed/', '/watch?v=');
    titleElement.textContent = title;
    iframe.src = embedUrl + '?autoplay=1';
    modal.style.display = 'block';
}

function closeVideoModal() {
    const modal = document.getElementById('video-modal');
    const iframe = document.getElementById('modal-video-frame');
    
    modal.style.display = 'none';
    iframe.src = '';
}

function watchFullVideo() {
    window.open(currentVideoUrl, '_blank');
    closeVideoModal();
}

// Initialize video service
const videoService = new VideoRecommendationService();

// Export for use in other files
if (typeof window !== 'undefined') {
    window.VideoRecommendationService = VideoRecommendationService;
    window.videoService = videoService;
}