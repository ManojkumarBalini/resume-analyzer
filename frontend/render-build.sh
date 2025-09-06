#!/bin/bash
# Script for building React app on Render
echo "Installing dependencies..."
npm install --legacy-peer-deps

echo "Building application..."
npm run build

echo "Build completed!"
