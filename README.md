# Complaints Backend API

A Node.js and Express backend for managing complaints, built with TypeScript and Prisma.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Testing suite:** jest && supertest
- **Authentication:** JWT (JSON Web Tokens)

## Option 1: Docker (Recommended)

The easiest way to get the application running is with Docker and Docker Compose.

## Prerequisites

- [Docker](https://www.docker.com/get-started/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd complaints_backend
```

### 2. Set Up Environment Variables

Create a `.env` file in the root of the project and add the following variables. You can use the provided example as a template.

```bash
# .env

JWT_ACCESS_SECRET="your-super-secret-access-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
ACCESS_EXPIRES="15m"
REFRESH_EXPIRES_DAYS=7
COOKIE_DOMAIN=localhost
PORT=5000
FRONTEND_ORIGIN="http://localhost:3000"
```

### 3. Run the Application

The easiest way to manage the application is with the provided helper scripts.

**For Linux/macOS (Bash):**
Make the script Executable: Open your terminal and run this command to give the script permission to execute:

```bash
chmod +x docker-manager.sh
```

Run the Script: Use the ./ prefix to run it from your terminal.
bash

```bash
./docker-manager.sh start
./docker-manager.sh test
./docker-manager.sh help
```

then:

```bash
# Build the images and start the containers
./docker-manager.sh build

# Or, if images are already built, just start them
./docker-manager.sh start
```

**For Windows (PowerShell):**

Set Execution Policy (if needed): If you've never run PowerShell scripts before, you may need to allow it. Open PowerShell as an Administrator and run:
powershell

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Answer "Yes" when prompted. You only need to do this once. then:

```powershell
# Build the images and start the containers
.\docker-manager.ps1 build

# Or, if images are already built, just start them
.\docker-manager.ps1 start
```

**Alternatively, you can use Docker Compose directly:**

```bash
# Build and start the containers
docker-compose up --build -d

# To stop the containers
docker-compose down
```

The API will be available at `http://localhost:5000`.

## Running Tests

To run the test suite, use the helper script:

**For Linux/macOS:**

```bash
./docker-manager.sh test
```

**For Windows:**

```powershell
.\docker-manager.ps1 test
```

## Option 2: Local Development

If you prefer to run the application directly on your machine without Docker.

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later)
- A local instance of [PostgreSQL](https://www.postgresql.org/download/)

### Getting Started

**Install Dependencies**

```bash
npm install
```

**Set Up Environment Variables**

Create a `.env` file in the root of the project. Make sure the `DATABASE_URL` points to your local PostgreSQL database.

```bash
# .env

DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/YOUR_DB_NAME"
JWT_ACCESS_SECRET="your-super-secret-access-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
ACCESS_EXPIRES="15m"
REFRESH_EXPIRES_DAYS=7
COOKIE_DOMAIN=localhost
PORT=5000
FRONTEND_ORIGIN="http://localhost:3000"
```

**Set Up the Database**

These commands will generate the Prisma Client (a type-safe database query builder) and run the database migrations to create your tables.

```bash
# Generate the Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev
```

**Seed the Database**

This command will run the `seed.ts` script to create an initial admin user in your database.

```bash
npm run seed:admin
```

**Run the Development Server**

```bash
npm run dev
```

The API will be available at `http://localhost:5000`.

**testing**

```bash
npm run test
```

## API Documentation

You can explore and test the API endpoints using the `api_test.http` file with the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension in Visual Studio Code.

## License

This project is licensed under the [GPL License](LICENSE).
