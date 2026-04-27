const express = require('express'); 
const fs = require('fs');           
const path = require('path');      
const app = express();
const PORT = 3000;

//Definiamo il percorso del database JSON nella cartella corrente
const DB_PATH = path.join(__dirname, 'spese.json');

app.use(express.json());             //Permette al server di leggere dati JSON inviati dal browser
app.use(express.static(__dirname));  //Rende accessibili i file CSS e immagini nella stessa cartella

// --- GESTIONE ROTTE (End-points) ---

//Carica la pagina iniziale (index.html) quando si apre http://localhost:3000
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

//ROTTA GET: Legge il file JSON e invia i dati al browser
app.get('/api/spese', (req, res) => {
    const datiRaw = fs.readFileSync(DB_PATH, 'utf8'); 
    const spese = JSON.parse(datiRaw);               
    res.json(spese);                              
});

//ROTTA POST: Riceve una nuova spesa dal browser e la salva nel file
app.post('/api/spese', (req, res) => {
    const spese = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); 
    
    //Crea l'oggetto della nuova spesa con i dati ricevuti dal form
    const nuovaSpesa = {
        id: Date.now(), //Crea un ID unico basato sull'orario attuale
        data: req.body.data,
        descrizione: req.body.descrizione,
        categoria: req.body.categoria,
        importo: parseFloat(req.body.importo),
        rimborsabile: req.body.rimborsabile
    };

    spese.push(nuovaSpesa); //Aggiunge la nuova spesa alla lista
    
    //Sovrascrive il file spese.json con la lista aggiornata
    fs.writeFileSync(DB_PATH, JSON.stringify(spese, null, 2));
    
    res.status(201).json(nuovaSpesa); //Conferma al browser che l'operazione è riuscita
});

app.listen(PORT, () => {
    console.log(`Server attivo su http://localhost:${PORT}`);
});