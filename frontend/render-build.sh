#!/bin/bash

# Exit on error
set -o errexit

echo "Installing dependencies..."
npm install

echo "Building frontend..."
npm run build

echo "Build completed successfully!"

# Print environment info for debugging
echo "Environment: $REACT_APP_ENVIRONMENT"
echo "API URL: $REACT_APP_API_URL"
