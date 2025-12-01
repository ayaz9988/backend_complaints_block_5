# Use an official Node.js runtime as a parent image.
# Using alpine for a smaller image size.
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and pnpm-lock.yaml to leverage Docker cache
COPY package.json ./

# Install app dependencies using pnpm
RUN npm install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Your app binds to port 5000, so you'll use this port mapping
EXPOSE 5000

# Define the command to run your app.
# We will override this in docker-compose to run migrations first.
# But it's good practice to have a default CMD here.
CMD [ "node", "dist/index.js" ]