# Video Course Platform

A modern video course platform built with Node.js, Express, and MySQL, featuring video progress tracking, notes system, and subtitle support.

## Features

- 🎥 Video Progress Tracking
  - Automatic progress saving
  - Resume from last position
  - Course completion tracking

- 📝 Notes System
  - Take notes with timestamps
  - Jump to specific video positions from notes
  - Real-time note saving

- 🎯 Course Organization
  - Module-based course structure
  - Progress indicators
  - Continue watching section

- 🔤 Video Features
  - Subtitle support
  - Adjustable subtitle size
  - Video quality selection

- 🎨 User Interface
  - Dark/Light theme toggle
  - Mobile responsive design
  - Clean and intuitive navigation

## Tech Stack

- Backend: Node.js, Express
- Database: MySQL
- View Engine: EJS
- Authentication: Express-session, bcryptjs

## Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- Web Browser with HTML5 video support

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Kalasoftware/course-website.git


### Project Structure 

```sh 

course/
├── config/
│   └── database.js
├── public/
│   ├── css/
│   └── js/
├── routes/
│   └── auth.js
├── views/
│   ├── course.ejs
│   ├── index.ejs
│   ├── landing.ejs
│   └── video.ejs
├── middleware/
│   └── auth.js
├── server.js
└── package.json

```

### More things to know 

## Database Schema
- users: User authentication and profile data
- video_progress: Track video watching progress
- video_notes: Store timestamped notes for videos
## Usage
1. Register/Login to access courses
2. Select a course to view available modules
3. Click on a video to start watching
4. Progress is automatically saved while watching
5. Add notes with timestamps while watching
6. Toggle subtitles and adjust their size as needed
## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

# Thanks For Reading , You Can Support Me By Donating!

## Author
- Sumeet Patel
