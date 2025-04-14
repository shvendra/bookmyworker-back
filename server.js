// server.js
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import app from './app.js';

// Load environment variables
dotenv.config();

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load SSL certificate and private key
const options = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.crt')),
};

// Set a default port if not defined
const PORT = process.env.PORT || 443;

// Start the HTTPS server
https.createServer(options, app).listen(PORT, () => {
  console.log(`🚀 Secure server running at https://localhost:${PORT}`);
});
