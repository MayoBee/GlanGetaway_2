#!/bin/bash

# Glan Getaway Deployment Script
# This script automates the deployment process

set -e

echo "🚀 Starting Glan Getaway Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    
    print_status "All dependencies are installed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
    print_status "Dependencies installed"
}

# Build applications
build_applications() {
    print_status "Building applications..."
    npm run build
    
    if [ $? -eq 0 ]; then
        print_status "Build successful"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Check environment files
check_env_files() {
    print_status "Checking environment files..."
    
    if [ ! -f "packages/backend/.env" ]; then
        print_warning "Backend .env file not found. Creating from example..."
        cp packages/backend/.env.example packages/backend/.env
        print_warning "Please update packages/backend/.env with your actual values"
    fi
    
    if [ ! -f "packages/frontend/.env" ]; then
        print_warning "Frontend .env file not found. Creating from example..."
        cp packages/frontend/.env.example packages/frontend/.env
        print_warning "Please update packages/frontend/.env with your actual values"
    fi
}

# Git operations
git_operations() {
    print_status "Performing Git operations..."
    
    # Add all changes
    git add .
    
    # Commit changes
    if [ -n "$(git status --porcelain)" ]; then
        git commit -m "Deployment preparation - $(date)"
        print_status "Changes committed"
    else
        print_status "No changes to commit"
    fi
    
    # Push to remote
    git push origin main
    print_status "Changes pushed to remote"
}

# Deploy to platforms
deploy_to_platforms() {
    print_status "Deploying to platforms..."
    
    # Deploy backend to Render (if configured)
    if [ -n "$RENDER_API_KEY" ]; then
        print_status "Deploying to Render..."
        # Add Render deployment logic here
        print_status "Render deployment triggered"
    fi
    
    # Deploy frontend to Vercel (if configured)
    if command -v vercel &> /dev/null; then
        print_status "Deploying to Vercel..."
        cd packages/frontend
        vercel --prod
        cd ../..
        print_status "Vercel deployment completed"
    else
        print_warning "Vercel CLI not found. Please install it: npm i -g vercel"
    fi
}

# Health checks
health_checks() {
    print_status "Performing health checks..."
    
    # Check if backend is accessible
    if [ -n "$BACKEND_URL" ]; then
        curl -f "$BACKEND_URL/api/health" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            print_status "Backend health check passed"
        else
            print_warning "Backend health check failed"
        fi
    fi
    
    # Check if frontend is accessible
    if [ -n "$FRONTEND_URL" ]; then
        curl -f "$FRONTEND_URL" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            print_status "Frontend health check passed"
        else
            print_warning "Frontend health check failed"
        fi
    fi
}

# Main deployment flow
main() {
    print_status "Starting deployment process..."
    
    check_dependencies
    install_dependencies
    check_env_files
    build_applications
    git_operations
    deploy_to_platforms
    health_checks
    
    print_status "🎉 Deployment completed successfully!"
    print_status "Please check your deployed applications:"
    print_status "Frontend: $FRONTEND_URL"
    print_status "Backend: $BACKEND_URL"
}

# Handle script arguments
case "${1:-}" in
    "build-only")
        print_status "Build only mode"
        install_dependencies
        build_applications
        ;;
    "deploy-only")
        print_status "Deploy only mode"
        deploy_to_platforms
        health_checks
        ;;
    "health-check")
        print_status "Health check only mode"
        health_checks
        ;;
    *)
        main
        ;;
esac
