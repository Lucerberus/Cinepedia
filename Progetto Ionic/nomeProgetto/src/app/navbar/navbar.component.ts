import { Component, EventEmitter, OnInit, Output, } from '@angular/core';
import { IonAvatar,IonButtons,IonIcon,IonSearchbar,AlertController,IonContent,IonLabel ,IonSelect ,IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle,IonCardContent,IonItem,IonButton,IonInput, IonTextarea,IonSelectOption  } from '@ionic/angular/standalone';
import { Router ,RouterModule,NavigationEnd} from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { DialogService } from '../services/dialog.service';
import { environment } from 'src/environments/environment';
import{GetImageService}from 'src/app/services/get-image.service';
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [IonAvatar,RouterModule,IonButtons,IonSearchbar,IonIcon,IonContent, IonSelect ,IonHeader,IonLabel,CommonModule, FormsModule, RouterModule,IonTitle, IonToolbar,IonCard, IonCardHeader, IonCardTitle,IonCardContent,IonItem,NavbarComponent,IonButton,IonInput, IonTextarea ,IonSelectOption]
})
export class NavbarComponent  implements OnInit {
  //currentRoute la uso per capire la rotta corrente in cui ci troviamo, così che posso modificare la visualizzazione della navbar in base alla pagina in cui viene aperta
  //infatti voglio che il ricerca film non sia visualizzabile per le pagine con le funzionalità degli admin come modifica-film, carica film ecc...
currentRoute: string = '';
tendinaAccount = false;
tendinaGestioneDB=false;
tendinaGeneri=false;
username=this.auth.getUsername();
ruoloUtente=this.auth.getRole();
user_profile_path=this.auth.getProfileImage();
private nomeFilmSubject = new Subject<string>();
film_selezionato=false;
film_cercato='';
suggerimentiFilm: any[] = [];
suggerimentiAttori: any[] = [];
mostraSuggerimenti = false;
menuMobileAperto = false;





  
 
  

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
  { id: 10749, nome: 'Romantici' },  // tradotto da "Romance"
  { id: 878, nome: 'Fantascienza' },
  { id: 10770, nome: 'Film TV' },     // "televisione film" reso più naturale
  { id: 53, nome: 'Thriller' },
  { id: 10752, nome: 'Guerra' },
  { id: 37, nome: 'Western' }
];







  constructor(private imageService:GetImageService,private dialogService: DialogService,private http: HttpClient,private router: Router,private auth: AuthService) {

 this.nomeFilmSubject
    .pipe(debounceTime(300)) // aspetta 300ms di non scrittura
    .subscribe((query) => {
      this.cercaFilm(query);
    });

//ad ogni cambio di rotta, la navbar se ne accorge
//imposto in currentRoute la rotta in cui mi trovo per far si che la navbar cambi in base alla pagina in qui mi trovo
//poi ricalcolo username e ruolo utente, così da aggiornare subito i dati ad ogni cambio rotta(perchè per esempio dopo il login, rimanevano i dati come prima)
 this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.urlAfterRedirects;
  this.username = this.auth.getUsername();
  this.ruoloUtente = this.auth.getRole();
  this.user_profile_path=this.auth.getProfileImage();

  //resetto alcune variabili, così quando cambio rotta la navbar sulla rotta precedente si ripristina
  this.tendinaAccount = false;
this.tendinaGestioneDB=false;
this.tendinaGeneri=false;
this.mostraSuggerimenti = false;
this.menuMobileAperto = false;

    });


   }

//qui apro e chiudo il menù a tendina nella versione mobile

MenuMobile() {
  this.menuMobileAperto = ! this.menuMobileAperto;
  this.tendinaGestioneDB=false;
  this.tendinaGeneri=false;
}


apriMenuMobile() {
  this.menuMobileAperto = true;
}

chiudiMenuMobile() {
  this.menuMobileAperto = false;
}





vaiAGestioneAccount(){
  //controllo prima se non è guest
  if(!(this.ruoloUtente=='guest')){
      this.router.navigate(['/account']);
  }
  else{
    //se è guest visualizzo il messaggio che dice che deve accedere
    this.dialogService.apriAvviso({messaggio:'Per usufruire di tale funzionalità devi effettuare l\'accesso',testoConferma:'Accedi',soloConferma:false})
.then(risposta => {
    //se l'utente clicca accedi lo riporto al login
    if (risposta){
    this.router.navigate(['/login']);
    }  
  });
  }
}

vaiAFilmPreferiti(){
   //controllo prima se non è guest
  if(!(this.ruoloUtente=='guest')){
      //codice che porta a gestione account
      this.router.navigate(['/film-preferiti']);
  }
  else{
    //se è guest visualizzo il messaggio che dice che deve accedere
    this.dialogService.apriAvviso({messaggio:'Per usufruire di tale funzionalità devi effettuare l\'accesso',testoConferma:'Accedi',soloConferma:false})
.then(risposta => {
    //se l'utente clicca accedi lo riporto al login
    if (risposta){
    this.router.navigate(['/login']);
    }  
  });
  }

}
vaiAGenere(idGenere:number){
 this.router.navigate(['/generi-film', idGenere]);
}



  attivaTendinaAccount() {
    this.tendinaAccount = !this.tendinaAccount;
    this.tendinaGestioneDB=false;
  }


attivaTendinaGeneri(){
this.tendinaGeneri=!this.tendinaGeneri;
}

attivaTendinaGestioneDatabase(){
this.tendinaGestioneDB=!this.tendinaGestioneDB;
}

logout(){
  this.auth.logout();
  //se sono in una pagina per admin oppure in gestione account, oppure in film preferiti allora posso aggiornare tranquillamente la pagina
  //ma se invece sono in una di queste, quando faccio il logout devo andare direttamente alla pagina di home
  if( !(this.currentRoute.includes('/carica-film') || this.currentRoute.includes('/modifica-film') || this.currentRoute.includes('/account') || this.currentRoute.includes('/rimuovi-film')|| this.currentRoute.includes('/modifica-attore')|| this.currentRoute.includes('/rimuovi-attore') || this.currentRoute.includes('/login') || this.currentRoute.includes('/registrazione') || this.currentRoute.includes('/modifica-credenziali') || this.currentRoute.includes('/account') ||  this.currentRoute.includes('/film-preferiti'))){
   window.location.reload()//ricarico la pagina
  }
  else{
    this.router.navigate(['/home']);
  }
 


}
login(){
 

   this.router.navigate(['/login']);
  // window.location.reload()//ricarico la pagina

}


  ngOnInit() {
     document.addEventListener('click', this.chiudiSuggerimentiEsterni);

    

  }

  ngOnDestroy() {
  document.removeEventListener('click', this.chiudiSuggerimentiEsterni);
}



  VisibleRicercaFilm_Generi(): boolean {
    // non visualizzo la barra di ricerca film nelle pagine dove modifico, carico elimino attori e film
    return !(this.currentRoute.includes('/conferma-email')||this.currentRoute.includes('/reset-password')||this.currentRoute.includes('/richiedi-recupera-password')||this.currentRoute.includes('/carica-film') || this.currentRoute.includes('/modifica-film') || this.currentRoute.includes('/account') || this.currentRoute.includes('/rimuovi-film')|| this.currentRoute.includes('/modifica-attore')|| this.currentRoute.includes('/rimuovi-attore') || this.currentRoute.includes('/login') || this.currentRoute.includes('/registrazione') || this.currentRoute.includes('/modifica-credenziali'));
  }



onInputNomeFilm(event: Event) {
  const valore = (event.target as HTMLInputElement).value;
  this.nomeFilmSubject.next(valore);
  this.mostraSuggerimenti=true;
}

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

    this.http.get<any[]>(`${environment.IP}/api/corrispondenza-attori?q=${encodeURIComponent(query.trim())}`)
    .subscribe(risultato => {
      this.suggerimentiAttori = risultato;//carico l'array suggerimentiAttori con gli oggetti attore corrispondenti
    });

    this.http.get<any[]>(`${environment.IP}/api/corrispondenza-registi?q=${encodeURIComponent(query.trim())}`)
    .subscribe(risultato => {
      this.suggerimentiAttori.push(...risultato); //carico l'array suggerimentiAttori con gli oggetti registi trovati
    });
    
}

vaiARicercaFilm(){
  
  if (this.film_cercato && this.film_cercato.length > 1) {
    this.mostraSuggerimenti=false;
    const dati = {
      listaFilm: this.suggerimentiFilm,
      listaAttori: this.suggerimentiAttori,
      nomeCercato: this.film_cercato
    };

    if (this.router.url === '/ricerca-attori-film') {
      // Se sono già sulla pagina, aggiorna lo stato con i valori nuovi
      history.replaceState(dati, '', this.router.url);
      // e notifichiamo la pagina
      window.dispatchEvent(new Event('aggiorna-ricerca'));
    } else {
      //altrimenti andiamo normalmente alla pagina passandogli come stato i dati delle corrispondenze ottenute
      this.router.navigate(['/ricerca-attori-film'], { state: dati });
    }
  }

}

selezionaSuggerimentoFilm(film: any) {
  this.resetSearch();//resetto veriabili
  console.log('film cliccato con :', film.id);
  this.router.navigate(['/film',  film.id]);

}

selezionaSuggerimentoAttore(attore: any) {
  this.resetSearch();//resetto veriabili
  console.log('attore cliccato con id:', attore.id);
  this.router.navigate(['/attore',  attore.id]);

}
//quando clicco la x che compare quando scrivo, resetta tutte le variabili ed imposta mostraSuggerimenti a false così si chiude la tendina
resetSearch() {
  this.film_cercato = '';
  this.suggerimentiFilm = [];
  this.suggerimentiAttori = [];
  this.mostraSuggerimenti = false;
}

//serve a chiudere la tendina quando con il mouse clicco ovunque al di fuori della navbar-searchbar-wrapper, cioè fuori dalla barra di ricerca
chiudiSuggerimentiEsterni = (event: MouseEvent) => {
  
  const target = event.target as HTMLElement;
  const dentroSearchbar = target.closest('.navbar-searchbar-wrapper');
  if (!dentroSearchbar) {
   
    this.mostraSuggerimenti = false;
    this.suggerimentiFilm = [];
    this.suggerimentiAttori = [];
    
  }
};





getImage(path: string | ArrayBuffer | null | undefined): string {

 return this.imageService.getImage1(path);

}

}