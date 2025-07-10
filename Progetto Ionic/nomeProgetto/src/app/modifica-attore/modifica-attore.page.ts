// modelli
export interface Film {
  id: number;
  title: string;
  character_name: string;
  poster_path?: string | ArrayBuffer | null;
}

// componenti Angular/Ionic
import {
  Component, OnInit, ViewChildren, ElementRef, QueryList,ViewChild
} from '@angular/core';
import {
  IonSearchbar, IonContent, IonSelect, IonHeader, IonLabel, IonTitle,
  IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem,
  IonButton, IonInput, IonTextarea, IonSelectOption, AlertController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../dialogs/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../services/auth.service';
import { FilmService } from '../services/film.service';
import { DialogService } from '../services/dialog.service';
import { environment } from 'src/environments/environment';
import{GetImageService}from 'src/app/services/get-image.service';
@Component({
  selector: 'app-modifica-attore',
  templateUrl: './modifica-attore.page.html',
  styleUrls: ['./modifica-attore.page.scss'],
  standalone: true,
  imports: [
    IonSearchbar, IonContent, IonSelect, IonHeader, IonLabel, RouterModule,
    IonTitle, IonToolbar, CommonModule, FormsModule, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonItem, NavbarComponent, IonButton,
    IonInput, IonTextarea, IonSelectOption
  ]
})
export class ModificaAttorePage implements OnInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

//richimamo una guard che mi controlla se sto provando a cambiare rotta
  //questo perchè con  window.addEventListener('beforeunload', this.avvisoModificheNonSalvate); prendo gli eventi di ricarica della pagina ma non prendevo il cambio di rotta
  //invce così prendo anche i cambi di rotta e chiedo conferma di uscita per non predere le modifiche richiamando la dialog service che ho già creato
  canDeactivate(): Promise<boolean> {
    if (!this.attore_selezionato || this.successo) {
      return Promise.resolve(true);
    }
    return this.dialogService.apriConfermaAnnulla();
  }

ionViewWillEnter() {
  this.successo=false;
  // Reset attore e form
  this.attore_cercato = '';
  this.suggerimentiAttori = [];
  this.attore_selezionato = false;
  this.mostraSuggerimenti = false;
 this.nomeAttoreSubject.next('');
this.nomeFilmSubject.next('');
  this.idAttoreSelezionato = -1;
  this.previewImageAttore = null;
  this.attoreCorrente = {
    name: '',
    biography: '',
    place_of_birth: '',
    birthday: '',
    deathday: '',
    gender: -1,
    profile_path: "",
    profile_image: new FormData()
  };

  // Reset film
  this.filmCorrente = {
    id: -1,
    title: '',
    character_name: '',
    poster_path: ''
  };
  this.listaFilm = [];
  this.filmDisponibili = [];
  this.suggerimentiFilm = [];

  // Reset stato route
  this.apertoTramiteHome = false;
  this.id_attore_passato = null;
  this.id_film_passato = null;
  this.attore = null;

  // Reset errori
  this.erroreNome = false;
  this.erroreLuogoNascita = false;
  this.erroreDataNascita = false;
  this.erroreDataMorte = false;
  this.erroreBiografia = false;
  this.erroreGenere = false;
  this.erroreProfilePath = false;
  this.erroreRuolo = false;
  this.erroreTitolo = false;

  // Reset flag gestione
  this.mostraFormAggiungiFilm = false;
  this.modificaAttiva = false;
  this.indexFilmCorrente = -1;
  this.campoBloccato = false;
  this.filmEsistenteSelezionato=false;

  //logica quando richiamo la pagina passando già un attore
  this.id_attore_passato = +this.route.snapshot.paramMap.get('idAttore')!;
          this.id_film_passato=+this.route.snapshot.paramMap.get('idFilm')!;
    if(this.id_attore_passato){
      this.apertoTramiteHome=true;
        this.filmService.getAttoriDettagli(this.id_attore_passato).subscribe({
    next: (data) => {
      console.log('Dati ricevuti:', data);
      this.attore = data[0];//metto data[0] perchè movie non sarà un array quindi non passo data che è un array di oggetti, ma devo passare l'unico film, che è in data[0]
      
       this.idAttoreSelezionato = this.attore.id;
    this.attore_selezionato = true;
    this.attoreCorrente = {
      name: this.attore.name,
      biography: this.attore.biography,
      place_of_birth: this.attore.place_of_birth,
      birthday: this.attore.birthday,
      deathday: this.attore.deathday,
      gender: this.attore.gender,
      profile_path: this.attore.profile_path,
      profile_image: new FormData(),
      
    }
    },
    error: (err) => {
      console.error('Errore nel caricamento del attore:', err);
    }
  });

   //mi prendo tutti i film in cui quel attore ha partecipato

    this.filmService.getAttoriFilms(this.id_attore_passato).subscribe({
      next: (filmData) => {
        this.listaFilm = filmData.map((f: any) => ({
          id: f.id,
          title: f.title,
          character_name: f.character_name,
          poster_path: f.poster_path || null,
        }));
      },
      error: (err) => {
        console.error('Errore caricamento film attore:', err);
      }
    });
    
    }
}

  successo=false;
  attore_cercato = '';
  suggerimentiAttori: any[] = [];
  attore_selezionato = false;
  mostraSuggerimenti = false;
  nomeAttoreSubject = new Subject<string>();
  nomeFilmSubject = new Subject<string>();

  idAttoreSelezionato = -1;
//id dell'amministratore che sta caricando il film
idAdmin=this.auth.getIdUtente();

  attoreCorrente = {
    name: '', 
    biography: '', 
    place_of_birth: '', 
    birthday: '',
    deathday: '', 
    gender: -1, 
    profile_path: "",
    profile_image: new FormData(), 
  };

  filmCorrente: Film = {
    id: -1,
    title: '',
    character_name: '',
    poster_path: "", 
  };

listaFilm: Film[] = [];
filmDisponibili: any[] = [];
suggerimentiFilm:any[] = [];

apertoTramiteHome=false;
id_attore_passato:any=null;
id_film_passato:any=null;
attore:any;


  // immagini
  previewImageAttore: string | ArrayBuffer | null = null;

  // errori form attore
  erroreNome = false;
  erroreLuogoNascita = false;
  erroreDataNascita = false;
  erroreDataMorte = false;
  erroreBiografia = false;
  erroreGenere = false;
  erroreProfilePath = false;
  erroreRuolo = false;

  //errori form film
  erroreTitolo=false

  // gestione form film
  mostraFormAggiungiFilm = false;
  modificaAttiva = false;
  indexFilmCorrente = -1;
  campoBloccato = false;
  filmEsistenteSelezionato=false;

  constructor(private imageService:GetImageService,private route:ActivatedRoute,private dialogService: DialogService,private dialog: MatDialog,private alertController: AlertController,private auth: AuthService,private filmService: FilmService,private http: HttpClient,private router: Router) {
    
    //nomteAttoreSubject è un oggetto di tipo subject<string> , in questo caso ci inseriamo il testo che l'utente digita, cioè il nome dell'attore
//voglio fare in modo che la ricerca non parta subito, altrimenti per ogni lettera digitata viene fatta una richiesta instantanea al server
//voglio invece che se tipo devo scrivere jhon, succede che appena inizio a scrivere, e continuo a farlo non fa la ricerca, ma non appena smetto di scrivere, dopo 300ms invio la richiesta al server che mi restituisce le corrispondenze
//questa cosa la faccio con debounceTime, che quindi poi richiama cercaAttori, funzione scritta più sotto nel codice
    this.nomeAttoreSubject.pipe(debounceTime(300)).subscribe((query) => {
      this.cercaAttori(query);
    });


    this.nomeFilmSubject
    .pipe(debounceTime(300)) // aspetta 300ms di non scrittura
    .subscribe((query) => {
      this.cercaFilm(query);
    });
  }

  ngOnInit() {
          

    window.addEventListener('beforeunload', this.avvisoModificheNonSalvate);
  }

  ngOnDestroy() {
    window.removeEventListener('beforeunload', this.avvisoModificheNonSalvate);
  }

  avvisoModificheNonSalvate(event: BeforeUnloadEvent) {
    event.preventDefault();
    event.returnValue = '';
  }

  onInputNomeAttore(event: Event) {
    const valore = (event.target as HTMLInputElement).value;
    this.nomeAttoreSubject.next(valore);
  }

  onInputNomeFilm(event: Event) {
  const valore = (event.target as HTMLInputElement).value;
  this.nomeFilmSubject.next(valore);
}

  cercaAttori(query: string) {
    if (!query || query.trim().length < 2) {
      this.suggerimentiAttori = [];
      return;
    }

    this.http.get<any[]>(`${environment.IP}/api/corrispondenza-attori?q=${encodeURIComponent(query.trim())}`)
      .subscribe(risultato => {
        this.suggerimentiAttori = risultato;
      });
  }

  cercaFilm(query: string) {
  //qui controllo che la stringa non sia vuota e che non sia più piccola di 2 caratteri, quindi voglio far partire la ricerca minimo con 2 caratteri
  //.trim() permette di eliminare eventuali spazi all'inizio ed alla fine della stringa, per essere sicuri non diano fastidio
  if (!query || query.trim().length < 2) {
    this.suggerimentiFilm = [];
    return;
  }

  //se la stringa è valida allora faccio richiesta al server
  
  this.http.get<any[]>(`${environment.IP}/api/corrispondenza-film?q=${encodeURIComponent(query.trim())}`)
    .subscribe(risultato => {
      this.suggerimentiFilm = risultato;//carico l'array suggerimentiAttori con gli oggetti attore corrispondenti
    });
    
}

  selezionaSuggerimentoAttore(attore: any) {
    this.idAttoreSelezionato = attore.id;
    this.attore_selezionato = true;
    this.attoreCorrente = {
      name: attore.name,
      biography: attore.biography,
      place_of_birth: attore.place_of_birth,
      birthday: attore.birthday,
      deathday: attore.deathday,
      gender: attore.gender,
      profile_path: attore.profile_path,
      profile_image: new FormData(),
      
    };

    this.previewImageAttore = null;
    this.attore_cercato = '';
    this.suggerimentiAttori = [];

    //mi prendo tutti i film in cui quel attore ha partecipato

    this.filmService.getAttoriFilms(this.idAttoreSelezionato).subscribe({
      next: (filmData) => {
        this.listaFilm = filmData.map((f: any) => ({
          id: f.id,
          title: f.title,
          character_name: f.character_name,
          poster_path: f.poster_path || null,
        }));
      },
      error: (err) => {
        console.error('Errore caricamento film attore:', err);
      }
    });
  }

  FormAggiungiFilm() {
    this.mostraFormAggiungiFilm = !this.mostraFormAggiungiFilm;
    this.resetFilmCorrente();
  }

  //quando clicco la x che compare quando scrivo, resetta tutte le variabili ed imposta mostraSuggerimenti a false così si chiude la tendina
resetSearch() {
  this.attore_cercato = '';
  this.suggerimentiAttori = [];
  this.mostraSuggerimenti = false;
}

annullaFilm(){
  this.erroreTitolo=false;
  this.erroreTitolo=false;
  this.resetFilmCorrente();
  this.indexFilmCorrente=-1
  this.modificaAttiva=false;
  this.campoBloccato=false;
  this.filmEsistenteSelezionato=false;
  this.mostraFormAggiungiFilm = !this.mostraFormAggiungiFilm;
  this.suggerimentiFilm=[];
}


modificaAttore( ){



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

if(!this.dataValidator(this.attoreCorrente.birthday) || this.attoreCorrente.birthday=='' || this.attoreCorrente.birthday==null){
this.erroreDataNascita=true;
return;
}
else{
  this.erroreDataNascita=false;
}

if(!this.dataValidator(this.attoreCorrente.deathday) && this.attoreCorrente.deathday!=null){
this.erroreDataMorte=true;
return;
}else{
  this.erroreDataMorte=false;
}


if(this.attoreCorrente.biography=='' || !this.attoreCorrente.biography || this.attoreCorrente.biography=='null'){
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


//se sono arrivato qui vuol dire che ho superato tutti i controlli e che posso inviare al server i dati del film e degli attori
//per farlo però impacchetto tutti i dati in un oggetto FormData che già abbiamo usato per le immagini
//questo perchè ho provato ad inviare tutto singolarmente, ma il server mi ha risposto con un errore dicendo che il payload era troppo grande.

//creo il formdata da inviare:
const formData = new FormData();
//alert(this.idAttoreSelezionato.toString());
formData.append('idAttore', this.idAttoreSelezionato.toString());
formData.append('name', this.attoreCorrente.name);
formData.append('biography', this.attoreCorrente.biography);
formData.append('place_of_birth', this.attoreCorrente.place_of_birth);
formData.append('birthday',this.attoreCorrente.birthday);
formData.append('deathday',this.attoreCorrente.deathday?.trim() === '' ? '' : this.attoreCorrente.deathday);
formData.append('idAdmin', this.idAdmin.toString());

//se poster_path è "" vuol dire che l'utente ha caricato una immagine lui la foto profilo dell'attore, modificando quella originale, quindi devo prendere la profile_Image
if (this.attoreCorrente.profile_path==""){
  console.log("immagine caricata",this.attoreCorrente.profile_path);
  formData.append('profile_path', this.attoreCorrente.profile_image.get('image') as File);
}
//se invece non è "" vuol dire che è rimasta quella di default e quindi prendo la poster_path
else{
console.log("immagine di default");
formData.append('profile_path',this.attoreCorrente.profile_path as string);
}

// genere selezionato: JSON stringify, lo converto in oggetto
formData.append('gender', JSON.stringify(this.attoreCorrente.gender));

// listaAttori: solo dati testuali + 1 file per attore
this.listaFilm.forEach((film, index) => {
  formData.append(`film[${index}]`, JSON.stringify({
    id:film.id,
    title: film.title,
    character_name: film.character_name,
    
  }));

  
});



 this.filmService.modificaAttore(formData).subscribe({
    //se la risposta è senza errore 
    next: (res) => {
       this.successo=true;
      //in caso di successo visualizzo il messaggio di successo inviato dal server, appena l'utente clicca ok ricarico la pagina così può continuarea fare altre modifiche
      const messaggioSuccesso = res?.message || 'Attore modificato con successo!';
 this.dialogService.apriAvviso({messaggio:messaggioSuccesso, titolo:'Successo!'}).then(risposta => {
    if (risposta){
      
       window.removeEventListener('beforeunload', this.avvisoModificheNonSalvate); //disabilito l'evento listener che mi chiedeva conferma prima di riaggiornare la pagina, tanto se sono qui è perchè l'utente ha correttamente effettuato l'operazione
       if(!this.apertoTramiteHome) {
        window.location.reload();//ricarico la pagina
      }
      else{
    this.router.navigate(['/film', this.id_film_passato]);//riporto l'utente alla pagina del film che stava visitando da cui poi ha cliccato modifica su un attore di quel film
      }
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



  aggiungiFilm() {

    if (this.filmCorrente.title === '' || this.filmEsistenteSelezionato==false) {
      this.erroreTitolo = true;
      return;
    }
    else{
       this.erroreTitolo = false;
    }

    if (this.filmCorrente.character_name === '') {
      this.erroreRuolo = true;
      return;
    }
    else{
    this.erroreRuolo = false;
    }

    const nuovoFilm: Film = {
      ...this.filmCorrente,
    
    };

    if (this.modificaAttiva) {
      this.listaFilm[this.indexFilmCorrente] = nuovoFilm;
      this.modificaAttiva = false;
      this.campoBloccato=false;
      this.filmEsistenteSelezionato=false
      this.indexFilmCorrente = -1;
    } else {
      this.campoBloccato=false;
      this.filmEsistenteSelezionato=false
      this.listaFilm.push(nuovoFilm);
    }

    this.FormAggiungiFilm();
  }
 

  FormModificaFilm(film: Film, index: number) {
    this.modificaAttiva = true;
    this.campoBloccato=true;
    this.indexFilmCorrente = index;
    this.filmCorrente = { ...film }; //carico film corrente con i dati del film selezonato
    this.filmEsistenteSelezionato=true;

  
    this.mostraFormAggiungiFilm = true;
  }
  

  async RimuoviFilm(index: number) {
    const alert = await this.alertController.create({
      header: 'Conferma',
      message: 'Sei sicuro di voler rimuovere questo film?',
      buttons: [
        { text: 'Annulla', role: 'cancel', cssClass: 'secondary' },
        {
          text: 'Rimuovi',
          handler: () => {
            this.listaFilm.splice(index, 1);
          }
        }
      ]
    });
    await alert.present();
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.previewImageAttore = reader.result;
        this.attoreCorrente.profile_path = "";
        this.attoreCorrente.profile_image.set('image', file);
      };

      reader.readAsDataURL(file);
    }
  }

  getImageAttore(path: string | ArrayBuffer | null | undefined): string {
   return this.imageService.getImage2(path,this.previewImageAttore);
  }

  getImageFilm(path: string | ArrayBuffer | null | undefined): string {
   return this.imageService.getImage1(path);
  }

  resetFilmCorrente() {
    this.filmCorrente = {
      id: -1,
      title: '',
      character_name: '',
      poster_path: '',
    };
  }

 scrollLeft() {
  if (this.scrollContainer?.nativeElement) {
    this.scrollContainer.nativeElement.scrollBy({ left: -1450, behavior: 'smooth' });
  }
}

scrollRight() {
  if (this.scrollContainer?.nativeElement) {
    this.scrollContainer.nativeElement.scrollBy({ left: 1450, behavior: 'smooth' });
  }
}






//apre la finestrina di conferma gestita da "confirm-dialog.components"
apriConfermaAnnulla(): void {

// Conferma uscita
this.dialogService.apriConfermaAnnulla().then(risposta => {
   if(risposta){
  if(!this.apertoTramiteHome) {
        window.location.reload();//ricarico la pagina
      }
      else{
       this.router.navigate(['/film', this.id_film_passato]);//riporto l'utente alla pagina del film che stava visitando da cui poi ha cliccato modifica su un attore di quel film

      }
    }
});

}

//conferma
apriConferma(): void {

// Conferma caricamento del film 
this.dialogService.apriConferma('Sei sicuro di voler modificare l\' attore "'+this.attoreCorrente.name+'" nel DataBase?', 'Applica Modifica')
  .then(risposta => {
    if (risposta)  this.modificaAttore();
  });

}


selezionaSuggerimentoFilm(film:any){
this.filmEsistenteSelezionato=true;
this.campoBloccato=true;
this.filmCorrente.id=film.id;
this.filmCorrente.title=film.title;
this.filmCorrente.poster_path=film.poster_path;
this.suggerimentiFilm = [];
}

  dataValidator(data: string): boolean {
 const pattern = /^$|^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
 //permette stringa vuota oppure una data del tipo aaaa-mm-gg
  return pattern.test(data);
}
}
