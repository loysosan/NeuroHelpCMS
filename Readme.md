# My Little Go CMS

A content management system built with Go backend and React frontend, containerized with Docker.

## Project Structure

```
my-little-go-cms/
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context providers
│   │   ├── routes/       # Routing configuration
│   │   └── utils/        # Utility functions
│   ├── Dockerfile        # Frontend Docker configuration
│   └── package.json
│
├── internal/              # Go backend application
│   ├── db/               # Database configuration
│   ├── handlers/         # HTTP request handlers
│   ├── middleware/       # HTTP middleware
│   ├── models/          # Data models
│   └── utils/           # Utility functions
│
├── Dockerfile           # Backend Docker configuration
└── docker-compose.yml   # Docker compose configuration
```

## Prerequisites

- Docker and Docker Compose
- Git

## Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/my-little-go-cms.git
cd my-little-go-cms
```

2. Create and configure environment files:

For backend (`.env`):
```env
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=cms_db
JWT_SECRET=your_secret_key
```

For frontend (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:8080
```

3. Build and start the containers:
```bash
docker-compose up --build
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Swagger Documentation: http://localhost:8080/swagger/index.html

## Docker Commands

Build and start containers:
```bash
docker-compose up --build    # Build and start all services
docker-compose up -d         # Run in detached mode
```

Stop containers:
```bash
docker-compose down          # Stop all services
```

View logs:
```bash
docker-compose logs -f       # Follow logs from all services
docker-compose logs frontend # View frontend logs
docker-compose logs go-api   # View backend logs
```

Restart specific service:
```bash
docker-compose restart frontend   # Restart frontend
docker-compose restart go-api     # Restart backend
```

## API Documentation

The API documentation is available through Swagger UI at http://localhost:8080/swagger/index.html when running locally.

Main API endpoints:

### Authentication
- POST /api/login - User login
- POST /api/register - User registration
- GET /api/verify - Email verification

### Admin Operations
- GET /api/admin/users - List all users
- PUT /api/admin/users/{id} - Update user
- POST /api/admin/users - Create user
- GET /api/admin/skills - List skills
- POST /api/admin/skills - Create skill

## Development Workflow

1. Make changes to the code
2. Rebuild and restart the containers:
```bash
docker-compose down
docker-compose up --build
```

### Frontend Development

The frontend is built with:
- React
- TypeScript
- Tailwind CSS
- React Router
- Context API for state management

### Backend Development

The backend is built with:
- Go
- Chi router
- GORM
- JWT for authentication
- PostgreSQL

## Troubleshooting

If you encounter issues:

1. Check container status:
```bash
docker-compose ps
```

2. View container logs:
```bash
docker-compose logs -f
```

3. Rebuild containers:
```bash
docker-compose down
docker-compose up --build
```

## License

MIT