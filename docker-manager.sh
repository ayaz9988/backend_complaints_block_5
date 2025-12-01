#!/bin/bash
set -euo pipefail

# A simple script to manage Docker Compose commands for the project.

# Function to display help information
show_help() {
    echo "Usage: ./docker-manager.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start   Starts the Docker containers in detached mode."
    echo "  stop    Stops and removes the Docker containers."
    echo "  build   Rebuilds the images and starts the containers in detached mode."
    echo "  test    Runs the test suite in a one-off container."
    echo "  help    Shows this help message."
}

# Check if a command was provided
if [ $# -eq 0 ]; then
    echo "Error: No command provided."
    show_help
    exit 1
fi

# Use a case statement to handle the command
case "$1" in
    start)
        echo "🚀 Starting Docker containers..."
        docker-compose up -d
        ;;
    stop)
        echo "🛑 Stopping Docker containers..."
        docker-compose down
        ;;
    build)
        echo "🔨 Rebuilding images and starting containers..."
        docker-compose up --build -d
        ;;
    test)
        echo "🧪 Running tests..."
        docker-compose run --rm app pnpm run test
        ;;
    help)
        show_help
        ;;
    *)
        echo "Error: Invalid command '$1'"
        show_help
        exit 1
        ;;
esac

exit 0