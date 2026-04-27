const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'database.json');

// Middleware per leggere i dati JSON
app.use(express.json());

// Inizializza il file JSON se non esiste
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// Rotta per servire l'HTML principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// GET: Invia la lista delle spese salvate
app.get('/api/spese', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DB_FILE));
    res.json(data);
});

// POST: Riceve una nuova spesa e la salva
app.post('/api/spese', (req, res) => {
    const spese = JSON.parse(fs.readFileSync(DB_FILE));
    const nuovaSpesa = req.body;
    
    spese.push(nuovaSpesa);
    
    fs.writeFileSync(DB_FILE, JSON.stringify(spese, null, 2));
    res.status(201).json({ status: "Successo", spesa: nuovaSpesa });
});

app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`💊 SERVER FARMACIA ATTIVO!`);
    console.log(`🔗 Vai su: http://localhost:${PORT}`);
    console.log(`-------------------------------------------`);
});