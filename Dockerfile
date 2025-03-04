# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files to the container
COPY . .

# Expose port 5175 for Vite
EXPOSE 5175

# Start the Vite development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
