# Contributing to YOLO Trainer Platform

Thank you for your interest in contributing to the YOLO Trainer Platform! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, etc.)

### Suggesting Features

1. Check if the feature has been suggested
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach

### Contributing Code

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Write/update tests
5. Update documentation
6. Commit with clear messages
7. Push to your fork
8. Create a Pull Request

## Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional but recommended)

### Setup Steps

1. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/yolo-trainer.git
cd yolo-trainer
```

2. Set up backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

3. Set up frontend:
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

4. Start services:
```bash
# Option 1: Using Docker
docker-compose up -d postgres redis

# Option 2: Manual
# Start PostgreSQL and Redis manually
```

5. Run the application:
```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Code Style

### Python (Backend)

- Follow PEP 8
- Use Black for formatting
- Use isort for import sorting
- Type hints are required
- Maximum line length: 100 characters

```bash
# Format code
black app/
isort app/

# Check style
flake8 app/
mypy app/
```

### TypeScript/React (Frontend)

- Follow ESLint configuration
- Use Prettier for formatting
- Use meaningful component names
- Type everything (no `any` types)
- Use functional components with hooks

```bash
# Format code
npm run lint
npm run format

# Type check
npm run type-check
```

## Testing

### Backend Tests

```bash
cd backend
pytest

# With coverage
pytest --cov=app tests/

# Specific test
pytest tests/test_auth.py
```

### Frontend Tests

```bash
cd frontend
npm test

# With coverage
npm test -- --coverage

# E2E tests
npm run test:e2e
```

## Commit Messages

Use clear, descriptive commit messages:

```
feat: Add user profile page
fix: Resolve dataset upload bug
docs: Update API documentation
test: Add tests for training service
refactor: Simplify authentication logic
style: Format code with Black
chore: Update dependencies
```

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Commit messages are clear

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Project Structure

```
yolo-trainer/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/      # API endpoints
│   │   ├── core/     # Core functionality
│   │   ├── db/       # Database
│   │   ├── models/   # Database models
│   │   ├── schemas/  # Pydantic schemas
│   │   └── services/ # Business logic
│   └── tests/        # Backend tests
├── frontend/         # Next.js frontend
│   ├── src/
│   │   ├── app/      # Pages
│   │   ├── components/ # React components
│   │   ├── lib/      # Utilities
│   │   └── types/    # TypeScript types
│   └── tests/        # Frontend tests
└── docs/            # Documentation
```

## Adding New Features

### Backend API Endpoint

1. Create endpoint in `backend/app/api/`
2. Add database model if needed in `backend/app/models/`
3. Add Pydantic schema in `backend/app/schemas/`
4. Add business logic in `backend/app/services/`
5. Update main.py to include router
6. Add tests in `backend/tests/`
7. Update API documentation

### Frontend Component

1. Create component in `frontend/src/components/`
2. Add types in `frontend/src/types/`
3. Add API calls in `frontend/src/lib/api.ts`
4. Create page in `frontend/src/app/`
5. Add tests in `frontend/tests/`
6. Update navigation if needed

## Database Migrations

When changing database models:

```bash
cd backend

# Create migration
alembic revision --autogenerate -m "Description"

# Review the migration file
# Edit if needed

# Apply migration
alembic upgrade head

# Rollback if needed
alembic downgrade -1
```

## Documentation

Update documentation when:
- Adding new features
- Changing APIs
- Modifying setup process
- Fixing important bugs

Documentation files:
- `README.md` - Overview and setup
- `ARCHITECTURE.md` - System design
- `QUICKSTART.md` - Quick start guide
- `IMPLEMENTATION_PLAN.md` - Development roadmap
- Code comments for complex logic

## Release Process

1. Update version numbers
2. Update CHANGELOG.md
3. Create release branch
4. Test thoroughly
5. Create GitHub release
6. Deploy to production

## Getting Help

- Check existing documentation
- Look at similar code in the project
- Ask in GitHub discussions
- Open an issue for clarification

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- README.md contributors section
- GitHub contributors page
- Release notes

## Questions?

Feel free to open an issue or discussion if you have questions about contributing!

Thank you for contributing to YOLO Trainer Platform! 🎉
