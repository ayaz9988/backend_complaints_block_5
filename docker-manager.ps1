<#
.SYNOPSIS
    A script to manage Docker Compose commands for the project.

.DESCRIPTION
    This script provides simple commands to start, stop, build, and test the application
    using Docker Compose.

.PARAMETER Command
    The action to perform. Valid values are: start, stop, build, test, help.

.EXAMPLE
    .\docker-manager.ps1 start
    Starts the application containers.

.EXAMPLE
    .\docker-manager.ps1 test
    Runs the project's test suite.
#>
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop", "build", "test", "help")]
    [string]$Command
)

# Function to display help information
function Show-Help {
    Write-Host "Usage: .\docker-manager.ps1 [COMMAND]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  start   Starts the Docker containers in detached mode."
    Write-Host "  stop    Stops and removes the Docker containers."
    Write-Host "  build   Rebuilds the images and starts the containers in detached mode."
    Write-Host "  test    Runs the test suite in a one-off container."
    Write-Host "  help    Shows this help message."
}

# Use a switch statement to handle the command
switch ($Command) {
    "start" {
        Write-Host "🚀 Starting Docker containers..." -ForegroundColor Green
        docker-compose up -d
    }
    "stop" {
        Write-Host "🛑 Stopping Docker containers..." -ForegroundColor Yellow
        docker-compose down
    }
    "build" {
        Write-Host "🔨 Rebuilding images and starting containers..." -ForegroundColor Magenta
        docker-compose up --build -d
    }
    "test" {
        Write-Host "🧪 Running tests..." -ForegroundColor Cyan
        docker-compose run --rm app pnpm run test
    }
    "help" {
        Show-Help
    }
}