#!/bin/bash
# Clear npm cache and reinstall dependencies
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Build the project
npm run build
