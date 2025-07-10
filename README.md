# 🎬 Cinepedia

**Cinepedia** è un’app mobile per la gestione e la consultazione del patrimonio cinematografico, sviluppata con **Ionic + Angular** per il frontend e **Node.js + Express** con **SQLite** per il backend.

La piattaforma supporta due ruoli:
- 👤 Utente
- 👑 Admin

---

## ✨ Funzionalità principali

### 👥 Gestione Account
- Registrazione e login per utenti e admin
- Modifica credenziali:
  - Email visibile ma non modificabile
  - Username modificabile dopo conferma
  - Modifica password con verifica campi
- Recupero password via email

---

### 🎬 Film
- Aggiunta di nuovi film:
  - Titolo, descrizione, durata, locandina, genere, attori
- Upload e anteprima immagine film (rinomina automatica `nomefile-timestamp.ext`)
- Modifica dei film esistenti
- Visualizzazione elenco film in griglia responsive
- Filtro per genere tramite menu a tendina

---

### 🎭 Attori
- Aggiunta attori con foto profilo
- Modifica dati attore e immagine
- Associazione e rimozione film collegati
- Prevenzione sovrascrittura immagini attori
- Ricerca attori per modifica facilitata

---

### ⚙️ Componenti e Servizi
- **AuthService**: gestione dello stato utente autenticato
- **ConfirmDialogComponent**: popup di conferma riutilizzabile in tutta l’app

---

## 🧰 Stack Tecnologico

| Sezione      | Tecnologia               |
|--------------|--------------------------|
| Frontend     | Ionic 7 + Angular        |
| Backend      | Node.js + Express        |
| Database     | SQLite                   |
| Upload Immagini | Multer (con salvataggio locale) |
| Sicurezza    | JSON Web Token (JWT)     |

---

## 🗂️ Struttura del progetto (semplificata)

