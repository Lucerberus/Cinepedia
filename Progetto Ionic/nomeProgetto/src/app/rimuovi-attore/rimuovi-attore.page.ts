import { Component, OnInit,ViewChildren,ElementRef ,QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton,IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle,IonCardContent } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { FilmService } from '../services/film.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { debounceTime } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../dialogs/\confirm-dialog/confirm-dialog.component';
import { DialogService } from '../services/dialog.service';
import { environment } from 'src/environments/environment';
import { CanComponentDeactivate } from '../guards/pending-changes.guard';
import{GetImageService}from 'src/app/services/get-image.service';
@Component({
  selector: 'app-rimuovi-attore',
  templateUrl: './rimuovi-attore.page.html',
  styleUrls: ['./rimuovi-attore.page.scss'],
  standalone: true,
  imports: [IonButton,IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,IonCard, IonCardHeader, IonCardTitle,IonCardContent,RouterModule,NavbarComponent ]
})
export class RimuoviAttorePage implements OnInit {
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
  // Reset attore selezionato
  this.attore_selezionato = false;
  this.attore_cercato = '';
  this.idAttoreSelezionato = -1;
  this.mostraSuggerimenti = false;
  this.suggerimentiAttore = [];

  // Reset dati attore
  this.name = '';
  this.biography = '';
  this.place_of_birth = '';
  this.birthday = '';
  this.deathday = '';
  this.profile_path = null;
  this.gender = '';

  // Reset lista film
  this.films = [];

  // Reset flag apertura e ID passati
  this.apertoTramiteHome = false;
  this.id_attore_passato = null;
  this.id_film_passato = null;

  // Reset oggetto attore
  this.attore = null;


  this.id_attore_passato = +this.route.snapshot.paramMap.get('idAttore')!;
     this.id_film_passato=+this.route.snapshot.paramMap.get('idFilm')!;
    if(this.id_attore_passato){
      this.apertoTramiteHome=true;
       this.filmService.getAttoriDettagli(this.id_attore_passato).subscribe({
    next: (data) => {
      console.log('Dati ricefvuti:', data);
      this.attore = data[0];//metto data[0] perchè movie non sarà un array quindi non passo data che è un array di oggetti, ma devo passare l'unico film, che è in data[0]
      
    this.idAttoreSelezionato=this.attore.id;
  this.attore_selezionato=true;
  this.name= this.attore.name;
  this.biography= this.attore.biography;
  this.place_of_birth = this.attore.place_of_birth;
  this.birthday = this.attore.birthday;
  this.deathday = this.attore.deathday;
  this.profile_path = this.attore.profile_path;
  switch (Number(this.attore.gender)) {
  case 0:
    this.gender='Non specificato';
    break;
  case 1:
        this.gender='Femmina';

    break;
    case 2:
        this.gender='Maschio';

    break;
    case 3:
        this.gender='Non-binary';
    break;
  default:
    
    break;
}
    },
    error: (err) => {
      console.error('Errore nel caricamento del film:', err);
    }
  });
  

//ora per capire quali attori hanno partecipato al film e di quali genere è composto devo mandare altre due richieste al server

  //richiedo i film che ha fatto quel attore
  this.filmService.getAttoriFilms(this.id_attore_passato).subscribe({
    next: (data) => {
      console.log('Dati ricevuti:', data);
      this.films = data;
    },
    error: (err) => {
      console.error('Errore nel caricamento del film:', err);
    }
  });


    }



}

successo=false;
  films:any;
  //dati film
name = '';
biography='';
place_of_birth = '';
birthday='';
deathday='';
profile_path: string | ArrayBuffer | null = null;
gender="";
id_attore_passato:any=null;
id_film_passato:any=null;
attore:any;
apertoTramiteHome=false;
  private nomeAttoreSubject = new Subject<string>();
  @ViewChildren('scrollContainer') scrollContainers!: QueryList<ElementRef<HTMLDivElement>>;

 constructor(private imageService:GetImageService,private dialogService: DialogService,private dialog: MatDialog,private http: HttpClient,private filmService: FilmService,private route: ActivatedRoute, private router: Router) { 
     this.nomeAttoreSubject
        .pipe(debounceTime(300)) // aspetta 300ms di non scrittura
        .subscribe((query) => {
          this.cercaAttore(query);
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



attore_selezionato=false;
attore_cercato='';
idAttoreSelezionato=-1;//mi serve per salvare l'id del attore che ho selezionato da modificare, così poi quando devo applicare le modifiche il server sa quale film voglio modificare
mostraSuggerimenti = false;

onInputNomeFilm(event: Event) {
  const valore = (event.target as HTMLInputElement).value;
  this.nomeAttoreSubject.next(valore);
}

suggerimentiAttore: any[] = [];


//questa è la funzione che manda la richiesta al server, viene chiamata dopo 300ms che l'utente smette di scrivere e riceve in query, la stringa che  l'utente ha inserito e che deve essere inviata al server
cercaAttore(query: string) {
  //qui controllo che la stringa non sia vuota e che non sia più piccola di 2 caratteri, quindi voglio far partire la ricerca minimo con 2 caratteri
  //.trim() permette di eliminare eventuali spazi all'inizio ed alla fine della stringa, per essere sicuri non diano fastidio
  if (!query || query.trim().length < 2) {
    this.suggerimentiAttore = [];
    return;
  }

  //se la stringa è valida allora faccio richiesta al server
  
  this.http.get<any[]>(`${environment.IP}/api/corrispondenza-attori?q=${encodeURIComponent(query.trim())}`)
    .subscribe(risultato => {
      this.suggerimentiAttore = risultato;//carico l'array suggerimentiAttori con gli oggetti attore corrispondenti
    });

    
}


//quando clicco la x che compare quando scrivo, resetta tutte le variabili ed imposta mostraSuggerimenti a false così si chiude la tendina
resetSearch() {
  this.attore_cercato = '';
  this.suggerimentiAttore = [];
  this.mostraSuggerimenti = false;
}





selezionaSuggerimentoAttore(attore: any) {
  this.idAttoreSelezionato=attore.id;
  this.attore_selezionato=true;
  this.name= attore.name;
  this.biography= attore.biography;
  this.place_of_birth = attore.place_of_birth;
  this.birthday = attore.birthday;
  this.deathday = attore.deathday;
  this.profile_path = attore.profile_path;
   switch (Number(attore.gender)) {
  case 0:
    this.gender='Non specificato';
    break;
  case 1:
        this.gender='Femmina';

    break;
    case 2:
        this.gender='Maschio';

    break;
    case 3:
        this.gender='Non-binary';
    break;
  default:
    
    break;
}

 


//ora per capire quali attori hanno partecipato al film e di quali genere è composto devo mandare altre due richieste al server

 

  //richiedo i film che ha fatto quel attore
  this.filmService.getAttoriFilms(this.idAttoreSelezionato).subscribe({
    next: (data) => {
      console.log('Dati ricevuti:', data);
      this.films = data;
    },
    error: (err) => {
      console.error('Errore nel caricamento del film:', err);
    }
  });


  this.suggerimentiAttore= []; // e resetto suggerimentiFilm, così che la tendina non si vede più
  this.attore_cercato='';//resetto anche film cercato
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
        this.router.navigate(['/film', this.id_film_passato]);//riporto l'utente alla pagina del film che stava visitando da cui poi ha cliccato modifica su un attore di quel film

      }
    }
});

}

//conferma
apriConferma(): void {

// Conferma caricamento del film 
this.dialogService.apriConferma('Sei sicuro di voler eliminare l\'attore "'+this.name+'" dal DataBase?', 'Elimina Attore')
  .then(risposta => {
    if (risposta) this.rimuoviAttore();
  });

}







rimuoviAttore(){

//richiamo la finestra dialog di conferma che chiede la confermadell'utente, se ritorna true, vuol dire che ha confermato la rimozione del film, altrimenti no

this.filmService.rimuoviAttore(this.idAttoreSelezionato).subscribe({
    //se la risposta è senza errore 
    next: (res) => {
      this.successo=true;
      //in caso di successo visualizzo il messaggio di successo inviato dal server, appena l'utente clicca ok ricarico la pagina così può continuarea fare altre modifiche
      const messaggioSuccesso = res?.message || 'Attore eliminato con successo dal DataBase!';
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










}
