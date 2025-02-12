# Project Setup Guide

Visit the live web application here: [Asset Management System](https://assetmanager-one.vercel.app/index.html)

---

## Prerequisites
Make sure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (v12 or higher recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (Ensure MongoDB is running locally or use a cloud MongoDB service like MongoDB Atlas)

## Installation Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/sammyZi/Asset-Management.git
cd Asset-Management
```

### 2. Install Dependencies

### Required Packages

The following dependencies will be installed:

- **express:** Web framework for Node.js
- **body-parser:** Middleware to parse incoming request bodies
- **mongoose:** MongoDB object modeling tool
- **morgan:** HTTP request logger middleware

To install these individually, use the following commands:

```bash
npm install express
npm install body-parser
npm install mongoose
npm install morgan
```

### 3. Start the Server
```bash
node server.js
```

If your main file is named differently (e.g., `app.js`), use:
```bash
node app.js
```

### 4. Verify the Application
- Open your browser and navigate to [http://localhost:8000](http://localhost:8000).
- Ensure MongoDB is running if you're using a local MongoDB setup.

## Project Structure
```plaintext
.
├── server.js (or app.js)
├── package.json
├── README.md
└── node_modules/
```

## Troubleshooting

- **Port Issues:** If port 8000 is already in use, change the port in the code.
- **MongoDB Connection:** Verify MongoDB service is running by using the command:
  ```bash
  mongod
  ```
- **Dependency Errors:** Ensure all packages are installed using `npm install`.

## Additional Commands

### Development Mode
Install `nodemon` for automatic server restarts during development:
```bash
npm install --save-dev nodemon
```
Start the server using:
```bash
node server.js
```
## Features of the Application
This application is an Asset Management System that allows users to manage asset records efficiently. Below are the key features of the application:

- **MongoDB Database Integration:**
  - Stores asset information, including name, type, department, quantity, and value.
- **Asset Management:**
  - Ability to add new assets, view all existing assets, and delete assets when necessary.
- **Dashboard Interface:**
  - Static dashboard file served for user interaction.
- **Error Handling:**
  - Proper error handling for database operations and request validation.
- **Middleware:**
  - Parses JSON request bodies and serves static files.
- **Explicit MongoDB Collection Name:**
  - Assets are stored in the `assets` collection explicitly defined in the schema.



