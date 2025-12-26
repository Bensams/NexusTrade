# GitHub Setup Guide

This guide will help you push your NexusTrade project to GitHub.

## Initial GitHub Repository Setup

### 1. Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name your repository (e.g., `NexusTrade`)
5. Choose visibility (Private or Public)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

### 2. Initialize Git (if not already done)

```bash
# Navigate to your project directory
cd D:\Projects\NexusTrade

# Initialize git repository (if not already initialized)
git init

# Check current status
git status
```

### 3. Stage and Commit Files

```bash
# Add all files
git add .

# Check what will be committed
git status

# Commit files
git commit -m "Initial commit: NexusTrade marketplace application"
```

### 4. Connect to GitHub and Push

```bash
# Add your GitHub repository as remote origin
# Replace <your-username> and <your-repo-name> with your actual values
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# Verify remote was added
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

## Important Files to Review Before Pushing

### ✅ Files Already Configured

- `.gitignore` - Excludes sensitive files, node_modules, uploads, etc.
- `.dockerignore` - Excludes unnecessary files from Docker builds
- `README.md` - Project documentation
- `.env.example` - Template for environment variables (safe to commit)

### ⚠️ Files NOT Committed (by .gitignore)

- `.env` - Your actual environment variables (NEVER commit this!)
- `.env*.local` - Local environment overrides
- `node_modules/` - Dependencies (will be installed via npm)
- `/public/uploads/*` - User uploaded files (excluded, but .gitkeep files are included)
- `.next/` - Next.js build output

### 🔒 Security Checklist

Before pushing, ensure:

- [ ] `.env` file is NOT in git (check with `git status`)
- [ ] No API keys or secrets are hardcoded in source files
- [ ] Database passwords in `docker-compose.yml` are changed for production
- [ ] `.env.example` contains placeholder values only

## After Pushing to GitHub

### For Collaborators

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```

2. Copy environment template:
   ```bash
   cp .env.example .env
   ```

3. Fill in `.env` with actual values

4. Install dependencies and run:
   ```bash
   npm install
   # or with Docker
   docker-compose up -d --build
   ```

## Common Git Commands

```bash
# Check status
git status

# Add specific files
git add <filename>

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push

# Pull latest changes
git pull

# Create a new branch
git checkout -b feature/your-feature-name

# Switch branches
git checkout main

# View commit history
git log

# View remote repositories
git remote -v
```

## Troubleshooting

### Issue: "remote origin already exists"
```bash
# Remove existing remote
git remote remove origin

# Add new remote
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
```

### Issue: Large files or node_modules being committed
```bash
# Check .gitignore is working
git check-ignore -v node_modules/

# If files are already tracked, remove them
git rm -r --cached node_modules/
git commit -m "Remove node_modules from git"
```

### Issue: Authentication failed
- Use GitHub Personal Access Token instead of password
- Or set up SSH keys for GitHub

## Next Steps

After successfully pushing to GitHub:

1. Set up GitHub Actions for CI/CD (optional)
2. Configure branch protection rules (recommended for main branch)
3. Add collaborators if working in a team
4. Consider setting up GitHub Secrets for deployment
5. Create issues for future features and bugs

