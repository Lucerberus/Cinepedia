

import { Component, OnInit,ViewChildren,ElementRef ,QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton,IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle,IonCardContent } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { FilmService } from '../services/film.service';
import { Router ,NavigationStart } from '@angular/router';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { debounceTime } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../dialogs/\confirm-dialog/confirm-dialog.component';
import { DialogService } from '../services/dialog.service';
import { environment } from 'src/environments/environment';
import{GetImageService}from 'src/app/services/get-image.service';
@Component({
  selector: 'app-rimuovi-film',
  templateUrl: './rimuovi-film.page.html',
  styleUrls: ['./rimuovi-film.page.scss'],
  standalone: true,
  imports: [IonButton,IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,IonCard, IonCardHeader, IonCardTitle,IonCardContent,RouterModule,NavbarComponent ]
})


export class RimuoviFilmPage implements OnInit {

 
  //richimamo una guard che mi controlla se sto provando a cambiare rotta
  //questo perchè con  window.addEventListener('beforeunload', this.avvisoModificheNonSalvate); prendo gli eventi di ricarica della pagina ma non prendevo il cambio di rotta
  //invce così prendo anche i cambi di rotta e chiedo conferma di uscita per non predere le modifiche richiamando la dialog service che ho già creato
  canDeactivate(): Promise<boolean> {
    if (!this.film_selezionato || this.successo) {
      return Promise.resolve(true);
    }
    return this.dialogService.apriConfermaAnnulla();
  }

ionViewWillEnter() {
   this.successo=false;
  // Reset flag e variabili di selezione
  this.film_selezionato = false;
  this.film_cercato = '';
  this.idFilmSelezionato = -1;
  this.mostraSuggerimenti = false;
  this.suggerimentiFilm = [];

  // Reset dati film
  this.title = '';
  this.overview = '';
  this.vote_average = '';
  this.tempo='';
  this.regista='';
  this.vote_count = '';
  this.release_date = '';
  this.poster_path = null;
  this.generiFilm = '';
  this.generiSelezionati = [];

  // Reset oggetti correlati
  this.attori = [];
  this.film = null;

  // Reset parametri route
  this.id_film_passato = null;
  this.apertoTramiteHome = false;

 this.id_film_passato = +this.route.snapshot.paramMap.get('id')!;
console.log("film passato1:",this.id_film_passato);
    if(this.id_film_passato){
      this.apertoTramiteHome=true;
          this.filmService.getFilmsDettagli(this.id_film_passato).subscribe({
    next: (data) => {
      console.log('Dati film ricevuti:', data);
      this.film = data[0];//metto data[0] perchè movie non sarà un array quindi non passo data che è un array di oggetti, ma devo passare l'unico film, che è in data[0]
      
    this.idFilmSelezionato=this.film.id;  
  this.film_selezionato=true;
  this.title= this.film.title;
  this.tempo=this.film.tempo;
  this.overview= this.film.overview;
  this.vote_average = this.film.vote_average;
  this.vote_count = this.film.vote_count;
  this.release_date = this.film.release_date;
  this.poster_path = this.film.poster_path;
   //recupero anche il nome del regista
this.filmService.getRegistiDettagli(this.film.regista).subscribe({
    next: (data) => {
      console.log('Dati ricevuti:', data);
      this.regista = data[0].name;//metto data[0] perchè movie non sarà un array quindi non passo data che è un array di oggetti, ma devo passare l'unico film, che è in data[0]
      console.log("regista",this.regista);
    },
    error: (err) => {
      console.error('Errore nel caricamento del film:', err);
    }
  });
    },
    error: (err) => {
      console.error('Errore nel caricamento del film:', err);
    }
  });
  //richiedo gli attori
  this.filmService.getFilmsAttori(this.id_film_passato).subscribe({
    next: (data) => {
      console.log('Dati ricevuti:', data);
      this.attori = data;
    },
    error: (err) => {
      console.error('Errore nel caricamento del film:', err);
    }
  });


//stessa cosa per i generi

this.filmService.getFilmsGenere(this.id_film_passato).subscribe({
    next: (data) => {
      console.log('Dati ricevuti:', data);
      console.log('Dati ricevuti2:', data.name);
     this.generiSelezionati = data.map((g: { name: number }) => g.name);//Prendo l’array data, e da ogni oggetto prendo il nome che sarebbe il genere
    // creo una stringa separata da virgole, dove inserisco i generi trovati dentro generiSelezionati
      this.generiFilm = this.generiSelezionati.join(', '); 
      
     
    },
    error: (err) => {
      console.error('Errore nel caricamento del film:', err);
    }
  });
    }

}




successo=false;
  attori:any;
  //dati film
title = '';
overview='';
vote_average = '';
tempo='';
regista='';
vote_count='';
release_date='';
poster_path: string | ArrayBuffer | null = null;
generiFilm="";

id_film_passato:any=null;
film:any;
apertoTramiteHome=false;
  private nomeFilmSubject = new Subject<string>();
  @ViewChildren('scrollContainer') scrollContainers!: QueryList<ElementRef<HTMLDivElement>>;
  constructor(private imageService:GetImageService,private dialogService: DialogService,private dialog: MatDialog,private http: HttpClient,private filmService: FilmService,private route: ActivatedRoute, private router: Router) { 
     this.nomeFilmSubject
        .pipe(debounceTime(300)) // aspetta 300ms di non scrittura
        .subscribe((query) => {
          this.cercaFilm(query);
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
//--------------------- TUTTA LOGICA SELEZIONA FILM DA MODIFICARE------------------------------
//funzione che controlla quando l'utente sta cercando il film da modificare nella barra di ricerca
film_selezionato=false;
film_cercato='';
idFilmSelezionato=-1;//mi serve per salvare l'id del film che ho selezionato da modificare, così poi quando devo applicare le modifiche il server sa quale film voglio modificare
mostraSuggerimenti = false;


onInputNomeFilm(event: Event) {
  const valore = (event.target as HTMLInputElement).value;
  this.nomeFilmSubject.next(valore);
}

suggerimentiFilm: any[] = [];

//questa è la funzione che manda la richiesta al server, viene chiamata dopo 300ms che l'utente smette di scrivere e riceve in query, la stringa che  l'utente ha inserito e che deve essere inviata al server
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

//quando clicco la x che compare quando scrivo, resetta tutte le variabili ed imposta mostraSuggerimenti a false così si chiude la tendina
resetSearch() {
  this.film_cercato = '';
  this.suggerimentiFilm = [];
  this.mostraSuggerimenti = false;
}

generiSelezionati: number[] = []; // Array che contiene l'id dei generi del film selezionati dall'utente 
//quando l'utente clicca su un attore che gli viene suggerito, carico i campi di input con i dati dell'attore selezionato
selezionaSuggerimentoFilm(film: any) {
  this.idFilmSelezionato=film.id;
  this.film_selezionato=true;
  this.title= film.title;
  this.tempo=film.tempo;
  this.overview= film.overview;
  this.vote_average = film.vote_average;
  this.vote_count = film.vote_count;
  this.release_date = film.release_date;
  this.poster_path = film.poster_path;
   //recupero anche il nome del regista
this.filmService.getRegistiDettagli(film.regista).subscribe({
    next: (data) => {
      console.log('Dati ricevuti:', data);
      this.regista = data[0].name;//metto data[0] perchè movie non sarà un array quindi non passo data che è un array di oggetti, ma devo passare l'unico film, che è in data[0]
      console.log("regista",this.regista);
    },
    error: (err) => {
      console.error('Errore nel caricamento del film:', err);
    }
  });

//ora per capire quali attori hanno partecipato al film e di quali genere è composto devo mandare altre due richieste al server

 

  //richiedo gli attori
  this.filmService.getFilmsAttori(this.idFilmSelezionato).subscribe({
    next: (data) => {
      console.log('Dati ricevuti:', data);
      this.attori = data;
    },
    error: (err) => {
      console.error('Errore nel caricamento del film:', err);
    }
  });


//stessa cosa per i generi

this.filmService.getFilmsGenere(this.idFilmSelezionato).subscribe({
    next: (data) => {
      console.log('Dati ricevuti:', data);
      console.log('Dati ricevuti2:', data.name);
     this.generiSelezionati = data.map((g: { name: number }) => g.name);//Prendo l’array data, e da ogni oggetto prendo il nome che sarebbe il genere
    // creo una stringa separata da virgole, dove inserisco i generi trovati dentro generiSelezionati
      this.generiFilm = this.generiSelezionati.join(', '); 
      
     
    },
    error: (err) => {
      console.error('Errore nel caricamento del film:', err);
    }
  });


 
  this.suggerimentiFilm= []; // e resetto suggerimentiFilm, così che la tendina non si vede più
  this.film_cercato='';//resetto anche film cercato
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




getImage(path: string | ArrayBuffer | null | undefined): string {
  
return this.imageService.getImage1(path);
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
    this.router.navigate(['/home']);//mi riporto alla home
      }
    }
});

}
//conferma
apriConferma(): void {

// Conferma caricamento del film 
this.dialogService.apriConferma('Sei sicuro di voler eliminare il film "'+this.title+'" dal DataBase?', 'Elimina Film')
  .then(risposta => {
    if (risposta)  this.rimuoviFilm();
  });

}






rimuoviFilm(){


    this.filmService.rimuoviFilm(this.idFilmSelezionato).subscribe({
    //se la risposta è senza errore 
    next: (res) => {
      this.successo=true;
      //in caso di successo visualizzo il messaggio di successo inviato dal server, appena l'utente clicca ok ricarico la pagina così può continuarea fare altre modifiche
      const messaggioSuccesso = res?.message || 'Film eliminato con successo dal DataBase!';
    this.dialogService.apriAvviso({messaggio:messaggioSuccesso, titolo:'Successo!'}).then(risposta => {
    if (risposta){
       window.removeEventListener('beforeunload', this.avvisoModificheNonSalvate); //disabilito l'evento listener che mi chiedeva conferma prima di riaggiornare la pagina, tanto se sono qui è perchè l'utente ha correttamente effettuato l'operazione
     if(!this.apertoTramiteHome) {
        window.location.reload();//ricarico la pagina
      }
      else{
    this.router.navigate(['/home']);//mi riporto alla home
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




















}
