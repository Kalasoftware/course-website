// Theme Toggle
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Progress Tracking
class ProgressTracker {
    constructor() {
        this.progress = JSON.parse(localStorage.getItem('courseProgress')) || {};
    }

    updateProgress(courseId, videoId) {
        if (!this.progress[courseId]) {
            this.progress[courseId] = { videos: {} };
        }
        this.progress[courseId].videos[videoId] = true;
        this.saveProgress();
        this.updateUI(courseId);
    }

    getProgress(courseId) {
        return this.progress[courseId] || { videos: {} };
    }

    saveProgress() {
        localStorage.setItem('courseProgress', JSON.stringify(this.progress));
    }

    updateUI(courseId) {
        const progress = this.getProgress(courseId);
        const totalVideos = document.querySelectorAll('.video-list li').length;
        const watchedVideos = Object.keys(progress.videos).length;
        const percentage = (watchedVideos / totalVideos) * 100;

        const progressBar = document.querySelector('.progress-fill');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    }
}

// Search Functionality
function searchCourses(query) {
    const courseCards = document.querySelectorAll('.course-card');
    query = query.toLowerCase().trim();

    courseCards.forEach(card => {
        const title = card.querySelector('h2').textContent.toLowerCase();
        const moduleCount = card.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(query) || moduleCount.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);

    // Initialize progress tracker
    const progressTracker = new ProgressTracker();
    
    // Video progress tracking
    const video = document.querySelector('video');
    if (video) {
        const courseId = window.location.pathname.split('/')[2];
        const videoId = window.location.pathname.split('/')[4];
        
        video.addEventListener('ended', () => {
            progressTracker.updateProgress(courseId, videoId);
        });
    }

    // Search functionality
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchCourses(e.target.value);
        });
    }
});