# Use the official Node.js 20 image as the base
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json to install dependencies
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose the port your app runs on
EXPOSE 9847

# Command to run the application
CMD ["npm", "start"]