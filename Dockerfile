# Dockerfile for the Node.js API
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies (express, pg, axios)
COPY package*.json ./
RUN npm install

# Copy application source code (api.js, etc.)
COPY . .

# Expose the port the Express server listens on
EXPOSE 3001

# Command to run the application (assuming you have a server.js file that runs api.js)
# If api.js is your entry point, change this to: CMD [ "node", "api.js" ]
CMD [ "node", "server.js" ]