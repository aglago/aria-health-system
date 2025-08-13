# ARIA AI Service - Environment Setup

This guide provides comprehensive instructions for setting up the development environment for the ARIA AI service using pyenv and virtual environments.

## Prerequisites

- macOS or Linux system
- pyenv installed and configured
- Git (for cloning repositories)
- Basic terminal/command line knowledge

## System Requirements

- Python 3.9 or higher
- 4GB+ RAM (for ML model processing)
- 2GB+ available disk space

## Environment Setup

### 1. Verify Pyenv Installation

```bash
# Check if pyenv is installed
pyenv --version

# List available Python versions
pyenv versions

# Check if Python 3.9+ is available
pyenv versions | grep 3.9
```

If Python 3.9+ is not installed:
```bash
# Install Python 3.9.18 (recommended)
pyenv install 3.9.18

# Or install latest 3.9.x
pyenv install $(pyenv install --list | grep -E "^\s*3\.9\.[0-9]+$" | tail -1 | xargs)
```

### 2. Project Directory Setup

```bash
# Navigate to your ARIA project root
cd /path/to/your/aria-health-system

# Navigate to AI service directory
cd services/ai-service

# Verify you're in the correct directory
pwd
ls -la  # Should see src/, requirements.txt, README.md
```

### 3. Python Version Configuration

```bash
# Set local Python version for this project
pyenv local 3.9.18

# Verify Python version is set correctly
python --version  # Should show Python 3.9.18
which python      # Should show pyenv path

# Create .python-version file (optional, for team consistency)
echo "3.9.18" > .python-version
```

### 4. Virtual Environment Creation

```bash
# Create virtual environment
python -m venv aria-env

# Verify virtual environment was created
ls -la aria-env/  # Should see bin/, lib/, pyvenv.cfg

# Activate virtual environment
source aria-env/bin/activate

# Verify activation (prompt should show (aria-env))
echo $VIRTUAL_ENV  # Should show path to aria-env
which python       # Should show aria-env/bin/python
which pip          # Should show aria-env/bin/pip
```

### 5. Python Package Installation

```bash
# Ensure virtual environment is activated
source aria-env/bin/activate

# Upgrade pip to latest version
pip install --upgrade pip

# Install project dependencies
pip install -r requirements.txt

# Verify critical packages are installed
python -c "import fastapi; print(f'FastAPI: {fastapi.__version__}')"
python -c "import sklearn; print(f'Scikit-learn: {sklearn.__version__}')"
python -c "import uvicorn; print('Uvicorn: OK')"
```

### 6. Environment Configuration

```bash
# Create environment configuration file
cp .env.example .env  # If .env.example exists

# Or create .env manually
cat > .env << EOF
AI_SERVICE_HOST=0.0.0.0
AI_SERVICE_PORT=8000
ENVIRONMENT=development
LOG_LEVEL=INFO
OPENAI_API_KEY=your_openai_key_here
EOF

# Set appropriate permissions
chmod 600 .env
```

### 7. Verify Installation

```bash
# Activate environment
source aria-env/bin/activate

# Run quick verification
python -c "
import sys
print(f'Python version: {sys.version}')
print(f'Python executable: {sys.executable}')

try:
    from src.models.ml_medical_ai import ml_medical_ai
    print('✅ ML Medical AI imported successfully')
except ImportError as e:
    print(f'❌ Import error: {e}')

try:
    from src.services.rag_service import rag_service
    print('✅ RAG Service imported successfully')
except ImportError as e:
    print(f'❌ Import error: {e}')

print('Environment setup verification complete!')
"
```

## Running the AI Service

### Development Mode

```bash
# Navigate to AI service directory
cd services/ai-service

# Activate virtual environment
source aria-env/bin/activate

# Run the service
python src/main.py
```

The service will start on `http://localhost:8000`

### Accessing the Service

- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Root Endpoint**: http://localhost:8000/

### Testing the Service

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test ML analysis endpoint
curl -X POST "http://localhost:8000/analyze-ml" \
     -H "Content-Type: application/json" \
     -d '{"symptoms": "fever headache nausea"}'

# Test RAG search endpoint
curl -X POST "http://localhost:8000/rag/search" \
     -H "Content-Type: application/json" \
     -d '{"query": "malaria symptoms", "top_k": 3}'
```

## Daily Development Workflow

### Starting Development Session

```bash
# Navigate to project
cd services/ai-service

# Activate virtual environment
source aria-env/bin/activate

# Verify environment is active (should see (aria-env) in prompt)
echo $VIRTUAL_ENV

# Start the service
python src/main.py
```

### Ending Development Session

```bash
# Stop the service (Ctrl+C)
# Deactivate virtual environment
deactivate

# Verify deactivation (no (aria-env) in prompt)
echo $VIRTUAL_ENV  # Should be empty
```

## Troubleshooting

### Common Issues and Solutions

#### Virtual Environment Not Activating
```bash
# Check if aria-env directory exists
ls -la aria-env/

# If missing, recreate virtual environment
rm -rf aria-env/
python -m venv aria-env
source aria-env/bin/activate
pip install -r requirements.txt
```

#### Import Errors
```bash
# Verify you're in correct directory
pwd  # Should end with services/ai-service

# Check Python path
python -c "import sys; print('\n'.join(sys.path))"

# Verify virtual environment is active
which python  # Should show aria-env path
```

#### Port Already in Use
```bash
# Check what's using port 8000
lsof -i :8000

# Kill process using port 8000
sudo lsof -ti:8000 | xargs kill -9

# Or use different port
export AI_SERVICE_PORT=8001
python src/main.py
```

#### Package Installation Issues
```bash
# Update pip
pip install --upgrade pip

# Clear pip cache
pip cache purge

# Reinstall dependencies
pip uninstall -r requirements.txt -y
pip install -r requirements.txt
```

### Environment Health Check Script

Create a health check script:

```bash
cat > check_environment.py << EOF
#!/usr/bin/env python3
import sys
import subprocess
import importlib

def check_python_version():
    version = sys.version_info
    if version.major == 3 and version.minor >= 9:
        print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print(f"❌ Python {version.major}.{version.minor}.{version.micro} (requires 3.9+)")
        return False

def check_virtual_env():
    venv = sys.prefix != sys.base_prefix
    if venv:
        print(f"✅ Virtual environment active: {sys.prefix}")
        return True
    else:
        print("❌ No virtual environment detected")
        return False

def check_packages():
    required_packages = [
        'fastapi', 'uvicorn', 'pydantic', 'sklearn', 
        'numpy', 'python_dotenv'
    ]
    
    all_good = True
    for package in required_packages:
        try:
            if package == 'python_dotenv':
                importlib.import_module('dotenv')
            else:
                importlib.import_module(package)
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} (not installed)")
            all_good = False
    
    return all_good

def check_aria_imports():
    try:
        from src.models.ml_medical_ai import ml_medical_ai
        print("✅ ARIA ML Medical AI")
        return True
    except ImportError as e:
        print(f"❌ ARIA imports failed: {e}")
        return False

if __name__ == "__main__":
    print("ARIA AI Service Environment Health Check")
    print("=" * 50)
    
    checks = [
        check_python_version(),
        check_virtual_env(),
        check_packages(),
        check_aria_imports()
    ]
    
    if all(checks):
        print("\n🎉 Environment is ready for ARIA AI Service!")
        sys.exit(0)
    else:
        print("\n⚠️  Environment setup issues detected. Please fix the above errors.")
        sys.exit(1)
EOF

# Make it executable
chmod +x check_environment.py

# Run health check
python check_environment.py
```

## Additional Configuration

### IDE Setup (VS Code)

Create `.vscode/settings.json`:
```json
{
    "python.pythonPath": "./aria-env/bin/python",
    "python.defaultInterpreterPath": "./aria-env/bin/python",
    "python.terminal.activateEnvironment": true,
    "python.linting.enabled": true,
    "python.linting.pylintEnabled": false,
    "python.linting.flake8Enabled": true,
    "files.exclude": {
        "aria-env": true,
        "__pycache__": true,
        "*.pyc": true
    }
}
```

### Git Configuration

Add to `.gitignore`:
```
# Virtual Environment
aria-env/

# Environment Variables
.env

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

## Performance Optimization

### Memory Usage
- The AI service uses ~200-500MB RAM during normal operation
- ML model loading adds ~100-200MB
- Peak usage during analysis: ~800MB

### Startup Time
- Virtual environment activation: ~1-2 seconds
- Service startup: ~3-5 seconds
- First ML analysis (model loading): ~2-3 seconds

## Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use strong, unique values for sensitive configurations
- Rotate API keys regularly

### File Permissions
```bash
# Set secure permissions on sensitive files
chmod 600 .env
chmod 755 aria-env/
```

This completes the comprehensive environment setup for the ARIA AI service using pyenv and virtual environments.