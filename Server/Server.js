const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');//serve ad inviare le email
const crypto = require('crypto'); //serve a creare la token
const cron = require('node-cron');//serve a far eseguire una funzione ogni tot
const path = require('path');
const fs = require('fs');//serve per lavorare con i filesystem, nel nostro caso lo usiamo per esempio per caricare una immagine dentro una cartella 
const sqlite3 = require('sqlite3').verbose();
// Connessione al DB
const db = new sqlite3.Database('./CinepediaDB3.db');
const bcrypt = require('bcrypt');//questo mi permette di cifrare le password prima di caricarle nel datbase così da non vederle in chiaro

const multer = require('multer');//invece che express uso multer per gestire i file
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // max 10 MB per file
//questa cosa mi permette di bypassare il problema che db.all sia asincrona e non mi permetteva di fare alcuni controlli che dovevo fare solo dopo che la query veniva eseguita completamente
const { promisify } = require('util');
const dbAll = promisify(db.all).bind(db); //così possiamo usare await
const dbRun = promisify(db.run).bind(db);// anche per db.run
const dbGet = promisify(db.get).bind(db);//anche db.get

const app = express();
const PORT = 3000;
const IP='localhost'//ip del server
const IPsito='localhost:8100' //ip sito ionic
app.use(cors()); // consenti chiamate da Angular


app.use(express.json());// Middleware per leggere JSON dal body nelle richieste post e put

app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); //serve ad esporre la cartella uploads pubblicamente, così che dal sito gli admin possano accedere alla immagini di tale cartella

//qui inserisco l'email che il server userà per l'invio
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'cinepedia.film.official@gmail.com',
    pass: 'shpamvciaothykdp' //password generata dal mio account di google
  }
});

//questa è la funzione che mi permette di inviare una email di reset password
function inviaEmailReset(destinatario, link) {
  const mailOptions = {
    from: 'Cinepedia supporto<cinepedia.film.official@gmail.com>',
    to: destinatario,
    subject: 'Recupero password Cinepedia',
    html: `
      <h3>Ripristina la tua password</h3>
      <p>Clicca sul link qui sotto per reimpostare la tua password. Il link è valido per 5 minuti!.</p>
      <a href="${link}">${link}</a>
    `
  };

  return transporter.sendMail(mailOptions);
}


//questa è la funzione che mi permette di inviare una email di registrazione
function inviaEmailRegistrazione(destinatario, link) {
  const mailOptions = {
    from: 'Cinepedia supporto<cinepedia.film.official@gmail.com>',
    to: destinatario,
    subject: 'Registrazione a Cinepedia',
    html: `
      <h3>Ciao,benvenuto su Cinepedia!</h3>
      <p>Per confermare la registrazione clicca il link qui sotto. Il link è valido per 5 minuti, oltre i quali se l'email non è stata confermata la registrazione fallisce.</p>
      <a href="${link}">${link}</a>
    `
  };

  return transporter.sendMail(mailOptions);
}

//funzione che ogni minuto verifica i token delle tabelle, se sono scaduti li resetta a null
const cleanupTokenScaduti = async () => {
  const now = Date.now();
  try {
    //questa resetta i token degli utenti confermati a cui è scaduto il token, quindi quelli che fanno il recupero credenziali
    const risultato1 = await dbRun(`UPDATE utente SET token = NULL, durata_token = NULL WHERE durata_token IS NOT NULL AND durata_token < ? AND confermato=1`, [now]);

    //qui invece controlla se ci sono utenti non confermati a cui è scaduto il token, se si vuol dire che non hanno completato la registrazione quindi li elimino dal database
    const risultato2= await dbRun(`DELETE FROM utente  WHERE durata_token IS NOT NULL AND durata_token < ? AND confermato=0`, [now]);

    console.log("Pulizia token scaduti completata.");
  } catch (err) {
    console.error("Errore nella pulizia dei token scaduti:", err);
  }
};
//qui richiamo ogni minuto la funzione che ripristina i token se sono scaduti
cron.schedule('*/1 * * * *', cleanupTokenScaduti);




// Richiesta link di reset che viene fatta dall'utente quando clicca su recupero credenziali
//inserirà l'email e poi clicca un bottone che invia la richiesta qui.
app.post('/api/richiesta-reset', async (req, res) => {
  const { email } = req.body;
   console.log("email ricevuta", email);
  try{

  
  const utente = await dbGet('SELECT * FROM utente WHERE email = ?', [email]);
    //se non viene trovata l'email ritorna errore
  if (!utente){
     console.log("utente non esiste");
    return res.status(404).send({ error: 'Non esiste nessuna account con questa email' });
  }

  //se il campo token è già pieno vuol dire che è già in corso una richiesta di recupero password
  if(utente.token){
      console.log("token già piena");
      //calcolo il tempo rimasto    
        const now = Date.now();
        const tempoRimastoMs = utente.durata_token - now;
        const tempoRimastoMin = Math.ceil(tempoRimastoMs / 60000); // da ms a minuti, arrotondato per eccesso

    return res.status(401).send({ error: 'È già in corso una richiesta di recupero password' , tempo_rimasto:tempoRimastoMin});
  }
  
  //genero una token che mi indetificherà l'utente in questo processo
  const token = crypto.randomBytes(32).toString('hex');
  //stabilisco la durata della token in questo caso 5 minuti
  const durata = Date.now() + 5 * 60 * 1000;

  //carico nel record dell'utente il valore della token e la sua durata
  await dbRun(`UPDATE utente SET token = ?, durata_token = ? WHERE id = ?`, [token, durata, utente.id]);

  //questo è il link che porterà l'utente alla pagina del sito nella sezione reset-password
  //l'utenet riceve questo link via email che è composto anche dalla token
  const link = `http://${IPsito}/reset-password?token=${token}`;
  await inviaEmailReset(email, link);//invio l'email alla email con il link
  
  return res.status(200).send({ message: 'Email di recupero inviata!' });
}
catch(err){
      console.error("Errore durante il recupero password:", err); 
    return res.status(500).send({ error: 'Errore nel database' });
}
});


// Qui resettiamo la password
//quindi l'utente quando dalla email ha aperto il link è stato portato in una pagina per resettare la password del suo account
//in quella pagina inserirà la nuova password e la invierà qui a questo post
//insieme alla password verrà inviato il token che è stato passato insieme al link della email
//così possiamo verificare l'identità dell'utente tramite il token ed in oltre verificare la validità della durata, quindi se è scaduto oppure no

app.post('/api/reset-password', async (req, res) => {
  const { token, nuovaPassword } = req.body;
try{
  const utente = await dbGet(`SELECT * FROM utente WHERE token = ?`, [token]);

  //se non esiste un utente con questo token visualizzo errore
  if (!utente || !utente.durata_token) {
    return res.status(400).send({ error: 'Token non valido' });
  }

  //se il token è scaduto 
  if(Date.now() > utente.durata_token){
    //se il token è scaduto lo resetto a null
    await dbRun(`UPDATE utente SET token = NULL, durata_token = NULL WHERE id = ?`, [utente.id]);
    return res.status(400).send({ error: 'Token scaduto' });
    
  }

  //se invece sono arrivato qui vuol dire che tutto è apposto, quindi cifro la nuova password e la carico nel db
  //in oltre resetto il token e la durata a null
  const hashedPassword = await bcrypt.hash(nuovaPassword, 10);

  await dbRun(`UPDATE utente SET password = ?, token = NULL, durata_token = NULL WHERE id = ?`, [hashedPassword, utente.id]);
  console.log("password modificata con successo")
  return res.status(200).send({ message: 'Password aggiornata con successo!' });
}
catch(err){
      console.error("Errore durante il recupero password:", err); 
    return res.status(500).send({ error: 'Errore nel database' });
}
});






// Richiesta link di reset che viene fatta dall'utente quando clicca su recupero credenziali
//inserirà l'email e poi clicca un bottone che invia la richiesta qui.
app.post('/api/richiesta-registrazione', async (req, res) => {

try {
const { email, username, password } = req.body;
  console.log(`email: ${email}`);
  console.log(`username: ${username}`);
  console.log(`password: ${password}`);

  let accountEsiste=false;
  let utenteEsiste=false;
  

  //devo verificare che non esista alcuna email oppure alcun username che corrispondono a quelle con cui l'utente sta provando a registrarsi



  //devo verificare che non esista alcuna email oppure alcun username che corrispondono a quelle con cui l'utente sta provando a registrarsi

     row = await dbGet(
      `SELECT email FROM utente WHERE email=?`,
      [email]
    );
    if(row){
         accountEsiste=true;
    }


     row = await dbGet(
      `SELECT username FROM utente WHERE username=?`,
      [username]
    );
    if(row){
         utenteEsiste=true;
    }

    //ora se sia accountEsiste che utenteEsiste sono a false, allora posso registrare l'utente, altrimenti torno errore

if(!accountEsiste && !utenteEsiste){


  const hashedPassword = await bcrypt.hash(password, 10); //10 è il valore del salt round, indica quanti mescolamenti fa bcrypt, in questo caso 2^10


    //genero un record utente nella tabella utenti che di default avrà il campo 'confermato' a false, che vuol dire che l'utente ancora non è confermato
    //in oltre carico la token e la durata che mi servono per validare la conferma nel tempo stabilito

    //genero una token che mi indetificherà l'utente in questo processo
  const token = crypto.randomBytes(32).toString('hex');
  //stabilisco la durata della token in questo caso 5 minuti
  const durata = Date.now() + 5 * 60 * 1000;

  //questo è il link che porterà l'utente alla pagina del sito nella sezione reset-password
  //l'utenet riceve questo link via email che è composto anche dalla token
  const link = `http://${IPsito}/conferma-email?token=${token}`;
  await inviaEmailRegistrazione(email, link);//invio l'email alla email con il link

  db.run(`INSERT OR IGNORE INTO utente (email, username,password,ruolo,token,durata_token) VALUES (?, ?, ?, ? ,?,?)`,
        [email,username,hashedPassword,'user',token,durata],
        function (err) {
          //se avviene un errore durante il caricamento nel db lo segnalo al sito riportando errore di tipo 500, che tipicamente viene usato per indicare questo genere di errori
          if (err) {
            res.status(500).json({ message: 'Errore durante il caricamento nel DB' });
        } else {
          //se invece tutto è stato correttamente caricato, invio una risposta con status 201
            console.log(`Utente inserito correttamente`);
            res.status(201).json({ message: `Conferma la registrazione cliccando il link inviato all\' email ${email} , il link è valido solo 5 minuti, poi la registrazione fallirà` });
            

        }
  } 
          );
        
        }

//se invece uno dtra accountEsiste ed utenteEsiste è true, allora in base a quale dei due ritorno il rispettivo errore con tanto di messaggio, il sito poi gestirà l'errore       
else{

    if(accountEsiste){
            res.status(409).json({ message: 'Esiste già un account con questa email' });
            console.log('Esiste già un account con questa email');

        }

    else{
      if(utenteEsiste){
            res.status(409).json({ message: 'Username giù utilizzato' });
            console.log('Username giù utilizzato');
        }
        
      }
  }
    
  } catch (err) {
    console.error(" Errore nel recupero ID attore:", err);
    return res.status(500).json({ message: "Errore nel Database" });
  }





});




//questa get è richiamata dalla pagina di conferma registrazione quando l'utente ha cliccato il link ed il token è risultato ancora valido
//a questo punto devo aggiornare il campo confermato da 0 a 1 e resettare la token
app.post('/api/conferma-registrazione', async (req, res) => {
    try{
  const { token} = req.body;

 const utente = await dbGet(`SELECT *  FROM utente WHERE token = ?`, [token]);
if(!utente){
     return res.status(500).send({ error: 'Errore nel database' });
}

  await dbRun(`UPDATE utente SET token = NULL, durata_token = NULL , confermato=1 WHERE id = ?`, [utente.id]);

    return  res.status(200).send({ email: utente.email, username:utente.username });


}catch(err){
  console.error("Errore durante il recupero password:", err); 
    return res.status(500).send({ error: 'Errore nel database' });
}

});




















//richiamo questa get quando l'utente deve ripristinare la password e voglio controllare prima se la token è valida
//se token non è valido o scaduto informo l'utente e non gli faccio creare una password
app.get('/api/verifica-token', async (req, res) => {
  const token = req.query.token;
try{
 const utente = await dbGet(`SELECT *  FROM utente WHERE token = ?`, [token]);

 //se non esiste un utente con questo token visualizzo errore
  if (!utente || !utente.durata_token) {
    return res.status(400).send({ error: 'Token non valido' });
  }

  //se il token è scaduto 
  if(Date.now() > utente.durata_token ){
    //se il token è scaduto lo resetto a null
    await dbRun(`UPDATE utente SET token = NULL, durata_token = NULL WHERE id = ?`, [utente.id]);
    return res.status(400).send({ error: 'Token scaduto' });
  }

  //se sono arrivato fin qui vuol dire che token e data sono validi
  //quindi ritorno correttamante l'email da visualizzare nel form per ripristinare la password
  //ritorno anche lo username perchè riuso la stessa funzione e voglio che il sito dia il benvenuto a tale username
    return  res.status(200).send({ email: utente.email, username:utente.username });


}catch(err){
  console.error("Errore durante il recupero password:", err); 
    return res.status(500).send({ error: 'Errore nel database' });
}

});



//qui catturo una get di tipo /ping che fa il service che monitora lo stato del server, il server se è acceso risponde con un 'pong', altrimenti se non risponde il service lo farà presente all'utente
app.get('/ping', (req, res) => {
  res.send('pong');
});

//get per tutti i film divisi per genere
app.get('/api/films', (req, res) => {
  const genreId = req.query.genre;

  let query;
  let params = [];
  params = [genreId];
  if (genreId) {
    query = `
      SELECT f.* 
      FROM film f
      JOIN generi_film gf ON f.id = gf.film_id
      WHERE gf.genere_id = ?
    `;
    params;
  } else {
    query = 'SELECT * FROM film';
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Errore DB:', err.message);
      res.status(500).json({ error: 'Errore durante la query' });
    } else {
      res.json(rows);
      console.log(`Dati inviati per genere ${genreId || 'TUTTI'}`);
    }
  });
});

//Get per le nuove uscite

app.get('/api/films/nuoveUscite', (req, res) => {
  const cinqueMesiFa = req.query.from;
  const dataOggi=req.query.to;

  let query;
  let params = [cinqueMesiFa,dataOggi];
    query = `
      SELECT f.* 
      FROM film f
      WHERE f.release_date BETWEEN ? AND ?
    `;
    
   


  db.all(query ,params ,(err, rows) => {
    if (err) {
      console.error('Errore DB:', err.message);
      res.status(500).json({ error: 'Errore durante la query' });
    } else {
      res.json(rows);
      console.log(`Dati inviati per nuove uscite con data  ${dataOggi}`);
    }
  });
});



//get per i dettagli dei singoli film
app.get('/api/films/dettagli', (req, res) => {
  const idFilm = req.query.id;
  

  let query;
  let params = [idFilm];
    query = `
      SELECT f.* 
      FROM film f
      WHERE f.id=?
    `;
    

  db.all(query ,params ,(err, rows) => {
    if (err) {
      console.error('Errore DB:', err.message);
      res.status(500).json({ error: 'Errore durante la query' });
    } else {
      res.json(rows);
      console.log(`Dati inviati per il singolo film con id:  ${idFilm}`);
        
    }
  });
});


//get per i dettagli dei singoli film
app.get('/api/films/attori', (req, res) => {
  const idFilm = req.query.id;
  

  let query;
  let params = [idFilm];
    query = `
      SELECT a.*, cf.character_name
      FROM attori a
      JOIN cast_film cf ON a.id = cf.attore_id
      WHERE cf.film_id = ?
    `;
    

  db.all(query ,params ,(err, rows) => {
    if (err) {
      console.error('Errore DB:', err.message);
      res.status(500).json({ error: 'Errore durante la query' });
    } else {
      res.json(rows);
      console.log(`Attori del film ${idFilm} inviati`);
        
    }
  });
});





//get che restituisce tutti i generi di un film passato per id
app.get('/api/films/generi', (req, res) => {
  const idFilm = req.query.id;
  

  let query;
  let params = [idFilm];
 query = `
      SELECT a.name, a.id
      FROM genere a
      JOIN generi_film gf ON a.id = gf.genere_id
      WHERE gf.film_id = ?
    `;

    

  db.all(query ,params ,(err, rows) => {
    if (err) {
      console.error('Errore DB:', err.message);
      res.status(500).json({ error: 'Errore durante la query' });
    } else {
      res.json(rows);
      console.log(`Generi del film ${idFilm} inviati`);
      console.log(rows);
        
    }
  });
});





//get per i dettagli dei singoli film
app.get('/api/attori/dettagli', (req, res) => {
  const idAttore= req.query.id;
  

  let query;
  let params = [idAttore];
    query = `
      SELECT a.* 
      FROM attori a
      WHERE a.id=?
    `;
    

  db.all(query ,params ,(err, rows) => {
    if (err) {
      console.error('Errore DB:', err.message);
      res.status(500).json({ error: 'Errore durante la query' });
    } else {
      res.json(rows);
      console.log(`Dati inviati per il singolo attore con id:  ${idAttore}`);
        
    }
  });
});


//get per i dettagli dei singoli film
app.get('/api/registi/dettagli', (req, res) => {
  const idAttore= req.query.id;
  

  let query;
  let params = [idAttore];
    query = `
      SELECT a.* 
      FROM registi a
      WHERE a.id=?
    `;
    

  db.all(query ,params ,(err, rows) => {
    if (err) {
      console.error('Errore DB:', err.message);
      res.status(500).json({ error: 'Errore durante la query' });
    } else {
      res.json(rows);
      console.log(`Dati inviati per il singolo attore con id:  ${idAttore}`);
        
    }
  });
});



//get per i dettagli dei singoli film
app.get('/api/registi/films', (req, res) => {
  const idRegista= req.query.id;
  console.log(`film del regista ${idRegista} richiesti`);

  let query;
  let params = [idRegista];
    query = `
      SELECT f.* 
      FROM film f
      WHERE f.regista=?
    `;
    

  db.all(query ,params ,(err, rows) => {
    if (err) {
      console.error('Errore DB:', err.message);
      res.status(500).json({ error: 'Errore durante la query' });
    } else {
      res.json(rows);
      console.log(`Film dell'regista ${idRegista} inviati`);
        
    }
  });
});


//get per tutti i film in cui ha partecipato l'attore passato per id
app.get('/api/attori/films', (req, res) => {
  const idAttore = req.query.id;
  

  let query;
  let params = [idAttore];
    query = `
      SELECT f.* ,cf.character_name
      FROM film f
      JOIN cast_film cf ON f.id = cf.film_id
      WHERE cf.attore_id = ?
    `;
    

  db.all(query ,params ,(err, rows) => {
    if (err) {
      console.error('Errore DB:', err.message);
      res.status(500).json({ error: 'Errore durante la query' });
    } else {
      res.json(rows);
      console.log(`Film dell'attore ${idAttore} inviati`);
        
    }
  });
});



//get per tutti i film in cui ha partecipato l'attore passato per id
app.get('/api/films/preferiti', (req, res) => {
  const idUtente = req.query.id;
  

  let query;
  let params = [idUtente];
    query = `
      SELECT f.* 
      FROM film f
      JOIN utente_film uf ON f.id = uf.film_id
      WHERE uf.utente_id = ? and uf.preferiti=1
    `;
    

  db.all(query ,params ,(err, rows) => {
    if (err) {
      console.error('Errore DB:', err.message);
      res.status(500).json({ error: 'Errore durante la query' });
    } else {
      res.json(rows);
      console.log(`Film prferiti dell utente ${idUtente} inviati`);
        
    }
  });
});

//get per tutti i film in cui ha partecipato l'attore passato per id
app.get('/api/films/valutati', (req, res) => {
  const idUtente = req.query.id;
  

  let query;
  let params = [idUtente];
    query = `
      SELECT f.*, uf.valutazione
      FROM film f
      JOIN utente_film uf ON f.id = uf.film_id
      WHERE uf.utente_id = ? and uf.valutazione>0
    `;
    

  db.all(query ,params ,(err, rows) => {
    if (err) {
      console.error('Errore DB:', err.message);
      res.status(500).json({ error: 'Errore durante la query' });
    } else {
      res.json(rows);
      console.log(`Film valutati dell utente ${idUtente} inviati`);
        
    }
  });
});





const jwt = require('jsonwebtoken');

//riceve i dati per il login
app.post('/api/login', async(req, res) => {
  const { email, password } = req.body;
  console.log(`email: ${email} sta tentando il login`);
  

  let accountEsiste=false;
  let credenzialiCorrette=false;
  let utenteLoggato=null;




  //devo verificare che non esista alcuna email oppure alcun username che corrispondono a quelle con cui l'utente sta provando a registrarsi
try {
    //il login possono effettuarlo solo gli account già confermati quindi con il campo confermato posto a 1
     row = await dbGet(
      `SELECT * FROM utente WHERE email=? and confermato=1`,
      [email]
    );
    if(row){
         accountEsiste=true;
         console.log(row.password);
         //confronto la password passata con quella salvata nel db che però è cifrata quindi richiamo il bcrypt.compare, che ritorna true se sono uguali, altrimenti false
         if(await bcrypt.compare(password, row.password)){
            
              credenzialiCorrette=true;
              utenteLoggato=row;//salvo l'utente loggato nella variabile utenteLoggato
            }
            
         
    }


   //se l'account esiste, cioè , l'email corrisponde ad una trovata nel db:
if(accountEsiste){

  //se anche la password è corretta allora logga l'utente ritornando il suo ruolo ed il suo username
  if(credenzialiCorrette){
    console.log(`utente loggato con ruolo ${utenteLoggato.ruolo}`);

    const utente = { id: utenteLoggato.id, email:utenteLoggato.email, username: utenteLoggato.username, profile_image:utenteLoggato.profile_image,role: utenteLoggato.ruolo }; //utente è un oggetto composto da id, username e dal ruolo dell'utente loggato

    res.json({utente}); //restituisco un oggetto json formato dall'utente con i suoi attributi
    
  }
  else {
    res.status(401).json({ message: 'Credenziali non valide' });
  }

}
 else {
    res.status(401).json({ message: 'Account non registrato' });
  }
    
  } catch (err) {
    console.error(" Errore nel recupero ID attore:", err);
    return res.status(500).json({ message: "Errore nel Database" });
  }






});








//riceve i dati per modificare la password
app.post('/api/modifica-password', async(req, res) => {
  const { idUtente, passwordAttualePassata, nuovaPassword } = req.body;
  console.log(`idUtente: ${idUtente}`);
  console.log(`passwordAttuale: ${passwordAttualePassata}`);
  console.log(`nuovaPassword: ${nuovaPassword}`);

  let passwordUguali=false; //se la nuova password è uguale alla vecchia
  let passwordSbagliata=false; //se la password corrente inserita è diversa da quella attuale
  let passwordReale;

  //devo verificare che non esista alcuna email oppure alcun username che corrispondono a quelle con cui l'utente sta provando a registrarsi
try {
    const row = await dbGet(
      `SELECT password FROM utente WHERE id=?`,
      [idUtente]
    );
    passwordReale=row.password;
    console.log("password originale ",passwordReale);

    //verifico se la password corrente passata coincide con quella attuale
    if(!await bcrypt.compare(passwordAttualePassata, passwordReale)){
      passwordSbagliata=true;
      return res.status(409).json({ message: "password errata" });
    }
    else{
      //verifico se la nuova password è uguale a quella ancora corrente
      if(await bcrypt.compare(nuovaPassword, passwordReale)){
          passwordUguali=true;
          return res.status(409).json({ message: "password uguali" });

      }
    }
    
    //se sono arrivato qui ho superato i controlli password corrente errata e passwor nuova uguale alla vecchia
    //per sicurezza faccio lo stesso un if sulle variabili booleane anche se non servirebbe

    if(!passwordUguali && !passwordSbagliata){

      const hashedPassword = await bcrypt.hash(nuovaPassword, 10); //cifro la password nuova prima di metterla nel db
      //procedo all'aggiornamento della password
      await dbRun(
  `UPDATE utente
   SET password = ?
   WHERE id = ?`,
  [
    hashedPassword,idUtente
  ]
);

console.log("password modificata con successo");
return res.status(200).json({message:"Password modificata con successo!"});

    }
  
  
  
  } catch (err) {
    console.error(" Errore nel recupero ID attore:", err);
    return res.status(500).json({ message: "Errore nel Database" });
  }


});

//riceve i dati per modificare l'username
app.post('/api/modifica-username', async(req, res) => {
  const { idUtente,nuovoUsername } = req.body;
  console.log(`idUtente: ${idUtente}`);
  console.log(`nuovoUsername: ${nuovoUsername}`);


 

  //devo verificare che non esista alcuna email oppure alcun username che corrispondono a quelle con cui l'utente sta provando a registrarsi
try {
    const row = await dbGet(
      `SELECT username FROM utente WHERE username=?`,
      [nuovoUsername]
    );
    //se è stato trovato un username uguale a quello che l'utente ha passato ritorno errore
    if(row){
       console.log("utente con username uguale trovato: ",row.username);
      return res.status(409).json({ message: "username esistente" });
    }
    //altrmenti se non esiste un altro utente con nome utente simile posso procedere alla modifica del username
    else{
          //procedo all'aggiornamento del username
                await dbRun(
            `UPDATE utente
             SET username = ?
             WHERE id = ?`,
            [
              nuovoUsername,idUtente
            ]
          );

          console.log("password modificata con successo");
          return res.status(200).json({message:"Username modificato con successo!"});
    }

  } catch (err) {
    console.error(" Errore nel recupero ID attore:", err);
    return res.status(500).json({ message: "Errore nel Database" });
  }


});



//serve per modificare i dati di un film, tra cui ruoli degli attori, possibili nuovi attori, è possibile anche cancellare attori da quel film
app.post('/api/modifica-profile-image', upload.any(),async (req, res) => {

try{
const profile_Image = req.files.find(f => f.fieldname === 'profile_image');
if (!profile_Image) {
      return res.status(400).json({ message: 'Non hai caricato nessuna immagine' });
    }

const userId = Number(req.body.userId);
 if (!userId) {
      return res.status(400).json({ message: 'ID utente mancante.' });
    }
    const uploadsPath = path.join(__dirname, 'uploads', 'utenti', `utente_${userId}`);
    await fs.promises.mkdir(uploadsPath, { recursive: true }); // crea cartella se non esiste


 const nomeBase = path.parse(profile_Image.originalname).name;
    const estensione = path.extname(profile_Image.originalname);
    const finalName = `user_profile_${nomeBase}${estensione}`; // es. user_profile_img1.jpg

    const fullPath = path.join(uploadsPath, finalName);
    const relativePath = `utenti/utente_${userId}/${finalName}`; // es. utenti/utente_1_user_profile_img1.jpg
    await fs.promises.writeFile(fullPath, profile_Image.buffer);

 await db.run(`
  UPDATE utente
  SET profile_image = ? 
  WHERE id = ?`, 
  [relativePath, userId]
);
 res.status(200).json({ message: 'Immagine profilo aggiornata!', profile_path: relativePath });

}catch(err){
console.error('Errore nel salvataggio immagine profilo:', err);
    res.status(500).json({ message: 'Errore nel salvataggio immagine profilo.' });
}


});




//serve per caricare un film nel db, il server riceve tutti i dati del film, degli attori partecipanti e l'id dell'amministratore che sta effettuando tale operazione
app.post('/api/carica-film', upload.any(),async (req, res) => {

idFilm=-1; //variabile idFilm che viene caricata quando il film viene caricato nel db, a quel punto con una select risalgo all'id che gli è stato assegnato
idAttori=[];//variabile idAttore che viene caricata quando l'attore  viene caricato nel db, a quel punto con una select risalgo all'id che gli è stato assegnato


  //visualizzo body e files della request dell'utente
console.log('=== DEBUG BODY ===');
console.log(req.body);
console.log('=== DEBUG FILES ===');
console.log(req.files);

 // Usiamo req.body negli attributi del film
  const { title, overview, vote_average, durata,regista,vote_count, release_date, idAdmin } = req.body;

  //invece gli array generi e listaAttori sono stringhe json, quindi per trattarli come oggetti dobbiamo prima convertirli con json.parse

  const generiSelezionati = JSON.parse(req.body.generiSelezionati);
  const listaAttori = [];
//ovviamente essendo listaAttori una serie di oggetti dobbiamo ciclare tale lista e convertire ogni stringa in json, con anche la rispettiva imagine profilo che verrà caricata in attore.profileImageFile
for (let i = 0; i < req.body.attori.length; i++) {
  const attore = JSON.parse(req.body.attori[i]);

  const imageFile = req.files.find(file => file.fieldname === `attoriImage[${i}]`);
  if (imageFile) {
    attore.profileImageFile = imageFile;
  }

  listaAttori.push(attore);
}
  //estrapolo l'immagine del film dall'attributo poster path
  //ma ora devo creare una stringa del tipo img1-1344165456.jpg
  //tale stringa viene salvata nel DB nel campo poster_path del film
  //così quando dal sito voglio accedere a tale immagine ho un percorso file come quello che avevo per tmdb, solo che sta volta il server è questo
  //infatti devo prima salvare questa immagine in una cartella qui nel server che chiamo uploads
  //però prima di caricarla usando: fs.promises.rename(poster_Image.path, path.join('uploads', posterFileName)); faccio tutti i controlli al film ed agli attori
  //intanto ora però genero la variabile del tipo img1-1344165456.jpg

const poster_Image = req.files.find(f => f.fieldname === 'poster_path');
let posterFileName = null;
let fileNameSolo=null;
if (poster_Image) {
  // es: salva come "img1-1344165456.jpg"
  const nomeBase = path.parse(poster_Image.originalname).name; // es: "img1"
  const estensione = path.extname(poster_Image.originalname);  // es: ".jpg"
 fileNameSolo = `${nomeBase}-${Date.now()}${estensione}`;
 posterFileName = `film_img/${fileNameSolo}`;//questo sarà il nome del path che verrà salvato nel db del tipo film_img/img1-574545.jpg, così nel sito creo una sola funzione getImage che mi vale sia per attori che per film
}


let profileFileNameSolo=[]
let profileFileName=[]
//faccio la stessa cosa per le immagini degli attori

for (let i = 0; i < listaAttori.length; i++) {
  const attore = listaAttori[i];
   if (attore.profileImageFile && !attore.esistente) {
    //se l'attore è tra quelli non esistenti e l'utente gli ha caricato una immagine profilo allora faccio il procedimento per creare un file dal nome tipo  img1-1344165456.jpg
    console.log(`sostiuisco immagine: ${attore.profileImageFile.originalname}`);
    const nomeBase = path.parse(attore.profileImageFile.originalname).name; // es: "img1"
    const estensione = path.extname(attore.profileImageFile.originalname);  // es: ".jpg"
    profileFileNameSolo[i] = `${nomeBase}-${Date.now()}${estensione}`; //date.now prende la data attuale, così che ogni upload sarà univoco e non ci saranno conflitti con altre immagini
    profileFileName[i]=`attori_img/${profileFileNameSolo[i]}`
  }

}











  console.log(`title: ${title}`);
  console.log(`overview: ${overview}`);
  console.log(`vote_average: ${vote_average}`);
  console.log(`vote_count: ${vote_count}`);
  console.log(`release_date: ${release_date}`);
   console.log(`durata: ${durata}`);
    console.log(`regista: ${regista}`);
  console.log(`generiSelezionati: ${generiSelezionati}`);
  console.log(`poster_Image: ${poster_Image.originalname}`);
  console.log(`idAdmin: ${idAdmin}`);
  
//stampo gli attori con i rispettivi dati
listaAttori.forEach((attore, index) => {
  console.log(` Attore ${index}:`);
  console.log(`Nome: ${attore.name}`);
  console.log(`Ruolo: ${attore.character_name}`);
  console.log(`Nato a: ${attore.place_of_birth}`);
  console.log(`Data di nascita: ${attore.birthday}`);
   console.log(`attore esiste?: ${attore.esistente}`);
   
  if (attore.profileImageFile) {
    console.log(`Immagine: ${attore.profileImageFile.originalname}`);
  } else {
    if(attore.profile_path){
       console.log(`Immagine come poster path: ${attore.profile_path}`);
    }
    else{
    console.log('Nessuna immagine ricevuta');
    }
  }
});




//prima di caricare i dati nel db dobbiamo verificare che:
//-il film che stiamo caricando non esista già, ci limitiamo a verificarlo tramite il titolo
//-l'attore che stiamo aggiungendo che non risulta esistente non esista, verifichiamo nome, e data nascita


//prima finisco tutti i controlli e poi faccio il caricamento, perchè non mi va di caricare dati nel db se poi capitano alcuni non validi.
//quindi solo se TUTTI i dati sono corretti e validi allora procedo al corretto caricamento nel db


//questa è una funzione async, così che posso fare le query al server ed aspettare che finiscano perchè quando la richiamo faccio aspettare con await
//tale funzione mi ritorna true se i controlli sono andati a buon fine altrimenti false
async function verificaPrimaDiInserire(title, listaAttori) {
  let erroreFilmEsistente = false;
  let erroreAttoreEsistente = false;

  // Verifica film
  const film = await dbAll(
    `SELECT * 
    FROM film 
    WHERE LOWER(title) = ? AND release_date= ?`,
    [title.toLowerCase(),release_date]
  );
  if (film.length > 0) erroreFilmEsistente = true;

  // Verifica attori
  for (const attore of listaAttori) {
    if (!attore.esistente) {
      const attoriTrovati = await dbAll(
        `SELECT * 
        FROM attori 
        WHERE LOWER(name) LIKE ? AND birthday = ?`,
        [`%${attore.name.toLowerCase()}%`, attore.birthday]
      );
      if (attoriTrovati.length > 0) erroreAttoreEsistente = true;
    }
  }

  // controlliamo gli esiti dei controlli
  if (erroreFilmEsistente) {
    console.log(" ERRORE:Film già esistente");
    res.status(409).json({ message: 'Film già esistente' });
  }
  if (erroreAttoreEsistente) {
    console.log("ERRORE:Attore già esistente");
     res.status(409).json({ message: 'Hai caricato i dati di un attore già esistente, se vuoi caricare un attore esiste selezionalo dal menù a tendina che si apre quando stai scrivendo il suo nome' });
  } 
  if (!erroreFilmEsistente && !erroreAttoreEsistente) {
    return true;
  }else{
    return false;
  }
}

const esitoControlli= await verificaPrimaDiInserire(title,listaAttori);
//se i controlli sono andati a buon fine inizio il caricamento nel db
if(esitoControlli){

//adesso dobbiamo andare a caricare i dati nel db considerando che:
//i dati film verranno caricati nella tabella film
//i dati attore, se già non esiste, verrà caricato nella tabella attore
//per ogni genere selezionato, bisogna caricare nella tabella GENERI_FILM, L'id del film che stiamo aggiungendo con associato l'id del genere
//per ogni attore in lista attori, dobbiamo caricare nella tabella cast_film, l'id di tale attore, l'id del film ed il ruolo che ha interpretato


//carico il film
 try {
  console.log("DEBUG poster_Image:", poster_Image);
  await fs.promises.writeFile(path.join('uploads/film_img', fileNameSolo),poster_Image.buffer);//carico l'immagine copertina nella cartella uploads
  await dbRun(
    `INSERT OR IGNORE INTO film (title, overview, vote_count, poster_path, release_date, vote_average,tempo,regista, id_amministratore)
     VALUES (?, ?, ?, ?, ?, ?, ?,?,?)`,
    [
      title,
      overview || null,
      vote_count || null,
      posterFileName,//come posterpath inserisco il posterFileName che avevo creato , quindi es. img1-545464546.jpg
      release_date || null,
      vote_average || null,
      durata,
      regista,
      idAdmin
    ]
  );
  console.log("Film inserito correttamente");

  const row = await dbGet(
    `SELECT id FROM film WHERE title = ? AND release_date = ?`,
    [title, release_date]
  );
  idFilm = row?.id;
  console.log("ID film:", idFilm);
} catch (err) {
  console.error("Errore durante inserimento o lettura film:", err);
  return res.status(500).json({ message: 'Errore durante il caricamento del film nel DB' });
}






//carico gli attori non ancora esistenti nel db
for (let i = 0; i < listaAttori.length; i++) {
  const attore = listaAttori[i];

   //controllo che tipo di immagine profilo abbia, se una profile path, oppure un dataframe oppure null
  if (!attore.esistente) {
    let ProfiloImage = null;
    if (attore.profileImageFile) {
      ProfiloImage=profileFileName[i] //se aveva immagine caricata, allora nel db salvo il file name generato per quella immagine es. img1-54546456.jpg
      await fs.promises.writeFile( path.join('uploads/attori_img', profileFileNameSolo[i]),attore.profileImageFile.buffer); //carico l'immagine nella cartella uploads/attori
    } else if (attore.profile_path) {//altrimenti se esiste il profilepath(cosa poco probabile) gli carico il profile path
      ProfiloImage = attore.profile_path;
    }

    try {
            //la faccio await così il codice deve aspettare che finisca di essere eseguita per proseguire, così dopo il for prendo tutti gli id degli attori in una sola volta

      await dbRun(
        `INSERT OR IGNORE INTO attori (name, biography, birthday, deathday, gender, place_of_birth, profile_path, id_amministratore)
         VALUES (?, ?, ?, ?, ?, ?, ?,?)`,
        [
          attore.name,
          attore.biography || null,
          attore.birthday || null,
          attore.deathday || null,
          attore.gender,
          attore.place_of_birth || null,
          ProfiloImage || null,
          idAdmin
        ]
      );
      console.log(` Attore '${attore.name}' inserito correttamente`);
    } catch (err) {
      //se avviene un errore durante il caricamento nel db lo segnalo al sito riportando errore di tipo 500, che tipicamente viene usato per indicare questo genere di errori

      console.error("Errore durante inserimento attore:", err);
      return res.status(500).json({ message: 'Errore durante il caricamento degli attori nel DB' });
    }
  }
}



//adesso prendiamo gli id degli attori
for (const attore of listaAttori) {
  try {
    const row = await dbGet(
      `SELECT id FROM attori WHERE LOWER(name) = ? AND birthday = ?`,
      [attore.name.toLowerCase().trim(), attore.birthday]
    );
    
    idAttori.push(row?.id);
    console.log("attore id salvato:", row?.id);
  } catch (err) {
    console.error(" Errore nel recupero ID attore:", err);
    return res.status(500).json({ message: "Errore nella lettura dell'ID attore" });
  }
}




//adesso che abbiamo l'id del film e gli id degli attori possiamo andare a caricare le tabelle relazionali generi_film e cast_film

//tabella generi_film
//adesso dobbiamo caricare per ogni genere selezionato, la tabella generi_film, con l'id del genere e l'id del film

for (const genere of generiSelezionati) {
  try {
    await dbRun(
      `INSERT OR IGNORE INTO generi_film (film_id, genere_id) VALUES (?, ?)`,
      [idFilm, genere]
    );
    console.log(`Genere ${genere} collegato al film`);
  } catch (err) {
    console.error(" Errore durante inserimento generi_film:", err);
    return res.status(500).json({ message: 'Errore durante il caricamento dei generi nel DB' });
  }
}



//tabella cast_film
//adesso dobbiamo caricare per ogni attore , la tabella cast_film, con l'id dell'attore e l'id del film ed il ruolo

for (let i = 0; i < listaAttori.length; i++) {
  const attore = listaAttori[i];
  const idattore = idAttori[i];
  try {
    await dbRun(
      `INSERT OR IGNORE INTO cast_film (film_id, attore_id, character_name) VALUES (?, ?, ?)`,
      [idFilm, idattore, attore.character_name]
    );
    console.log(`Cast inserito: attore ${attore.name}, ruolo '${attore.character_name}'`);
  } catch (err) {
    console.error(" Errore durante inserimento cast_film:", err);
    return res.status(500).json({ message: 'Errore durante il caricamento del cast nel DB' });
  }
}




  res.status(201).json({ message: 'Film caricato con successo' });
}



});






//serve per modificare i dati di un film, tra cui ruoli degli attori, possibili nuovi attori, è possibile anche cancellare attori da quel film
app.post('/api/modifica-film', upload.any(),async (req, res) => {

idAttori=[];//variabile idAttore che viene caricata quando l'attore  viene caricato nel db, a quel punto con una select risalgo all'id che gli è stato assegnato


  //visualizzo body e files della request dell'utente
console.log('=== DEBUG BODY ===');
console.log(req.body);
console.log('=== DEBUG FILES ===');
console.log(req.files);

 // Usiamo req.body negli attributi del film
  const { title, overview, vote_average, durata,regista,vote_count, release_date, idAdmin } = req.body;
  const idFilm = Number(req.body.idFilm);
  //invece gli array generi e listaAttori sono stringhe json, quindi per trattarli come oggetti dobbiamo prima convertirli con json.parse

  const generiSelezionati = JSON.parse(req.body.generiSelezionati);
  const listaAttori = [];
//ovviamente essendo listaAttori una serie di oggetti dobbiamo ciclare tale lista e convertire ogni stringa in json, con anche la rispettiva imagine profilo che verrà caricata in attore.profileImageFile
for (let i = 0; i < req.body.attori.length; i++) {
  const attore = JSON.parse(req.body.attori[i]);

  const imageFile = req.files.find(file => file.fieldname === `attoriImage[${i}]`);
  if (imageFile) {
    attore.profileImageFile = imageFile;
  }

  listaAttori.push(attore);
}
  //estrapolo l'immagine del film dall'attributo poster path
  //ma ora devo creare una stringa del tipo img1-1344165456.jpg
  //tale stringa viene salvata nel DB nel campo poster_path del film
  //così quando dal sito voglio accedere a tale immagine ho un percorso file come quello che avevo per tmdb, solo che sta volta il server è questo
  //infatti devo prima salvare questa immagine in una cartella qui nel server che chiamo uploads
  //però prima di caricarla usando: fs.promises.rename(poster_Image.path, path.join('uploads', posterFileName)); faccio tutti i controlli al film ed agli attori
  //intanto ora però genero la variabile del tipo img1-1344165456.jpg

const poster_Image = req.files.find(f => f.fieldname === 'poster_path');
let posterFileName = null;
let fileNameSolo=null;
if (poster_Image) {
  // es: salva come "img1-1344165456.jpg"
      console.log(`sostiuisco immagine film: ${poster_Image.originalname}`);

  const nomeBase = path.parse(poster_Image.originalname).name; // es: "img1"
  const estensione = path.extname(poster_Image.originalname);  // es: ".jpg"
 fileNameSolo = `${nomeBase}-${Date.now()}${estensione}`;
 posterFileName = `film_img/${fileNameSolo}`;//questo sarà il nome del path che verrà salvato nel db del tipo film_img/img1-574545.jpg, così nel sito creo una sola funzione getImage che mi vale sia per attori che per film
console.log(`ottenendo: ${posterFileName}`);
}
else{
  posterFileName=req.body.poster_path;
   console.log(`non ho sostituito immagine film: ${posterFileName}`);
}


let profileFileNameSolo=[]
let profileFileName=[]
//faccio la stessa cosa per le immagini degli attori

for (let i = 0; i < listaAttori.length; i++) {
  const attore = listaAttori[i];
   if (attore.profileImageFile && !attore.esistente) {
    //se l'attore è tra quelli non esistenti e l'utente gli ha caricato una immagine profilo allora faccio il procedimento per creare un file dal nome tipo  img1-1344165456.jpg
    console.log(`sostiuisco immagine attore : ${attore.profileImageFile.originalname}`);
    const nomeBase = path.parse(attore.profileImageFile.originalname).name; // es: "img1"
    const estensione = path.extname(attore.profileImageFile.originalname);  // es: ".jpg"
    profileFileNameSolo[i] = `${nomeBase}-${Date.now()}${estensione}`; //date.now prende la data attuale, così che ogni upload sarà univoco e non ci saranno conflitti con altre immagini
    profileFileName[i]=`attori_img/${profileFileNameSolo[i]}`
    console.log(`ottenendo: ${profileFileName[i]}`);
  }

}










  console.log(`idfilm: ${idFilm}`);
  console.log(`title: ${title}`);
  console.log(`overview: ${overview}`);
  console.log(`vote_average: ${vote_average}`);
  console.log(`vote_count: ${vote_count}`);
  console.log(`release_date: ${release_date}`);
  console.log(`generiSelezionati: ${generiSelezionati}`);
  if(poster_Image){
 console.log(`poster_Image: ${poster_Image.originalname}`);
  }
  else{
     console.log(`poster_Image: ${posterFileName}`);
  }
 
  console.log(`idAdmin: ${idAdmin}`);
  
//stampo gli attori con i rispettivi dati

listaAttori.forEach((attore, index) => {
  console.log(` Attore ${index}:`);
  console.log(`Nome: ${attore.name}`);
  console.log(`Ruolo: ${attore.character_name}`);
  console.log(`Nato a: ${attore.place_of_birth}`);
  console.log(`Data di nascita: ${attore.birthday}`);
   console.log(`attore esiste?: ${attore.esistente}`);
   
  if (attore.profileImageFile) {
    console.log(`Immagine: ${attore.profileImageFile.originalname}`);
  } else {
    if(attore.profile_path){
       console.log(`Immagine come poster path: ${attore.profile_path}`);
    }
    else{
    console.log('Nessuna immagine ricevuta');
    }
  }
});




//prima di modificare i dati nel db dobbiamo verificare che:
//-il titolo che stiamo inserendo sia uguale ad un altro film già esistente
//-l'attore che stiamo aggiungendo che non risulta esistente non esista, verifichiamo nome, e data nascita


//prima finisco tutti i controlli e poi faccio il caricamento, perchè non mi va di caricare dati nel db se poi capitano alcuni non validi.
//quindi solo se TUTTI i dati sono corretti e validi allora procedo al corretto caricamento nel db


//questa è una funzione async, così che posso fare le query al server ed aspettare che finiscano perchè quando la richiamo faccio aspettare con await
//tale funzione mi ritorna true se i controlli sono andati a buon fine altrimenti false
async function verificaPrimaDiInserire(title, listaAttori) {
  let erroreFilmEsistente = false;
  let erroreAttoreEsistente = false;

  // Verifica film
  const film = await dbAll(
    `SELECT * 
    FROM film 
    WHERE LOWER(title) = ? AND release_date= ? AND id != ?`, //ovviamente deve essere diverso da se stesso quindi escludo il film con l'id attuale dal controllo
    [title.toLowerCase(),release_date,idFilm]
  );
  if (film.length > 0) erroreFilmEsistente = true;

  // Verifica attori
  nomiAttoriTrovati="";
  for (const attore of listaAttori) {
    if (!attore.esistente) {
      const attoriTrovati = await dbAll(
        `SELECT * 
        FROM attori 
        WHERE LOWER(name) LIKE ? AND birthday = ?`,
        [`%${attore.name.toLowerCase()}%`, attore.birthday]
      );
      if (attoriTrovati.length > 0) {
        //se sono stati trovati degli attori già esistenti, ne carico su una stringa tutti i nomi, così che poi visualizzo la stringa nel messaggio di errore
        erroreAttoreEsistente = true;
        for (const att of attoriTrovati){
            nomiAttoriTrovati=nomiAttoriTrovati+"-"+att.name;
        }
        
      }
    }
  }

  // controlliamo gli esiti dei controlli
  if (erroreFilmEsistente) {
    console.log(" ERRORE:Film già esistente");
    res.status(409).json({ message: 'Film già esistente' });
  }
  if (erroreAttoreEsistente) {
    console.log("ERRORE:Attore già esistente");
     res.status(409).json({ message: 'Hai creato uno o più attori già esisenti:['+nomiAttoriTrovati+"-]\n.Se devi inserire un attore già esistente, selezionalo dal menù a tendina che compare quando digiti il suo nome"});
  } 
  if (!erroreFilmEsistente && !erroreAttoreEsistente) {
    return true;
  }else{
    return false;
  }
}

const esitoControlli= await verificaPrimaDiInserire(title,listaAttori);

//se i controlli sono andati a buon fine inizio il caricamento nel db
if(esitoControlli){

//adesso dobbiamo andare a caricare i dati nel db considerando che:
//i dati film verranno caricati nella tabella film
//i dati attore, se già non esiste, verrà caricato nella tabella attore
//per ogni genere selezionato, bisogna caricare nella tabella GENERI_FILM, L'id del film che stiamo aggiungendo con associato l'id del genere
//per ogni attore in lista attori, dobbiamo caricare nella tabella cast_film, l'id di tale attore, l'id del film ed il ruolo che ha interpretato


//carico il film
 try {

  if(poster_Image){//carico l'immagine copertina nella cartella uploads solo se è stata caricata dall'utente e non è quell di default
  console.log("DEBUG poster_Image:", poster_Image);
  await fs.promises.writeFile(path.join('uploads/film_img', fileNameSolo),poster_Image.buffer);//carico l'immagine copertina nella cartella uploads
}




await dbRun(
  `UPDATE film
   SET title = ?, 
       overview = ?, 
       vote_count = ?, 
       poster_path = ?, 
       release_date = ?, 
       vote_average = ?, 
       tempo=?,
       regista=?,
       id_amministratore = ?
   WHERE id = ?`,
  [
    title,
    overview || null,
    vote_count || null,
    posterFileName, // es. "img1-545464546.jpg"
    release_date || null,
    vote_average || null,
    durata,
    regista,
    idAdmin,
    idFilm // id del film che stiamo aggiornando
  ]
);
console.log("Film aggiornato correttamente");

} catch (err) {
  console.error("Errore durante aggiornamento film:", err);
  return res.status(500).json({ message: 'Errore durante il caricamento del film nel DB' });
}






//carico gli attori non ancora esistenti nel db
for (let i = 0; i < listaAttori.length; i++) {
  const attore = listaAttori[i];

   //controllo che tipo di immagine profilo abbia, se una profile path, oppure un dataframe oppure null
  if (!attore.esistente) {
    let ProfiloImage = null;
    if (attore.profileImageFile) {
      ProfiloImage=profileFileName[i] //se aveva immagine caricata, allora nel db salvo il file name generato per quella immagine es. img1-54546456.jpg
      await fs.promises.writeFile( path.join('uploads/attori_img', profileFileNameSolo[i]),attore.profileImageFile.buffer); //carico l'immagine nella cartella uploads/attori
    } else if (attore.profile_path) {//altrimenti se esiste il profilepath(cosa poco probabile) gli carico il profile path
      ProfiloImage = attore.profile_path;
    }

    try {
            //la faccio await così il codice deve aspettare che finisca di essere eseguita per proseguire, così dopo il for prendo tutti gli id degli attori in una sola volta

      await dbRun(
        `INSERT OR IGNORE INTO attori (name, biography, birthday, deathday, gender, place_of_birth, profile_path, id_amministratore)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          attore.name,
          attore.biography || null,
          attore.birthday || null,
          attore.deathday || null,
          attore.gender,
          attore.place_of_birth || null,
          ProfiloImage || null,
          idAdmin
        ]
      );
      console.log(` Attore '${attore.name}' inserito correttamente`);
    } catch (err) {
      //se avviene un errore durante il caricamento nel db lo segnalo al sito riportando errore di tipo 500, che tipicamente viene usato per indicare questo genere di errori

      console.error("Errore durante inserimento attore:", err);
      return res.status(500).json({ message: 'Errore durante il caricamento degli attori nel DB' });
    }
  }
}



//adesso prendiamo gli id degli attori
for (const attore of listaAttori) {
  try {
    const row = await dbGet(
      `SELECT id FROM attori WHERE LOWER(name) = ? AND birthday = ?`,
      [attore.name.toLowerCase().trim(), attore.birthday]
    );
    
    idAttori.push(row?.id);
    console.log("attore id salvato:", row?.id);
  } catch (err) {
    console.error(" Errore nel recupero ID attore:", err);
    return res.status(500).json({ message: "Errore nella lettura dell'ID attore" });
  }
}




//adesso che abbiamo l'id del film e gli id degli attori possiamo andare ad aggiornare le tabelle relazionali generi_film e cast_film

//per facilitarci il compito, pur essendo una operazione che richiede più spesa di calcolo, ci conviene cancellare tutti i generi di quel film e ricaricarli con i valori attuali ricevuti, stessa cosa vale per gli attori
//tanto l'operazione di modifica non viene fatta spesso, ma in questo modo sono sicuro che generi ed attori saranno solo quelli che l'utente ha lasciato selezionati alla modifica del film, senza inventare codice per capire quali sono stati cancellati e quali aggiunti




//tabella generi_film
//adesso dobbiamo caricare per ogni genere selezionato, la tabella generi_film, con l'id del genere e l'id del film
//prima cancello tutti i generi per quel film
try {

  await dbRun(`DELETE FROM generi_film WHERE film_id = ?`, [idFilm]);

   //quando ha finito ricarico tutti quelli che sono stati passati attualmente , quindi comprese modifiche (aggiunte e cancellazioni)
  for (const genere of generiSelezionati) {
    await dbRun(
      `INSERT OR IGNORE INTO generi_film (film_id, genere_id) VALUES (?, ?)`,
      [idFilm, genere]
    );
    console.log(`Genere ${genere} collegato al film`);
  }
} catch (err) {
  console.error("Errore durante aggiornamento generi:", err);
  return res.status(500).json({ message: 'Errore durante il caricamento dei generi nel DB' });
}



//tabella cast_film
//adesso dobbiamo caricare per ogni attore , la tabella cast_film, con l'id dell'attore e l'id del film ed il ruolo
//elimino tutti i record dalla tabella cast_film dove c'è l'id di tale film, poi li ricarico
try {
  
  await dbRun(`DELETE FROM cast_film WHERE film_id = ?`, [idFilm]);

//quando ha finito ricarico tutti quelli che sono stati passati attualmente , quindi comprese modifiche (aggiunte e cancellazioni)

  for (let i = 0; i < listaAttori.length; i++) {
    const attore = listaAttori[i];
    const idattore = idAttori[i];

    await dbRun(
      `INSERT OR IGNORE INTO cast_film (film_id, attore_id, character_name) VALUES (?, ?, ?)`,
      [idFilm, idattore, attore.character_name]
    );

    console.log(`Cast inserito: attore ${attore.name}, ruolo '${attore.character_name}'`);
  }
} catch (err) {
  console.error("Errore durante aggiornamento cast:", err);
  return res.status(500).json({ message: 'Errore durante il caricamento del cast nel DB' });
}





  res.status(201).json({ message: 'Film modificato con successo' });
}

    
   

});



//serve a rimuovere un film dal DB e con esso anche la relazione con i generi e con gli attori
app.post('/api/rimuovi-film', upload.any(),async (req, res) => {
 // Usiamo req.body negli attributi del film
  const idFilm = Number(req.body.idFilm);

  console.log("id film ricevuto:",idFilm);
  
try {

  await dbRun(`DELETE FROM film WHERE id = ?`, [idFilm]);//cancello il film tramite il suo id dalla tabella film
  await dbRun(`DELETE FROM generi_film WHERE film_id = ?`, [idFilm]); //cancello la relazione con i generi e film nella tabella generi film
  await dbRun(`DELETE FROM cast_film WHERE film_id = ?`, [idFilm]); //cancello la partecipazione degli attori a questo film dalla tabella cast film

  return res.status(200).json({ message: 'Film rimosso correttamente dal DB' });

} catch (err) {
  console.error("Errore durante cancellazione film:", err);
  return res.status(500).json({ message: 'Errore durante la cancellazione del film:' });
}

});



//serve a rimuovere un film dal DB e con esso anche la relazione con i generi e con gli attori
app.post('/api/rimuovi-attore', upload.any(),async (req, res) => {
 // Usiamo req.body negli attributi del film
  const idAttore = Number(req.body.idAttore);

  console.log("id attore ricevuto:",idAttore);
  
try {

  await dbRun(`DELETE FROM attori WHERE id = ?`, [idAttore]);//cancello l'attore dalla tabella film tramite id
  await dbRun(`DELETE FROM cast_film WHERE film_id = ?`, [idAttore]); //cancello la partecipazione di questo attore ai film

  return res.status(200).json({ message: 'attore rimosso correttamente dal DB' });

} catch (err) {
  console.error("Errore durante cancellazione attore:", err);
  return res.status(500).json({ message: 'Errore durante la cancellazione del attore' });
}

});

//serve a restituire una corrispondenza per nome degli attori, che hanno un nome simili a quello che l'utente sta digitando
app.get('/api/corrispondenza-attori', (req, res) => {
   
  //estrapolo la stringa in input inserita dall'utente, e la rendo minuscola
  const stringa = req.query.q?.toString().toLowerCase().trim();
   console.log(`stringa ricevuta: ${stringa}`);

  //rifaccio un controllo anche qui non si sa mai
  if (!stringa || stringa.length < 2) {
    return res.json([]);
  }


const userQuery = req.query.q?.toString().toLowerCase().trim(); // esempio: "george lucas"
const sql = `
  SELECT * 
  FROM attori 
  WHERE LOWER(name) LIKE ? 
  LIMIT 10
`;
const params = [`%${userQuery}%`]; // qui dico che devo cercare dove il nome degli attore contiene in mezzo la string dell'utente userQuery, lo faccio mettendola tra le due %

db.all(sql, params, (err, rows) => {
  if (err) {
    console.error(' Errore DB:', err.message);
    //res.status(500).json({ message: 'Errore durante la ricerca nel db' });
  } else {
    console.log(`${rows.length} risultati per "${userQuery}"`);
    rows.forEach((attore, i) => {
      console.log(`${i + 1}. ${attore.name}`);
    });
    res.json(rows);
  }
});




});



//serve a restituire una corrispondenza per nome degli attori, che hanno un nome simili a quello che l'utente sta digitando
app.get('/api/corrispondenza-registi', (req, res) => {
   
  //estrapolo la stringa in input inserita dall'utente, e la rendo minuscola
  const stringa = req.query.q?.toString().toLowerCase().trim();
   console.log(`stringa ricevuta: ${stringa}`);

  //rifaccio un controllo anche qui non si sa mai
  if (!stringa || stringa.length < 2) {
    return res.json([]);
  }


const userQuery = req.query.q?.toString().toLowerCase().trim(); // esempio: "george lucas"
const sql = `
  SELECT * 
  FROM registi 
  WHERE LOWER(name) LIKE ? 
  LIMIT 10
`;
const params = [`%${userQuery}%`]; // qui dico che devo cercare dove il nome degli attore contiene in mezzo la string dell'utente userQuery, lo faccio mettendola tra le due %

db.all(sql, params, (err, rows) => {
  if (err) {
    console.error(' Errore DB:', err.message);
    //res.status(500).json({ message: 'Errore durante la ricerca nel db' });
  } else {
    console.log(`${rows.length} risultati per "${userQuery}"`);
    rows.forEach((attore, i) => {
      console.log(`${i + 1}. ${attore.name}`);
    });
    res.json(rows);
  }
});




});










//serve a restituire una corrispondenza per nome degli attori, che hanno un nome simili a quello che l'utente sta digitando
app.get('/api/corrispondenza-film', (req, res) => {
   
  //estrapolo la stringa in input inserita dall'utente, e la rendo minuscola
  const stringa = req.query.q?.toString().toLowerCase().trim();
   console.log(`stringa ricevuta: ${stringa}`);

  //rifaccio un controllo anche qui non si sa mai
  if (!stringa || stringa.length < 2) {
    return res.json([]);
  }


const userQuery = req.query.q?.toString().toLowerCase().trim(); // esempio: "george lucas"
const sql = `
  SELECT * 
  FROM film 
  WHERE LOWER(title) LIKE ? 
  LIMIT 10
`;
const params = [`%${userQuery}%`]; // qui dico che devo cercare dove il nome degli attore contiene in mezzo la string dell'utente userQuery, lo faccio mettendola tra le due %

db.all(sql, params, (err, rows) => {
  if (err) {
    console.error(' Errore DB:', err.message);
    //res.status(500).json({ message: 'Errore durante la ricerca nel db' });
  } else {
    console.log(`${rows.length} risultati per "${userQuery}"`);
    rows.forEach((film, i) => {
      console.log(`${i + 1}. ${film.title}`);
    });
    res.json(rows);
  }
});




});




//serve per modificare i dati di un film, tra cui ruoli degli attori, possibili nuovi attori, è possibile anche cancellare attori da quel film
app.post('/api/modifica-attore', upload.any(),async (req, res) => {



  //visualizzo body e files della request dell'utente
console.log('=== DEBUG BODY ===');
console.log(req.body);
console.log('=== DEBUG FILES ===');
console.log(req.files);

 // Usiamo req.body negli attributi del film
  const {name, biography, place_of_birth, birthday,idAdmin } = req.body;
  deathday=req.body.deathday;
  if(deathday=='' || deathday=='null'){
    console.log("avevi ragione");
    deathday=null;
  }
  const idAttore = Number(req.body.idAttore);
  //invece gli array generi e listaAttori sono stringhe json, quindi per trattarli come oggetti dobbiamo prima convertirli con json.parse

  const gender = JSON.parse(req.body.gender);
  const listaFilm = [];
//ovviamente essendo listaAttori una serie di oggetti dobbiamo ciclare tale lista e convertire ogni stringa in json, con anche la rispettiva imagine profilo che verrà caricata in attore.profileImageFile
for (let i = 0; i < req.body.film.length; i++) {
  const film = JSON.parse(req.body.film[i]);
  listaFilm.push(film);
}
  //estrapolo l'immagine del film dall'attributo poster path
  //ma ora devo creare una stringa del tipo img1-1344165456.jpg
  //tale stringa viene salvata nel DB nel campo poster_path del film
  //così quando dal sito voglio accedere a tale immagine ho un percorso file come quello che avevo per tmdb, solo che sta volta il server è questo
  //infatti devo prima salvare questa immagine in una cartella qui nel server che chiamo uploads
  //però prima di caricarla usando: fs.promises.rename(poster_Image.path, path.join('uploads', posterFileName)); faccio tutti i controlli al film ed agli attori
  //intanto ora però genero la variabile del tipo img1-1344165456.jpg

const profile_Image = req.files.find(f => f.fieldname === 'profile_path');
let profileFileName = null;
let fileNameSolo=null;

if (profile_Image) {
  // es: salva come "img1-1344165456.jpg"
      console.log(`sostiuisco immagine film: ${profile_Image.originalname}`);

  const nomeBase = path.parse(profile_Image.originalname).name; // es: "img1"
  const estensione = path.extname(profile_Image.originalname);  // es: ".jpg"
 fileNameSolo = `${nomeBase}-${Date.now()}${estensione}`;
 profileFileName = `attori_img/${fileNameSolo}`;//questo sarà il nome del path che verrà salvato nel db del tipo film_img/img1-574545.jpg, così nel sito creo una sola funzione getImage che mi vale sia per attori che per film
console.log(`ottenendo: ${profileFileName}`);
}
else{
  profileFileName=req.body.profile_path;
   console.log(`non ho sostituito immagine film: ${profileFileName}`);
}




    console.log(`idAttore: ${idAttore}`);
  console.log(`name: ${name}`);
  console.log(`biography: ${biography}`);
  console.log(`place_of_birth: ${place_of_birth}`);
  console.log(`birthday: ${birthday}`);
  console.log(`deathday: ${deathday}`);
  console.log(`gender: ${gender}`);
  if(profile_Image){
 console.log(`poster_Image: ${profile_Image.originalname}`);
  }
  else{
     console.log(`poster_Image non caricata: ${profileFileName}`);
  }
 
  
 //visualizzo i dati dei film
listaFilm.forEach((film, index) => {
  console.log(` film ${index}:`);
  console.log(`id: ${film.id}`);
  console.log(`titolo: ${film.title}`);
  console.log(`ruolo: ${film.character_name}`);
});




//prima di modificare i dati nel db dobbiamo verificare che:
//-il titolo che stiamo inserendo sia uguale ad un altro film già esistente
//-l'attore che stiamo aggiungendo che non risulta esistente non esista, verifichiamo nome, e data nascita


//prima finisco tutti i controlli e poi faccio il caricamento, perchè non mi va di caricare dati nel db se poi capitano alcuni non validi.
//quindi solo se TUTTI i dati sono corretti e validi allora procedo al corretto caricamento nel db


//questa è una funzione async, così che posso fare le query al server ed aspettare che finiscano perchè quando la richiamo faccio aspettare con await
//tale funzione mi ritorna true se i controlli sono andati a buon fine altrimenti false
async function verificaPrimaDiInserire() {

  let erroreAttoreEsistente = false;

  // Verifica attore
  const attore = await dbAll(
    `SELECT * 
    FROM attori 
    WHERE LOWER(name) = ? AND birthday= ? AND id != ?`, //ovviamente deve essere diverso da se stesso quindi escludo il film con l'id attuale dal controllo
    [name.toLowerCase(),birthday,idAttore]
  );
  if (attore.length > 0) erroreAttoreEsistente = true;

  // controlliamo gli esiti dei controlli
  if (erroreAttoreEsistente) {
    console.log(" ERRORE:Attore già esistente");
    res.status(409).json({ message: 'Attore già esistente' });
  }
  else{
      return true;
  }
  
}

const esitoControlli= await verificaPrimaDiInserire();

//se i controlli sono andati a buon fine inizio il caricamento nel db
if(esitoControlli){

//adesso dobbiamo andare a caricare i dati nel db considerando che:
//i dati film verranno caricati nella tabella film
//i dati attore, se già non esiste, verrà caricato nella tabella attore
//per ogni genere selezionato, bisogna caricare nella tabella GENERI_FILM, L'id del film che stiamo aggiungendo con associato l'id del genere
//per ogni attore in lista attori, dobbiamo caricare nella tabella cast_film, l'id di tale attore, l'id del film ed il ruolo che ha interpretato


//carico l'attore
 try {

  if(profile_Image){//carico l'immagine copertina nella cartella uploads solo se è stata caricata dall'utente e non è quell di default
  console.log("DEBUG poster_Image:", profile_Image);
  await fs.promises.writeFile(path.join('uploads/attori_img', fileNameSolo),profile_Image.buffer);//carico l'immagine copertina nella cartella uploads
}




await dbRun(
  `UPDATE attori
   SET name = ?, 
       biography = ?, 
       birthday = ?, 
       deathday = ?, 
       gender = ?, 
       place_of_birth = ?, 
       profile_path = ?,
       id_amministratore =?
   WHERE id = ?`,
  [
    name,
    biography || null,
    birthday || null,
    deathday || null, // es. "img1-545464546.jpg"
    gender || null,
    place_of_birth || null,
    profileFileName ||null,
    idAdmin, // id del film che stiamo aggiornando
    idAttore
  ]
);
console.log("attore aggiornato correttamente");

} catch (err) {
  console.error("Errore durante aggiornamento attore:", err);
  return res.status(500).json({ message: 'Errore durante il caricamento del attore nel DB' });
}


//tabella cast_film
//adesso dobbiamo caricare per ogni film , la tabella cast_film, con l'id dell'attore e l'id del film ed il ruolo
//elimino tutti i record dalla tabella cast_film dove c'è l'id di tale film, poi li ricarico
try {
  
  await dbRun(`DELETE FROM cast_film WHERE attore_id = ?`, [idAttore]);

//quando ha finito ricarico tutti quelli che sono stati passati attualmente , quindi comprese modifiche (aggiunte e cancellazioni)

for(const film of listaFilm){
   await dbRun(
      `INSERT OR IGNORE INTO cast_film (film_id, attore_id, character_name) VALUES (?, ?, ?)`,
      [film.id, idAttore, film.character_name]
    );

    console.log(`Cast inserito: film ${film.title}, ruolo '${film.character_name}'`);
}


} catch (err) {
  console.error("Errore durante aggiornamento cast:", err);
  return res.status(500).json({ message: 'Errore durante il caricamento del cast nel DB' });
}





  res.status(201).json({ message: 'Attore modificato con successo' });
}

    
   

});



//serve ad ggiungere o rimuovere il film tra i preferiti
app.post('/api/aggiungi-rimuovi-preferiti', upload.any(),async (req, res) => {
const idFilm = Number(req.body.idFilm);
const idUtente = Number(req.body.idUtente);
const preferito=req.body.preferito;

//in base se ricevo true o false dal sito, lo tramuto in numero dato che nel database serve sotto forma di 0 e 1
preferitoNum=-1;
if(preferito){
  preferitoNum=1;
}
else{
  preferitoNum=0;
}



try {
  




  await dbRun(
  `INSERT INTO utente_film (film_id, utente_id, preferiti) VALUES (?, ?, ?)
   ON CONFLICT(film_id, utente_id)
   DO UPDATE SET
   preferiti = excluded.preferiti;`,
  [idFilm, idUtente, preferitoNum]
);
 console.error("Film aggiunto o rimosso correttamente tra i preferiti ");
return res.status(200).json({ message: 'aggiunto o rimosso correttamente tra i preferiti ' });
} catch (err) {
  console.error("Errore durante l'inserimento tra i preferiti ", err);
  return res.status(500).json({ message: 'Errore durante l"inserimento tra i preferiti ' });
}


});

//serve per controllare se un film è tra i preferiti o no
app.post('/api/controlla-preferiti', upload.any(),async (req, res) => {
const idFilm = Number(req.body.idFilm);
const idUtente = Number(req.body.idUtente);


try {
    const row = await dbGet(
      `SELECT preferiti FROM utente_film WHERE film_id = ? AND utente_id = ?`,
      [idFilm, idUtente]
    );

    if (row && row.preferiti === 1) {
      return res.json({ preferito: true });
    } else {
      return res.json({ preferito: false });
    }

  } catch (err) {
    console.error("Errore durante il controllo del preferito", err);
    return res.status(500).json({ message: "Errore nel DB" });
  }


});



//serve ad ggiungere o rimuovere il film tra i preferiti
app.post('/api/aggiungi-rimuovi-valutazione', upload.any(),async (req, res) => {
const idFilm = Number(req.body.idFilm);
const idUtente = Number(req.body.idUtente);
valutazione=Number(req.body.valutazione);

if(valutazione==0){
  valutazione=null;
}

valutazione_vecchia=null;
vote_average=-1;
vote_count=-1;
nuovaMediaVoti=-1;


try {
  





  //prima di caricare la valutazione devo capire se l'utente aveva già caricato una valutazione
  //perchè se lo aveva fatto non devo aggiornare il count del numero valutazioni del film, perchè la valutazione è sempre una viene solo modificata
  //se invece aveva valutato ed ora sta annullando il voto, devo invece modificare la media e decrementare il numero di valutazioni del film
row = await dbGet(
      `SELECT valutazione FROM utente_film WHERE utente_id=? AND film_id=?`,
      [idUtente,idFilm]
    );
//quindi in valutazione_vecchia abbiamo un valore numerico se l'utente aveva già votato, ed invece un valore null se il record esiste(perchè magari aveva messo il film tra i preferiti) ma non ha votato
//oppure se non esiste proprio il record sarà di tipo undefiend, quindi lo controllo con if(!valutazione_vecchia)    
valutazione_vecchia=row?.valutazione;
console.log("vatulazione passata",valutazione);
console.log("valutazione_vecchia",valutazione_vecchia);



//se la valutazione inserita è diversa da zero vuol dire che l'utente sta valutando con un numero tra 1 e 10 il film
//quindi procedo a caricare la valutazione ed aggiornare la media voto


//inseriamo nella tabella utente_film la valutazione dell'utente per quel film
//se il record ancora non esiste lo crea, altrmenti fa update
  await dbRun(
  `INSERT INTO utente_film (film_id, utente_id, valutazione) VALUES (?, ?, ?) 
   ON CONFLICT(film_id, utente_id)
   DO UPDATE SET
   valutazione = excluded.valutazione;`,
  [idFilm, idUtente, valutazione]
);

//ora dobbiamo modificare la valutazione del film nel suo campo vote_average perchè dobbiamo modificare la sua valutazione media ed in più dobbiamo incrementare il vote_count di quel film 
//prendiamo il vote count ed il vote_average
console.log("film con id di cui valutare:",idFilm);
  row = await dbGet(
      `SELECT vote_average, vote_count FROM film WHERE id=?`,
      [idFilm]
    );
    vote_average=row?.vote_average;
    vote_count=row?.vote_count;
   
//ricalcolo la nuova media voto per il film

//se la valutazione che aveva fin ora l'utente era null, vuol dire che non aveva mai votato, quindi aumentiamo il numero voti del film
//se invece la valutazione corrente è !=null vuol dire che già aveva votato, quindi il suo voto è già considerato nel vote_count, non devo quindi incrementarlo
//in oltre se valutazione è null vuol dire che sto cancellando, quindi andrò a modificare la media e poi decremento count


//se sto inserendo un nuovo voto:
if((valutazione_vecchia==null || !valutazione_vecchia ) && valutazione){
  console.log("CARICANDO VOTO NUOVO");
vote_average=((vote_average * vote_count) + valutazione) / (vote_count + 1);
vote_average = Math.round(vote_average * 100) / 100; //serve per prendere solo 2 cifre decimali
vote_count++; //incremento il numero di voti
}

//sto modificando un voto 
if((valutazione_vecchia!=null || valutazione_vecchia ) && valutazione){
  console.log("MODIFICANDO VOTO ESISTENTE");
vote_average = ((vote_average * vote_count) - valutazione_vecchia + valutazione) / vote_count;
vote_average = Math.round(vote_average * 100) / 100;//serve per prendere solo 2 cifre decimali
}

//sto cancellando un voto
if((valutazione_vecchia!=null || valutazione_vecchia ) && !valutazione){
  console.log("CANCELLANDO VOTO ESISTENTE");
vote_average=((vote_average * vote_count) - valutazione) / (vote_count - 1);
vote_average = Math.round(vote_average * 100) / 100;//serve per prendere solo 2 cifre decimali
vote_count--; //decremento il numero di voti
}






//aggiorno i valori vote_average e vote_count del film
await dbRun(
  `UPDATE film
   SET  
       vote_count = ?, 
       vote_average = ?
   WHERE id = ?`,
  [
   vote_count,vote_average,idFilm
  ]
);





 console.log("Film valutato correttamente ");
return res.status(200).json({ message: 'aggiunto o rimosso correttamente tra i preferiti ' });
} catch (err) {
  console.error("Errore durante l'inserimento tra i preferiti ", err);
  return res.status(500).json({ message: 'Errore durante l"inserimento tra i preferiti ' });
}


}

);



//serve per controllare se un film è tra i preferiti o no
app.post('/api/controlla-valutazione', upload.any(),async (req, res) => {
const idFilm = Number(req.body.idFilm);
const idUtente = Number(req.body.idUtente);


try {
    const row = await dbGet(
      `SELECT valutazione FROM utente_film WHERE film_id = ? AND utente_id = ?`,
      [idFilm, idUtente]
    );
    return res.json(row?.valutazione);

   
  } catch (err) {
    console.error("Errore durante il controllo della valutazione", err);
    return res.status(500).json({ message: "Errore nel DB" });
  }


});


app.listen(PORT,IP,() => {
  console.log(`Server in ascolto su http://${IP}:${PORT}`);
});

