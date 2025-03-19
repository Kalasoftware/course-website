document.addEventListener('DOMContentLoaded', function() {
    const video = document.querySelector('video');
    const qualitySelector = document.getElementById('quality-selector');
    const notesContainer = document.getElementById('notes-container');
    const noteInput = document.getElementById('note-input');
    const saveNoteBtn = document.getElementById('save-note');

    // Format timestamp properly
    function formatTime(seconds) {
        if (!seconds) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Seek to timestamp when clicking "Jump to"
    window.seekTo = function(timestamp) {
        if (video && !isNaN(timestamp)) {
            video.currentTime = timestamp;
            video.play();
        }
    };

    // Load and display notes
    async function loadNotes() {
        try {
            const response = await fetch(`/api/notes/${video.dataset.videoId}`);
            const notes = await response.json();
            
            notesContainer.innerHTML = notes.map(note => `
                <div class="note-item">
                    <div class="note-header">
                        <span class="timestamp" onclick="seekTo(${note.timestamp})">${formatTime(note.timestamp)}</span>
                        <button class="jump-btn" onclick="seekTo(${note.timestamp})">Jump to</button>
                    </div>
                    <p class="note-text">${note.note_text}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading notes:', error);
            notesContainer.innerHTML = '<p>Failed to load notes</p>';
        }
    }

    // Save note with current timestamp
    saveNoteBtn.addEventListener('click', async function() {
        const noteText = noteInput.value.trim();
        if (!noteText) return;

        const timestamp = video.currentTime;
        
        try {
            const response = await fetch('/api/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    note: noteText,
                    timestamp,
                    videoId: video.dataset.videoId,
                    courseName: video.dataset.courseName,
                    moduleName: video.dataset.moduleName
                })
            });
            
            if (response.ok) {
                await loadNotes();
                noteInput.value = '';
            }
        } catch (error) {
            console.error('Error saving note:', error);
        }
    });

    // Initialize notes on page load
    loadNotes();
    // Add this to your existing videoPlayer.js
    const toggleSubtitlesBtn = document.getElementById('toggle-subtitles');
    const subtitleSizeSelect = document.getElementById('subtitle-size');
    const videoContainer = document.querySelector('.video-container');
    
    // Enhanced subtitle toggle functionality
    toggleSubtitlesBtn.addEventListener('click', function() {
        const tracks = video.textTracks;
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            if (track.kind === 'subtitles') {
                if (track.mode === 'showing') {
                    track.mode = 'hidden';
                    toggleSubtitlesBtn.classList.remove('active');
                    localStorage.setItem('subtitles-enabled', 'false');
                } else {
                    track.mode = 'showing';
                    toggleSubtitlesBtn.classList.add('active');
                    localStorage.setItem('subtitles-enabled', 'true');
                }
                break;
            }
        }
    });

    // Initialize subtitle tracks when video loads
    video.addEventListener('loadedmetadata', function() {
        const tracks = video.textTracks;
        const subtitlesEnabled = localStorage.getItem('subtitles-enabled') !== 'false';
        
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            if (track.kind === 'subtitles') {
                track.mode = subtitlesEnabled ? 'showing' : 'hidden';
                if (subtitlesEnabled) {
                    toggleSubtitlesBtn.classList.add('active');
                }
                break;
            }
        }
    });
    
    // Change subtitle size
    subtitleSizeSelect.addEventListener('change', function() {
        videoContainer.className = 'video-container subtitle-size-' + this.value;
    });
    
    // Initialize subtitle state
    window.addEventListener('load', function() {
        const track = video.textTracks[0];
        if (track) {
            track.mode = 'showing';
            toggleSubtitlesBtn.classList.add('active');
        }
    });
});