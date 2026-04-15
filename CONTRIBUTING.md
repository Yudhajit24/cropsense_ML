# Contributing to CropSense

Thank you for considering contributing to CropSense! This document outlines the development guidelines, branching strategy, and submission process.

---

## 🛠️ Development Setup

### Prerequisites
- **Python** 3.11+
- **Node.js** 20+
- **npm** 10+

### Backend
```bash
cd cropsense/backend
python -m venv venv
source venv/bin/activate    # macOS/Linux
pip install -r requirements.txt
python models/train.py       # train ML models
uvicorn main:app --reload
```

### Frontend
```bash
cd cropsense/frontend
npm install
npm run dev
```

---

## 📐 Code Style

### Python (Backend)
- Follow **PEP 8** conventions
- Use **type hints** for all function signatures
- Use the `logger` module (not `print()`) for logging
- Add **docstrings** to all public functions

### TypeScript (Frontend)
- Use **functional components** with hooks
- Export named components (not default exports for components)
- Follow the existing Tailwind CSS utility patterns
- Run `npm run lint` before committing

---

## 🌿 Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code |
| `feat/<name>` | New features |
| `fix/<name>` | Bug fixes |
| `chore/<name>` | Maintenance tasks |
| `docs/<name>` | Documentation updates |

---

## 📝 Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only
- **refactor**: Code restructuring (no behaviour change)
- **test**: Adding or updating tests
- **chore**: Build, CI, or tooling changes
- **perf**: Performance improvement

### Scopes
- `api` — Backend API / FastAPI
- `ml` — ML pipeline / training
- `ui` — Frontend components
- `a11y` — Accessibility

### Examples
```
feat(api): add /metrics endpoint with model metadata
fix(ui): add responsive breakpoints for mobile layouts
test(api): add unit tests for prediction validation
ci: add GitHub Actions workflow for backend tests
```

---

## 🔁 Pull Request Process

1. Fork the repository and create your branch from `main`
2. Make your changes with clear, atomic commits
3. Ensure `npm run lint` and `pytest` pass locally
4. Update documentation if needed
5. Submit a PR with a descriptive title and summary

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
