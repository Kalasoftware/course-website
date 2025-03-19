document.addEventListener('DOMContentLoaded', function() {
    const video = document.querySelector('video');
    let lastUpdateTime = 0;
    const updateInterval = 5; // Update every 5 seconds

    function updateProgress() {
        const currentTime = video.currentTime;
        const duration = video.duration;
        const progress = (currentTime / duration) * 100;
        
        const courseName = video.dataset.courseName;
        const moduleName = video.dataset.moduleName;
        const videoName = video.dataset.videoId;

        // Update progress if more than 5 seconds have passed
        if (currentTime - lastUpdateTime >= updateInterval) {
            fetch('/api/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    course: courseName,
                    module: moduleName,
                    video: videoName,
                    progress: progress.toFixed(2),
                    currentTime: currentTime
                })
            })
            .then(response => response.json())
            .then(data => {
                lastUpdateTime = currentTime;
                console.log('Progress saved:', progress.toFixed(2) + '%');
            })
            .catch(error => console.error('Error saving progress:', error));
        }
    }

    // Update progress on timeupdate
    video.addEventListener('timeupdate', updateProgress);

    // Save progress when video ends
    video.addEventListener('ended', function() {
        updateProgress();
    });

    // Save progress before user leaves page
    window.addEventListener('beforeunload', function() {
        updateProgress();
    });
});