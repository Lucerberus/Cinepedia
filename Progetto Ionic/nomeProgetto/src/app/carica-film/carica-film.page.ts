import { Component, OnInit ,ViewChildren,ElementRef ,QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController,IonContent,IonLabel ,IonSelect ,IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle,IonCardContent,IonItem,IonButton,IonInput, IonTextarea,IonSelectOption  } from '@ionic/angular/standalone';
import { NavbarComponent } from '../navbar/navbar.component';
import { AuthService } from '../services/auth.service';
import { FilmService } from '../services/film.service';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../dialogs/\confirm-dialog/confirm-dialog.component';
import { Router } from '@angular/router';
import { DialogService } from '../services/dialog.service';
import { environment } from 'src/environments/environment';
import{GetImageService}from 'src/app/services/get-image.service';
//interfaccia attore che uso per caricare i dati degli attori, ogni attore sarà un oggetto , quindi avrò una lista di oggetti attore che invierò poi al server
export interface Attore {
  name: string;
  biography: string;
  character_name:string;
  place_of_birth: string;
  birthday: string;
  deathday: string;
  gender:number;
  profile_path?: string | ArrayBuffer | null;
  profile_image: FormData;
  esistente:boolean;
}

@Component({
  selector: 'app-carica-film',
  templateUrl: './carica-film.page.html',
  styleUrls: ['./carica-film.page.scss'],
  standalone: true,
  imports: [IonContent, IonSelect ,IonHeader,IonLabel, RouterModule,IonTitle, IonToolbar, CommonModule, FormsModule,IonCard, IonCardHeader, IonCardTitle,IonCardContent,IonItem,NavbarComponent,IonButton,IonInput, IonTextarea ,IonSelectOption]
})



export class CaricaFilmPage implements OnInit {
  @ViewChildren('scrollContainer') scrollContainers!: QueryList<ElementRef<HTMLDivElement>>;

pagina_aperta=false;
successo=false;
//richimamo una guard che mi controlla se sto provando a cambiare rotta
  //questo perchè con  window.addEventListener('beforeunload', this.avvisoModificheNonSalvate); prendo gli eventi di ricarica della pagina ma non prendevo il cambio di rotta
  //invce così prendo anche i cambi di rotta e chiedo conferma di uscita per non predere le modifiche richiamando la dialog service che ho già creato
  canDeactivate(): Promise<boolean> {
    if (!this.pagina_aperta || this.successo) {
      return Promise.resolve(true);
    }
    return this.dialogService.apriConfermaAnnulla();
  }



private nomeAttoreSubject = new Subject<string>();
private nomeRegistaSubject = new Subject<string>();
suggerimentiAttori: any[] = [];
suggerimentiRegisti: any[] = [];

  constructor(private imageService:GetImageService ,private dialogService: DialogService,private dialog: MatDialog,private alertController: AlertController,private auth: AuthService,private filmService: FilmService,private http: HttpClient,private router: Router) { 

//nomteAttoreSubject è un oggetto di tipo subject<string> , in questo caso ci inseriamo il testo che l'utente digita, cioè il nome dell'attore
//voglio fare in modo che la ricerca non parta subito, altrimenti per ogni lettera digitata viene fatta una richiesta instantanea al server
//voglio invece che se tipo devo scrivere jhon, succede che appena inizio a scrivere, e continuo a farlo non fa la ricerca, ma non appena smetto di scrivere, dopo 300ms invio la richiesta al server che mi restituisce le corrispondenze
//questa cosa la faccio con debounceTime, che quindi poi richiama cercaAttori, funzione scritta più sotto nel codice
this.nomeAttoreSubject
    .pipe(debounceTime(300)) // aspetta 300ms di non scrittura
    .subscribe((query) => {
      this.cercaAttori(query);
    });

    this.nomeRegistaSubject
    .pipe(debounceTime(300)) // aspetta 300ms di non scrittura
    .subscribe((query) => {
      this.cercaRegisti(query);
    });

  }

  ngOnInit() {
    //lo uso per controllare quando l'utente prova ad aggiornare la pagina, mostro un avviso di conferma per evitare che l'utente perda le modifiche
     window.addEventListener('beforeunload', this.avvisoModificheNonSalvate);
  }
  ngOnDestroy() {
  window.removeEventListener('beforeunload', this.avvisoModificheNonSalvate);
}

avvisoModificheNonSalvate(event: BeforeUnloadEvent) {
  event.preventDefault(); // Alcuni browser lo ignorano, ma serve
  event.returnValue = ''; //  Stringa vuota: mostra popup nativo
}

//resetto i dati e le variabili ogni volta che viene aperta la pagina anche quando lo faccio tramite le route
 ionViewWillEnter() {
  this.successo=false;
  this.pagina_aperta=true;
  this.registaEsistenteSelezionato=false;
  // Reset dati film
  this.title = '';
  this.overview = '';
  this.vote_average = '';
  this.durata = '';
  this.idRegista=-1;
  this.vote_count = '';
  this.release_date = '';
  this.poster_path = null;
  this.poster_Image = new FormData();
  this.generiSelezionati = [];
  this.previewImageFilm = null;
  this.regista='';

  // Reset dati attore corrente
  this.resetattoreCorrente();

  // Reset lista attori
  this.listaAttori = [];

  // Reset suggerimenti
  this.suggerimentiAttori = [];
  this.suggerimentiRegisti = [];

  // Reset flag errori film
  this.erroreTitolo = false;
  this.erroreDescrizione = false;
  this.erroreValutazione = false;
  this.erroreNumeroVoti = false;
  this.erroreDataUscita = false;
  this.errorePoster = false;
  this.erroreGeneri = false;
  this.erroreAttori = false;
  this.erroreDurata=false;
  this.erroreRegista=false;

  // Reset flag errori attori
  this.erroreDataNascita = false;
  this.erroreDataMorte = false;
  this.erroreNome = false;
  this.erroreLuogoNascita = false;
  this.erroreBiografia = false;
  this.erroreGenere = false;
  this.erroreRuolo = false;

  // Reset modifiche attore
  this.mostraFormAggiungiAttore = false;
  this.modificaAttiva = false;
  this.indexAttoreCorrente = -1;
  this.campoBloccato = false;
}




//apre la finestrina di conferma gestita da "confirm-dialog.components"
apriConfermaAnnulla(): void {

// Conferma uscita
this.dialogService.apriConfermaAnnulla().then(risposta => {
  if (risposta) window.location.reload();
});

}

//conferma
apriConferma(): void {

// Conferma caricamento del film 
this.dialogService.apriConferma('Sei sicuro di voler aggiungere il film "'+this.title+'" al DataBase?', 'Aggiungi film')
  .then(risposta => {
    if (risposta)  this.aggiungiFilm();
  });

}






//dati film
title = '';
overview='';
vote_average = '';
durata = '';
idRegista=-1;
vote_count='';
release_date='';
poster_path: string | ArrayBuffer | null = null;
poster_Image = new FormData();//oggetto di tipo FormData che contiene la copertina del film che invierò al server
generiSelezionati: number[] = []; // Array che contiene l'id dei generi del film selezionati dall'utente 
regista='';
//id dell'amministratore che sta caricando il film
idAdmin=this.auth.getIdUtente();
registaEsistenteSelezionato=false;

//l'oggetto di tipo attore, queste solo le variabili che riempio e che seguono la struttura della interface di sopra
attoreCorrente: Attore = {
  name: '',
  biography: '',
  character_name:'',//character_name dell'attore in quel film
  place_of_birth: '',
  birthday:'',
  deathday: '',
  gender:-1,
  profile_path:null,
  profile_image: new FormData(), //conterrà l'oggetto FormData che mi serve per inviare l'immagine
  esistente:false
};


generi = [
  { id: 28, nome: 'Azione' },
  { id: 12, nome: 'Avventura' },
  { id: 16, nome: 'Animazione' },
  { id: 35, nome: 'Commedia' },
  { id: 80, nome: 'Crime' },
  { id: 99, nome: 'Documentario' },
  { id: 18, nome: 'Dramma' },
  { id: 10751, nome: 'Famiglia' },
  { id: 14, nome: 'Fantasy' },
  { id: 36, nome: 'Storia' },
  { id: 27, nome: 'Horror' },
  { id: 10402, nome: 'Musica' },
  { id: 9648, nome: 'Mistero' },
  { id: 10749, nome: 'Romantici' },  
  { id: 878, nome: 'Fantascienza' },
  { id: 10770, nome: 'Film TV' },     
  { id: 53, nome: 'Thriller' },
  { id: 10752, nome: 'Guerra' },
  { id: 37, nome: 'Western' }
];





//variabili flag per errori

//film
erroreTitolo=false;
erroreDescrizione=false;
erroreValutazione=false;
erroreNumeroVoti=false;
erroreDataUscita=false;
errorePoster=false;
erroreGeneri=false;
erroreAttori=false;//se provo a caricare un film senza attori
erroreDurata=false;
erroreRegista=false;
//attori
erroreDataNascita=false;
erroreDataMorte=false;
erroreNome=false;
erroreLuogoNascita=false;
erroreBiografia=false;
erroreGenere=false;
erroreRuolo=false;



listaAttori: Attore[] = []; //lista che contiene tutti gli attori


//id_amministratore=auth.getid da implementare 

  //due stringe che mi servono per visualizzare l'anteprima della copertina film e della foto profilo attore rispettivamente
  previewImageFilm: string | ArrayBuffer | null = null;
  previewImageAttore: string | ArrayBuffer | null = null;

 

onImageSelected(event: Event, tipo: 'film' | 'attore') {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
   

    reader.onload = () => {
      if (tipo === 'film') {
        this.previewImageFilm = reader.result;
        this.poster_path = reader.result;
        this.poster_Image.set('image', file);//imposto l'immagine copertina nella posterimage, se ne esisteva una la sovrasrive perchè sto usando set
      } else {
        this.previewImageAttore = reader.result;
        this.attoreCorrente.profile_path = reader.result;//lo salvo nell'attore corrente
        this.attoreCorrente.profile_image.set('image',file);//imposto l'immagine foto profilo nella profile_image dell'attore corente, se ne esisteva una la sovrasrive perchè sto usando set
      }
    };

    reader.readAsDataURL(file);
  }
}




aggiungiFilm(){

 console.log(this.generiSelezionati);
  console.log(this.vote_average);
  console.log(this.vote_count);
  
for (const [key, value] of (this.poster_Image as any).entries()) {
  if (value instanceof File) {
    console.log(' File trovato nella chiave:', key);
    console.log(' Nome:', value.name);
    console.log(' Tipo:', value.type);
    console.log(' Dimensione:', value.size, 'byte');
  } else {
    console.log(' Campo:', key, '=>', value);
  }
}


  //alert(this.idAdmin);


if(this.poster_Image==null || this.poster_path==null){
this.errorePoster=true;
return;
}
else{
this.errorePoster=false;
}

if(this.title==''){
this.erroreTitolo=true;
return;
}else{
this.erroreTitolo=false;
}

if(this.overview==''){
this.erroreDescrizione=true;
return;
}else{
this.erroreDescrizione=false;
}
if(!this.regista|| this.regista=='' || !this.registaEsistenteSelezionato){
this.erroreRegista=true;
return;
}
else{
  this.erroreRegista=false;
}


const durata = parseFloat(this.durata);
if(isNaN(durata) || durata <= 0){
this.erroreDurata=true;
return;
}else{
this.erroreDurata=false;
}


const voto = parseFloat(this.vote_average);
if(isNaN(voto) || voto < 0 || voto > 10){
this.erroreValutazione=true;
return;
}else{
this.erroreValutazione=false;
}

const votocount = parseFloat(this.vote_count);
if(isNaN(voto)  || votocount<0){
this.erroreNumeroVoti=true;
return;
}else{
this.erroreNumeroVoti=false;
}


if(voto>0 && (votocount==0 || isNaN(votocount) )){
this.erroreNumeroVoti=true;
return;
}else{
this.erroreNumeroVoti=false;
}

if(this.generiSelezionati.length==0){
  this.erroreGeneri=true;
  return;
}else{
   this.erroreGeneri=false;
}
if(this.listaAttori.length==0){
  this.erroreAttori=true;
  return;
}
else{
  this.erroreAttori=false;
}


if(!this.dataValidator(this.release_date) || this.release_date=='' ){
this.erroreDataUscita=true;
return;
}else{
this.erroreDataUscita=false;
}


//se sono arrivato qui vuol dire che ho superato tutti i controlli e che posso inviare al server i dati del film e degli attori
//per farlo però impacchetto tutti i dati in un oggetto FormData che già abbiamo usato per le immagini
//questo perchè ho provato ad inviare tutto singolarmente, ma il server mi ha risposto con un errore dicendo che il payload era troppo grande.

//creo il formdata da inviare:
const formData = new FormData();
formData.append('title', this.title);
formData.append('overview', this.overview);
formData.append('vote_average', this.vote_average);
formData.append('durata', this.durata);
formData.append('regista', this.idRegista.toString());//invio l'id del regista da aggiungere nel campo regista del film caricato
formData.append('vote_count', this.vote_count);
formData.append('release_date', this.release_date);
formData.append('idAdmin', this.idAdmin.toString());

formData.append('poster_path', this.poster_Image.get('image') as File);

// generiSelezionati: JSON stringify
formData.append('generiSelezionati', JSON.stringify(this.generiSelezionati));

// listaAttori: solo dati testuali + 1 file per attore
this.listaAttori.forEach((attore, index) => {
  formData.append(`attori[${index}]`, JSON.stringify({
    name: attore.name,
    biography: attore.biography,
    character_name: attore.character_name,
    place_of_birth: attore.place_of_birth,
    birthday: attore.birthday,
    deathday: attore.deathday,
    gender: attore.gender,
    profile_path:attore.profile_path,
    esistente:attore.esistente
  }));

  //foto profilo attore
  const file = attore.profile_image.get('image');
  if (file) {
    formData.append(`attoriImage[${index}]`, file as File);
  }
});

 this.filmService.caricaFilm(formData).subscribe({
    //se la risposta è senza errore 
    next: (res) => {
      this.successo=true;
      //in caso di successo visualizzo il messaggio di successo inviato dal server, appena l'utente clicca ok l'utente viene riportato alla pagina di home
      const messaggioSuccesso = res?.message || 'Film caricato!';
      // Conferma caricamento del film 
    this.dialogService.apriAvviso({messaggio:messaggioSuccesso, titolo:'Successo!'}).then(risposta => {
    if (risposta){
      
       window.removeEventListener('beforeunload', this.avvisoModificheNonSalvate); //disabilito l'evento listener che mi chiedeva conferma prima di riaggiornare la pagina, tanto se sono qui è perchè l'utente ha correttamente effettuato l'operazione
    this.router.navigate(['/home']);
    }  
  });

    },
    error: (err) => {
      //in caso di errore apro un avviso con il messaggio di errore che il server mi sta inviando
      const messaggioErrore = err.error?.message || 'Errore sconosciuto';
     this.dialogService.apriAvviso({messaggio:messaggioErrore, titolo:'Errore!'});
       

  }
  });











}


aggiungiAttore(){

//iniziamo una serie di controlli dei dati in input



if(this.attoreCorrente.name==''){
this.erroreNome=true;
return;
}else{
this.erroreNome=false;
}


if(this.attoreCorrente.place_of_birth==''){
this.erroreLuogoNascita=true;
return;
}else{
this.erroreLuogoNascita=false;
}

if(!this.dataValidator(this.attoreCorrente.birthday) || this.attoreCorrente.birthday==''){
this.erroreDataNascita=true;
return;
}
else{
  this.erroreDataNascita=false;
}

if(!this.dataValidator(this.attoreCorrente.deathday)){
this.erroreDataMorte=true;
return;
}else{
  this.erroreDataMorte=false;
}


if(this.attoreCorrente.biography==''){
this.erroreBiografia=true;
return;
}else{
this.erroreBiografia=false;
}

if (this.attoreCorrente.gender == -1) {
  this.erroreGenere = true;
  return;
} else {
  this.erroreGenere = false;
}

if(this.attoreCorrente.character_name==''){
this.erroreRuolo=true;
return;
}else{
this.erroreRuolo=false;
}



//se il codice arriva qui vuol dire che ha superato tutti i controlli poichè altrimenti in caso di un errore tra quelli sopra, farebbe return

//se è attiva la modifica non devo aggiungere l'elemento nella lista attori ma devo modificarlo
if(this.modificaAttiva){
if (this.indexAttoreCorrente !== -1) {//controllo che ho un corretto valore di index


for (const [key, value] of (this.attoreCorrente.profile_image as any).entries()) {
  if (value instanceof File) {
    console.log("PROFILO ATTORE:")
    console.log(' File trovato nella chiave:', key);
    console.log(' Nome:', value.name);
    console.log(' Tipo:', value.type);
    console.log(' Dimensione:', value.size, 'byte');
  } else {
    console.log(' Campo:', key, '=>', value);
  }
}


    const attoreModificato: Attore = {
  ...this.attoreCorrente,
  profile_image: new FormData()
};

for (const [key, value] of (this.attoreCorrente.profile_image as any).entries()) {
  attoreModificato.profile_image.append(key, value);
}

this.listaAttori[this.indexAttoreCorrente] = attoreModificato;


//resetto la variabile che blocca le modifiche ai dati dell'attore quando l'attore è un attore esistente
this.campoBloccato=false;

     //resetto valori di flag e dati che non servono più
     this.indexAttoreCorrente=-1
     this.modificaAttiva=false;
       //resetto i dati dell'attore corrente così pulisco il form di caricamento
    this.resetattoreCorrente();
    //chiudo il form per caricare un attore
    this.FormAggiungiAttore();
}
}
//altrimenti l'attore è nuovo e quindi lo aggiungo
else{
  for (const [key, value] of (this.attoreCorrente.profile_image as any).entries()) {
  if (value instanceof File) {
    console.log("PROFILO ATTORE:")
    console.log(' File trovato nella chiave:', key);
    console.log(' Nome:', value.name);
    console.log(' Tipo:', value.type);
    console.log(' Dimensione:', value.size, 'byte');
  } else {
    console.log(' Campo:', key, '=>', value);
  }
}

//devo caricare l'attore che l'utente ha aggiunto nell'array di attori, per conservarne i dati di tutti prima dell'invio al server

  //facendo push carico in listaAttori l'oggetto attoreCorrente con i dati attuali
  //metto i ... perchè così carico nell'array una copia di attoreCorrente, dato che dopo l'utente può aggiungere altri attori e quindi modificare attoreCorrente
  //se non mettessi ... ci caricherei il riferimento all'oggetto e quindi modificando attoreCorrente si modificherebbe anche nell'array

  //in oltre devo caricare l'oggetto formData in maniera separata poichè tale oggetto se passato come copia, passiamo il riferimento a tale oggetto e quindi avremo il riferimento ad un unico indirizzo di memoria
  //questo comporta che tutti gli attori poi avranno la stessa immagine profilo

  const nuovoAttore: Attore = {
  ...this.attoreCorrente,
  profile_image: new FormData()
};

// Copia i contenuti del FormData (immagine inclusa)
for (const [key, value] of (this.attoreCorrente.profile_image as any).entries()) {
  nuovoAttore.profile_image.append(key, value);
}

this.listaAttori.push(nuovoAttore);

//resetto la variabile che blocca le modifiche ai dati dell'attore quando l'attore è un attore esistente
this.campoBloccato=false;

 //resetto i dati dell'attore corrente così pulisco il form di caricamento
 this.resetattoreCorrente();

 //chiudo il form per caricare un attore
  this.FormAggiungiAttore();
 console.log(this.listaAttori);
}
}





mostraFormAggiungiAttore = false;
FormAggiungiAttore() {
  this.mostraFormAggiungiAttore =!this.mostraFormAggiungiAttore ;
}

modificaAttiva=false;//uso questa variabile flag per indicare quando la modifica è attiva così al posto del pulsante aggiungi attore, c'è modifica attore
indexAttoreCorrente: number = -1; //variabile in cui salvo la posizione dell'oggetto attore nell'arraylist che voglio modificare, di default è -1
FormModificaAttore(attore:Attore,index:number){
  //verifico se l'attore che voglio modificare è uno esistente o no
  //se esistente blocco le modifiche ai campi nome,biografia... resta attivo solo ruolo
  //se invece non è esistente abilito le modifiche, perchè vuol dire che lo sto creando ora
if(attore.esistente){
  this.campoBloccato=true;
}  
else{
  this.campoBloccato=false;
}
this.modificaAttiva=true;
this.indexAttoreCorrente=index;
this.caricaattoreCorrente(attore);
this.mostraFormAggiungiAttore =!this.mostraFormAggiungiAttore ;
}
annullaAttore(){
  this.FormAggiungiAttore();
  this.resetattoreCorrente();
  this.campoBloccato=false;
  this.indexAttoreCorrente=-1
  this.modificaAttiva=false;
  this.suggerimentiAttori=[]
}


resetErroreGenere() {
  if (this.attoreCorrente.gender !== -1) {
    this.erroreGenere = false;
  }
}

async RimuoviAttore(index: number) {
  const alert = await this.alertController.create({
    header: 'Conferma',
    message: 'Sei sicuro di voler rimuovere questo attore?',
    buttons: [
      {
        text: 'Annulla',
        role: 'cancel',
        cssClass: 'secondary'
      },
      {
        text: 'Rimuovi',
        handler: () => {
          this.listaAttori.splice(index, 1);
        }
      }
    ]
  });

  await alert.present();
}




caricaattoreCorrente(attore:Attore){
   this.attoreCorrente.name= attore.name,
  this.attoreCorrente.biography= attore.biography,
  this.attoreCorrente.character_name=attore.character_name,
  this.attoreCorrente.place_of_birth= attore.place_of_birth,
  this.attoreCorrente.birthday=attore.birthday,
  this.attoreCorrente.deathday= attore.deathday,
  this.attoreCorrente.gender=attore.gender,
  this.attoreCorrente.profile_path=attore.profile_path
  this.attoreCorrente.profile_image = new FormData();
  this.attoreCorrente.esistente=attore.esistente;
for (const [key, value] of (attore.profile_image as any).entries()) {
  this.attoreCorrente.profile_image.append(key, value);
}
  
}

resetattoreCorrente(){
//resetto i dati attore
  this.attoreCorrente.name= '',
  this.attoreCorrente.biography= '',
  this.attoreCorrente.character_name='',
  this.attoreCorrente.place_of_birth= '',
  this.attoreCorrente.birthday='',
  this.attoreCorrente.deathday= '',
  this.attoreCorrente.gender=-1,
  this.attoreCorrente.profile_path=null
  this.previewImageAttore=null;
  this.attoreCorrente.profile_image = new FormData();
  this.attoreCorrente.esistente=false;

  
}



//qui implementiamo la logica per suggerire attori già presenti in base al nome che l'utente sta inserendo
//nel caso in cui venisse selezionato uno esistente, tutto gli altri campi verranno riempiti con i dati di quell'attore, e diventano non modificabili


//qui prelevo i dati di input che l'utente scrive, quando sta scrivendo nel campo nome attore, e riempie la variabile nomeAttoreSubject, (vedere codice nel costruttore)
onInputNomeAttore(event: Event) {
  const valore = (event.target as HTMLInputElement).value;
  this.nomeAttoreSubject.next(valore);
}

//qui prelevo i dati di input che l'utente scrive, quando sta scrivendo nel campo nome attore, e riempie la variabile nomeAttoreSubject, (vedere codice nel costruttore)
onInputNomeRegista(event: Event) {
  const valore = (event.target as HTMLInputElement).value;
  this.nomeRegistaSubject.next(valore);
}

//questa è la funzione che manda la richiesta al server, viene chiamata dopo 300ms che l'utente smette di scrivere e riceve in query, la stringa che  l'utente ha inserito e che deve essere inviata al server
cercaAttori(query: string) {
  //qui controllo che la stringa non sia vuota e che non sia più piccola di 2 caratteri, quindi voglio far partire la ricerca minimo con 2 caratteri
  //.trim() permette di eliminare eventuali spazi all'inizio ed alla fine della stringa, per essere sicuri non diano fastidio
  if (!query || query.trim().length < 2) {
    this.suggerimentiAttori = [];
    return;
  }

  //se la stringa è valida allora faccio richiesta al server

  this.http.get<any[]>(`${environment.IP}/api/corrispondenza-attori?q=${encodeURIComponent(query.trim())}`)
    .subscribe(risultato => {
      this.suggerimentiAttori = risultato;//carico l'array suggerimentiAttori con gli oggetti attore corrispondenti
    });
}

//questa è la funzione che manda la richiesta al server, viene chiamata dopo 300ms che l'utente smette di scrivere e riceve in query, la stringa che  l'utente ha inserito e che deve essere inviata al server
cercaRegisti(query: string) {
  //qui controllo che la stringa non sia vuota e che non sia più piccola di 2 caratteri, quindi voglio far partire la ricerca minimo con 2 caratteri
  //.trim() permette di eliminare eventuali spazi all'inizio ed alla fine della stringa, per essere sicuri non diano fastidio
  if (!query || query.trim().length < 2) {
    this.suggerimentiRegisti = [];
    return;
  }

  //se la stringa è valida allora faccio richiesta al server

  this.http.get<any[]>(`${environment.IP}/api/corrispondenza-registi?q=${encodeURIComponent(query.trim())}`)
    .subscribe(risultato => {
      this.suggerimentiRegisti = risultato;//carico l'array suggerimentiAttori con gli oggetti attore corrispondenti
      console.log("suggerimenti registi:",this.suggerimentiRegisti);
      if (this.suggerimentiRegisti.length === 0 || !this.suggerimentiRegisti) {
       this.registaEsistenteSelezionato = false;//così se l'utente scrive nomi a caso che non portano risultati viene impostato a false
       //verrà impostato a true solo quando l'utente clicca nel suggerimento del regista
}
    });
}

campoBloccato=false;//variabile che imposto a true quando 
//quando l'utente clicca su un attore che gli viene suggerito, carico i campi di input con i dati dell'attore selezionato
selezionaSuggerimento(attore: any) {
  this.campoBloccato=true;
  this.attoreCorrente.name = attore.name;
  this.attoreCorrente.biography = attore.biography;
  this.attoreCorrente.place_of_birth = attore.place_of_birth;
  this.attoreCorrente.birthday = attore.birthday;
  this.attoreCorrente.gender = attore.gender;
  this.attoreCorrente.profile_path = attore.profile_path;
  this.attoreCorrente.esistente=true;
  this.suggerimentiAttori = []; // e resetto suggerimentiAttori, così che la tendina non si vede più
}



selezionaSuggerimentoRegisti(regista: any) {
  this.regista = regista.name;
  this.idRegista=regista.id;
  this.registaEsistenteSelezionato=true;
  this.suggerimentiRegisti = []; // e resetto suggerimentiAttori, così che la tendina non si vede più
}




dataValidator(data: string): boolean {
 const pattern = /^$|^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
 //permette stringa vuota oppure una data del tipo aaaa-mm-gg
  return pattern.test(data);
}


scrollLeft(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollBy({ left: -1450, behavior: 'smooth' });
    }
  }

  scrollRight(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollBy({ left: 1450, behavior: 'smooth' });
    }
  }


getPreviewImage(attore?: Attore): string {
  return this.imageService.getPreviewImage(attore,this.attoreCorrente,this.previewImageAttore);
}


getImage(path: string | ArrayBuffer | null | undefined): string {

return this.imageService.getImage1(path);

  
}




}
