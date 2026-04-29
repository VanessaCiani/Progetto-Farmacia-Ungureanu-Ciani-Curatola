const express = require('express'); 
const fs = require('fs');           
const path = require('path');      
const app = express();
const PORT = 3000;

const DB_PATH = path.join(__dirname, 'spese.json');

app.use(express.json());             
app.use(express.static(__dirname));  

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/spese', (req, res) => {
    const datiRaw = fs.readFileSync(DB_PATH, 'utf8'); 
    const spese = JSON.parse(datiRaw);               
    res.json(spese);                              
});

app.post('/api/spese', (req, res) => {
    const spese = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); 
    const nuovaSpesa = {
        id: Date.now(), // ID univoco necessario per identificare la spesa da eliminare
        data: req.body.data,
        descrizione: req.body.descrizione,
        categoria: req.body.categoria,
        importo: parseFloat(req.body.importo),
        rimborsabile: req.body.rimborsabile
    };

    spese.push(nuovaSpesa); 
    fs.writeFileSync(DB_PATH, JSON.stringify(spese, null, 2));
    res.status(201).json(nuovaSpesa);
});

// NUOVA ROTTA PER L'ELIMINAZIONE
app.delete('/api/spese/:id', (req, res) => {
    const idDaEliminare = parseInt(req.params.id);
    let spese = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    
    // Crea un nuovo array escludendo l'elemento con l'ID fornito
    const nuoveSpese = spese.filter(s => s.id !== idDaEliminare);
    
    fs.writeFileSync(DB_PATH, JSON.stringify(nuoveSpese, null, 2));
    res.json({ messaggio: "Spesa eliminata correttamente" });
});

app.listen(PORT, () => {
    console.log(`Server attivo su http://localhost:${PORT}`);
});
