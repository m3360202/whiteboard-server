# Use Node.js 14 as the base image
FROM node:14 as build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the source code
COPY . .

# Build the Meteor app
# RUN npm install -g meteor
RUN curl https://install.meteor.com/ | sh
RUN meteor build --directory . --allow-superuser


# Start a new stage to create the runnable image
FROM node:14-slim

# Copy over the results from the build stage
COPY --from=build /app/bundle /app/bundle

# Expose the required port
EXPOSE 3000

# Set the working directory
WORKDIR /app/bundle

# Install the production Node.js dependencies
RUN cd programs/server && npm install

# Run the app
CMD ["node", "main.js"]

 
