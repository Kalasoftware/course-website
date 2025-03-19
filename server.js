const express = require('express');
const session = require('express-session');
const mysql = require('mysql2/promise');
const authRoutes = require('./routes/auth');
const { isAuthenticated } = require('./middleware/auth');
const path = require('path');
const fs = require('fs').promises;

// Create MySQL pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'kaliya_courses',
    waitForConnections: true,
    connectionLimit: 10
});

const app = express();
const PORT = 3000;

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/courses', express.static('courses'));

// Session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Auth routes
app.use('/', authRoutes);

// Landing page route
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/courses');
    } else {
        res.render('landing');
    }
});

// Protected routes
// Add this new route for the dashboard with resume watching
app.get('/courses', isAuthenticated, async (req, res) => {
    try {
        const coursesDir = path.join(__dirname, 'courses');
        const courses = await fs.readdir(coursesDir);
        
        // Get recent videos with DISTINCT to avoid duplicates
        const [recentVideos] = await pool.execute(
            `SELECT DISTINCT course_name, module_name, video_name, progress_percentage, last_position, updated_at 
            FROM video_progress 
            WHERE user_id = ? 
            AND progress_percentage < 100
            GROUP BY course_name, module_name, video_name
            ORDER BY updated_at DESC 
            LIMIT 5`,
            [req.session.user.id]
        );
        
        const courseList = await Promise.all(courses.map(async (course) => {
            const modulesDir = path.join(coursesDir, course);
            const modules = await fs.readdir(modulesDir);
            
            const [completedVideos] = await pool.execute(
                `SELECT COUNT(*) as count 
                FROM video_progress 
                WHERE user_id = ? AND course_name = ? AND progress_percentage >= 95`,
                [req.session.user.id, course]
            );
            
            return {
                name: course,
                moduleCount: modules.length,
                completedCount: completedVideos[0].count
            };
        }));
        
        res.render('index', { 
            courses: courseList,
            user: req.session.user,
            recentVideos: recentVideos || []
        });
    } catch (error) {
        console.error('Error loading courses:', error);
        res.status(500).send('Error loading courses');
    }
});

// Update the course page route to include completion status
app.get('/course/:courseName', isAuthenticated, async (req, res) => {
    try {
        const courseName = req.params.courseName;
        const modulesDir = path.join(__dirname, 'courses', courseName);
        const modules = await fs.readdir(modulesDir);
        
        // Get video progress data
        const [progressData] = await pool.execute(
            `SELECT video_name, progress_percentage 
            FROM video_progress 
            WHERE user_id = ? AND course_name = ?`,
            [req.session.user.id, courseName]
        );
        
        // Create completion map
        const completionMap = {};
        progressData.forEach(item => {
            completionMap[item.video_name] = item.progress_percentage;
        });
        
        const moduleList = await Promise.all(modules.map(async (module) => {
            const videosDir = path.join(modulesDir, module);
            const files = await fs.readdir(videosDir);
            return {
                name: module,
                videos: files.filter(f => f.endsWith('.mp4')),
                subtitles: files.filter(f => f.endsWith('.srt'))
            };
        }));
        
        res.render('course', { 
            courseName,
            modules: moduleList,
            completionMap: completionMap // Pass completionMap to the template
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error loading course');
    }
});

// Add this with your other routes
// Update the progress endpoint
app.post('/api/progress', isAuthenticated, async (req, res) => {
    try {
        const { course, module, video, progress, currentTime } = req.body;
        const userId = req.session.user.id;

        console.log('Received progress data:', { userId, course, module, video, progress, currentTime });

        const [result] = await pool.execute(
            `INSERT INTO video_progress 
            (user_id, course_name, module_name, video_name, progress_percentage, last_position) 
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            progress_percentage = ?, 
            last_position = ?,
            updated_at = CURRENT_TIMESTAMP`,
            [userId, course, module, video, progress, currentTime, progress, currentTime]
        );

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Failed to save progress', details: error.message });
    }
});

// Add this to your video route to load saved progress
app.get('/video/:course/:module/:video', isAuthenticated, async (req, res) => {
    try {
        const { course, module, video } = req.params;
        const videoPath = path.join(__dirname, 'courses', course, module, video);
        const subtitlePath = videoPath.replace('.mp4', '.srt');
        
        await fs.access(videoPath);
        const hasSubtitles = await fs.access(subtitlePath)
            .then(() => true)
            .catch(() => false);
            
        let savedProgress = { progress_percentage: 0, last_position: 0 };
        
        try {
            const [rows] = await pool.execute(
                'SELECT progress_percentage, last_position FROM video_progress WHERE user_id = ? AND course_name = ? AND module_name = ? AND video_name = ?',
                [req.session.user.id, course, module, video]
            );
            if (rows.length > 0) {
                savedProgress = rows[0];
            }
        } catch (dbError) {
            console.error('Database error:', dbError);
        }
        
        res.render('video', {
            courseName: course,
            moduleName: module,
            videoName: video,
            videoPath: `/courses/${course}/${module}/${video}`,
            subtitlePath: hasSubtitles ? `/courses/${course}/${module}/${video.replace('.mp4', '.srt')}` : null,
            savedProgress
        });
    } catch (error) {
        console.error('Video access error:', error);
        res.status(404).send('Video not found');
    }
});

// Add notes API endpoints
app.post('/api/notes', isAuthenticated, async (req, res) => {
    try {
        const { note, timestamp, videoId, courseName, moduleName } = req.body;
        const userId = req.session.user.id;

        await pool.execute(
            `INSERT INTO video_notes 
            (user_id, course_name, module_name, video_name, note_text, timestamp) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, courseName, moduleName, videoId, note, timestamp]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving note:', error);
        res.status(500).json({ error: 'Failed to save note' });
    }
});

app.get('/api/notes/:videoId', isAuthenticated, async (req, res) => {
    try {
        const [notes] = await pool.execute(
            `SELECT * FROM video_notes 
            WHERE user_id = ? AND video_name = ? 
            ORDER BY timestamp ASC`,
            [req.session.user.id, req.params.videoId]
        );
        res.json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});