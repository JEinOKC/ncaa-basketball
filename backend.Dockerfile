# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend code
COPY backend ./

# Build TypeScript
RUN npx tsc

# Expose the backend port
EXPOSE 3099

# Run the backend
CMD ["npm", "run", "dev"]
