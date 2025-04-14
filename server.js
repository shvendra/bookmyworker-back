import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import app from './app.js';

// Load environment variables
dotenv.config();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load SSL certificate and private key
const options = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.crt')),
};

// Set default port if not defined
const PORT = process.env.PORT || 443;
const httpPort = 80;  // HTTP port for redirect

// Start the HTTPS server
https.createServer(options, app).listen(PORT, () => {
  console.log(`🚀 Secure server running at https://localhost:${PORT}`);
});

// Redirect HTTP to HTTPS
const httpServer = http.createServer((req, res) => {
  res.writeHead(301, { "Location": "https://" + req.headers["host"] + req.url });
  res.end();
});

httpServer.listen(httpPort, () => {
  console.log(`🚀 HTTP server running at http://localhost:${httpPort} and redirecting to HTTPS`);
});
