# Use the official Node.js image with Alpine Linux
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of the application code to the working directory
COPY . .

# Build the application
RUN yarn run build

# Expose the port the app runs on (if needed, change the port as per your application)
EXPOSE 3000

# Run the database setup and then start the application
CMD ["sh", "-c", "yarn run db && yarn start"]