# Cinepedia

**Cinepedia** è un’app web/mobile il cui scopo è la consultazione di un catalogo di film e informazioni relative agli attori che vi recitano.Offre diverse funzionalità per gli utenti e per gli amministratori

La piattaforma supporta tre ruoli:
-  guest (utente non autenticato)
-  user
-  admin

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

### Film e Attori
  - visualizzare dettagli di tutti i film e di tutti gli attori che vi recitano
  - fare ricerche mirate di un titolo di un film o di una persona (attore o regista)
  - modificare,aggiungere e rimuovere film e attori (solo admin)
  - aggiungere film tra i preferiti (solo utente autenticato)
  - valutare un film (solo utente autenticato)
  - visualizzare il trailer youtube (se disponibile) del film, vendendo reindirizzati in una pagina youtube
    
---

###  Service utilizzati
- **AuthService**: si occupa dell'autenticazione dell'utente nel sito e delle operazioni di modifica dati dell'utente, del reset della password  e della registrazione
- **ConfirmDialogComponent**: popup di diversi tipi che avvisano l'utente durante alcune operazioni
- **GetImageService**: si occupa di ritornare correttamente le immagini di attori,registi e film, foto profilo utente prese da TMDB oppure dal nostro backend
- **FilmService**: si occupa di fare richieste get e post verso il backend riguardo film, attori e registi
- **ServerStatutService**:si occupa di verificare lo stato del server, ogni 10 secondi fa un ping al backend, se non gli ritorna una risposta porta l'utente alla pagina 'server-offline' dove viene avvisato di tale evento

---

