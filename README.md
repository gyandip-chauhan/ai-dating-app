# AI-Powered Dating Application

A modern dating platform that leverages artificial intelligence to enhance matchmaking, provide communication insights, and offer personalized compatibility analysis.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
  - [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Overview
This application revolutionizes online dating by integrating AI-driven insights for better matchmaking and user interaction. It combines personality trait analysis, real-time communication, and emotional pattern recognition to create meaningful connections.

## Features

### Core Functionality
- **AI-Powered Matching**: Utilizes advanced algorithms to match users based on personality traits and preferences.
- **Real-time Chat**: WebSocket-based messaging with AI-driven moderation and contextual suggestions.
- **Voice Analysis**: Analyzes voice recordings to provide insights into communication styles.
- **Journaling System**: Tracks moods and recognizes emotional patterns to enhance user self-awareness.
- **Smart Notifications**: Sends personalized alerts and match suggestions based on user activity.

### AI Capabilities
- Personality trait analysis derived from text and voice inputs.
- Communication style recommendations to improve user interactions.
- Real-time chat moderation with AI-driven suggestions.
- Compatibility scoring to evaluate potential matches.
- Emotional pattern recognition through journal entries.

## Tech Stack

### Frontend
- **React** with TypeScript for a robust, type-safe UI.
- **Axios** for seamless API communication.
- **React Router** for client-side navigation.
- **WebSocket** for real-time chat functionality.
- **CSS3** with custom styling for a modern, responsive design.

### Backend
- **FastAPI** (Python) for high-performance REST API.
- **WebSocket** for real-time bidirectional communication.
- **SQLAlchemy** with **PostgreSQL** for relational database management.
- **JWT** for secure user authentication.
- **OpenAI API** for advanced AI analysis.
- **Hive API** for content moderation.

### Services
- **AWS S3** for secure file storage.
- **Docker** for containerized deployment.
- **Redis** (optional) for efficient session management.

## Installation

### Prerequisites
Ensure the following are installed:
- **Node.js** (v16 or higher)
- **Python** (3.9 or higher)
- **PostgreSQL** database
- **Redis** (optional, for session storage)
- **Docker** (optional, for containerized setup)

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file and configure it:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to include your API URL (e.g., `REACT_APP_API_URL=http://localhost:8000/api`).
4. Start the development server:
   ```bash
   npm start
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the example environment file and configure it:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database URL, API keys, and AWS credentials.
5. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Environment Variables
Configure the following environment variables in the respective `.env` files.

#### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:8000/api
```

#### Backend (.env)
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/ai_dating_app
OPENAI_API_KEY=your_openai_api_key
HIVE_API_KEY=your_hive_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your_s3_bucket_name
SECRET_KEY=your_jwt_secret
```

## Usage
1. Start the backend server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
2. Start the frontend development server:
   ```bash
   npm start
   ```
3. Open your browser to `http://localhost:3000` to access the application.
4. Register or log in to explore features like AI-powered matching, real-time chat, and journaling.

## Contributing
We welcome contributions! To contribute:
1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature/YourFeature
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add YourFeature"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/YourFeature
   ```
5. Open a pull request with a detailed description of your changes.

Please ensure your code follows the project's coding standards and includes relevant tests.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact
For questions or feedback, reach out via:
- **Email**: support@ai-dating-app.com
- **GitHub Issues**: [Project Issues](https://github.com/gyandip-chauhan/ai-dating-app/issues)