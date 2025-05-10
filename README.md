# Assignment Submission System

A web-based platform for managing course assignments and submissions built with Node.js, Express, and MongoDB.

## Features

- User Authentication
- Course Management
- Assignment Creation and Management
- Student Submission Handling
- User Management

## Tech Stack

- Backend: Node.js with Express.js
- Database: MongoDB
- Authentication: JWT (JSON Web Tokens)
- Cookie Parser for session management

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## Project Structure

```
src/
├── middleware/
├── models/
├── routes/
│   ├── auth.routes.js
│   ├── course.routes.js
│   ├── assignment.routes.js
│   ├── submission.routes.js
│   └── user.routes.js
├── public/
│   ├── html/
│   └── ...
└── server.js
```

## API Endpoints

### Authentication

- POST `/api/auth/login` - User login
- POST `/api/auth/register` - User registration

### Courses

- GET `/api/courses` - Get all courses
- POST `/api/courses` - Create new course

### Assignments

- GET `/api/assignments` - Get all assignments
- POST `/api/assignments` - Create new assignment

### Submissions

- GET `/api/submissions` - Get all submissions
- POST `/api/submissions` - Create new submission

### Users

- GET `/api/users` - Get users
- PUT `/api/users` - Update user

## Running the Application

```bash
npm start
```

The server will start on http://localhost:5000

## Error Handling

The application includes centralized error handling middleware for consistent error responses across the API.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT License
