import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

let currentStatus = 'online';

app.get('/status', (req, res) => {
  res.json({ status: currentStatus });
});

app.post('/set/online', (req, res) => {
  currentStatus = 'online';
  res.json({ status: currentStatus });
});

app.post('/set/offline', (req, res) => {
  currentStatus = 'offline';
  res.json({ status: currentStatus });
});

app.listen(PORT, () => {
  console.log(`Status server running on port ${PORT}`);
});
