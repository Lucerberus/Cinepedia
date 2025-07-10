# Cinepedia

**Cinepedia** è un’app web/mobile per la gestione e la consultazione del patrimonio cinematografico, sviluppata con **Ionic + Angular** per il frontend e **Node.js + Express** con **SQLite** per il backend.

La piattaforma supporta due ruoli:
-  Utente
-  Admin

---

##  Funzionalità principali

###  Gestione Account
- Registrazione(con conferma via email) e login per utenti e admin
- Modifica dati:
  - modifica username
  - modifica immagine profilo
  - modifica password 
- Recupero della password via email
- *il server applica una cifratura alle password prima di caricarle nel DB per non lasciarle in chiaro

---

###  Film
- Aggiunta,modifica e rimozione dal DB (admin)
- aggiunta tra i preferiti, valutazione (solo utenti autenticati)
- Visualizzazione elenco film in griglia responsive
- Filtro per genere tramite menu a tendina

---

###  Attori
- Aggiunta attori con foto profilo
- Modifica dati attore e immagine
- Associazione e rimozione film collegati
- Prevenzione sovrascrittura immagini attori
- Ricerca attori per modifica facilitata

---

###  Service utilizzati
- **AuthService**: si occupa dell'autenticazione dell'utente nel sito
- **ConfirmDialogComponent**: popup di diversi che avvisano l'utente durante alcune operazioni
- **GetImageService**: si occupa di ritornare correttamente le immagini di attori,registi e film, foto profilo utente prese da TMDB oppure dal nostro backend
- **FilmService**: si occupa di fare richieste get e post verso il backend riguardo film attori e registi
- **ServerStatutService**:si occupa di verificare lo stato del server, ogni 10 secondi fa un ping al backend, se non gli ritorna una risposta porta l'utente alla pagina 'server-offline' dove viene avvisato di tale evento

---

