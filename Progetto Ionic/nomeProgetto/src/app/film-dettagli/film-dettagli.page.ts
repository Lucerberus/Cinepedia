import { Component, OnInit,ViewChildren,ElementRef ,QueryList ,ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonInput,IonCardHeader, IonCardTitle,IonCardContent, IonButton,IonIcon } from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { FilmService } from '../services/film.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { AuthService } from '../services/auth.service';
import { DialogService } from '../services/dialog.service';
import { environment } from 'src/environments/environment';
import{GetImageService}from 'src/app/services/get-image.service';

@Component({
  selector: 'app-film-dettagli',
  templateUrl: './film-dettagli.page.html',
  styleUrls: ['./film-dettagli.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,IonCard, IonCardHeader,IonInput, IonCardTitle,IonCardContent,IonButton,IonIcon ,RouterModule,NavbarComponent ]
})
export class FilmDettagliPage implements OnInit {
  ruoloUtente=this.auth.getRole();
  id!: number;
  movie: any;
  attori:any;
  regista:any;
  generiSelezionati: number[] = []; // Array che contiene l'id dei generi del film selezionati dall'utente 
  generiFilm="";
  idUtente=this.auth.getIdUtente();
  preferito:boolean=false;
  animazione_cuore:boolean= false;
  valutazione!:number;

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  constructor(private imageService:GetImageService,private dialogService: DialogService,private filmService: FilmService,private route: ActivatedRoute, private router: Router,private auth: AuthService) { }
  


  ngOnInit() {
   
  this.id = +this.route.snapshot.paramMap.get('id')!;
  console.log('ID film selezionato:', this.id);

  this.filmService.getFilmsDettagli(this.id).subscribe({
    next: (data) => {
      console.log('Dati ricevuti:', data);
      this.movie = data[0];//metto data[0] perchè movie non sarà un array quindi non passo data che è un array di oggetti, ma devo passare l'unico film, che è in data[0]
    
    
      this.filmService.getRegistiDettagli(this.movie.regista).subscribe({
    next: (data) => {
      console.log('Dati ricevuti:', data);
      this.regista = data[0];//metto data[0] perchè movie non sarà un array quindi non passo data che è un array di oggetti, ma devo passare l'unico film, che è in data[0]
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
  //prendo i generi del film
  this.filmService.getFilmsGenere(this.id).subscribe({
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

  this.filmService.getFilmsAttori(this.id).subscribe({
    next: (data) => {
      console.log('Dati ricevuti:', data);
      this.attori = data;
    },
    error: (err) => {
      console.error('Errore nel caricamento del film:', err);
    }
  });

  


  //controllo se il film è tra i preferiti o no, imposto la variabile this.preferito al valore ritornano (true o false)
this.filmService.controllaPreferito(this.idUtente,this.id).subscribe({
    //se la risposta è senza errore 
    next: (res) => {
      
     this.preferito = res.preferito;
    // alert(this.preferito);

    },
    error: (err) => {
       alert("errore");
       

  }
  });


  //prendo il valore della valutazione di quel film da parte dell'utente
this.filmService.controllaValutazione(this.idUtente,this.id).subscribe({
    //se la risposta è senza errore 
    next: (res) => {
     if(!res){
      this.valutazione = 0;

     } 
     else{
          this.valutazione = res;
     }
   
    // alert(this.preferito);

    },
    error: (err) => {
       alert("errore");
       

  }
  });
  

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
vaiADettagli(id: number) {
  this.router.navigate(['/attore', id]);  
}

//ti manda al trailer in un altra scheda
vaiATrailer(){
if (this.movie.video) {
    window.open(this.movie.video, '_blank');
  } 
  
}

//this.id è l'id del film corrente, così andando nella pagina modifica attore, quando lui ha finito di modificare, o annulla la modifica dell'attore, verrà riportato automaticamente alla pagina del film che stava guardando
vaiAModifica(attoreID:any){
this.router.navigate(['/modifica-attore', attoreID,this.id]);
}

vaiARimuovi(attoreID:any){
this.router.navigate(['/rimuovi-attore', attoreID,this.id]);
}

//get overview e get data servono quando non abbiamo dati su quell'attributo
getOverview(bio: string | null): string {
  if (!bio || bio=== '' || bio === 'null') {
    return 'Non abbiamo una descrizione per questo film';
  }
  return bio;
}

getData(bio: string | null): string {
  if (!bio || bio=== '' || bio === 'null') {
    return 'Nessun dato';
  }
  return bio;
}

getImage(path:string): string {
  

 return this.imageService.getImage1(path);
}




  

aggiungi_rimuoviPreferiti(){

  //se il ruolo utente è diverso da guest allora consento l'aggiunta ai preferiti
  //altrmenti visualizzo un popup che mi dice di accedere per usufruire della funzionalità
if(!(this.ruoloUtente=='guest')){



      //invio id del film e dell'utente che sta salvando tra i preferiti, e l'inverso di this.preferito, poichè se preferito è true e lo sto cliccando allora lo voglio rimuovere tra i preferiti quindi invio false, e viceversa
  this.filmService.aggiungi_rimuoviPreferiti(this.idUtente,this.id, !this.preferito).subscribe({
    //se la risposta è senza errore 
    next: (res) => {
      //alert("film aggiunto tra i preferiti");
      this.preferito=!this.preferito;

    },
    error: (err) => {
       alert("errore");
       

  }
  });

  this.animazione_cuore = true; //attivo l'animazione
    setTimeout(() => {
      this.animazione_cuore = false;//disattivo l'animazione
    }, 600); // durata dell'animazione bounceUp
    
  }
  else{
        this.dialogService.apriAvviso({messaggio:'Per usufruire di tale funzionalità devi effettuare l\'accesso',testoConferma:'Accedi',soloConferma:false})
.then(risposta => {
    //se l'utente clicca accedi lo riporto al login
    if (risposta){
    this.router.navigate(['/login']);
    }  
  });
  }

}

//la richiamo dove gestisco la selezione delle stelle
aggiungi_rimuoviValutazione(){
     this.filmService.aggiungi_rimuoviValutazione(this.idUtente, this.movie.id,this.valutazione).subscribe({
    //se la risposta è senza errore 
    next: (res) => {
      //alert("film valutato correttamente");
    },
    error: (err) => {
       alert("errore");
  }
  });
}
modificaValutazioneAttiva = false;  //con questa controllo se l'utente vuole modificare la valutazione o no
stars = new Array(5).fill(0); //genero un array da 5 elementi che rappresentano le stelle
hoverValue = -1;//valore temporaneo delle stelle quando ci passiamo con il mouse di sopra
half = false; //valore che indica se siamo alla sinistra della stella oppure alla destra, infatti, se siamo alla sinistra consideriamo la stella a metà, altrimenti piena

//qui decidiamo che stella visualizzare, quindi piena, mezza oppure vuota
getStarIcon(index: number): string {
  //se stiamo passando sopra le stelle con il mouse prende il valore temporaneo hoverValue, altrmenti prendiamo la valuazione salvata nella variabile valutazione
  const value =this.modificaValutazioneAttiva && this.hoverValue >= 0 ? this.hoverValue : this.valutazione;
  //calcola il valore della stella, infatti la stella si posizione 0 nell'array vale 2, quindi (0+1)*2=2
  //invece per esempio se è illuminata fino alla terza stella allora abbiamo 3*2=6 quindi 3 stelle su 5 vale 6 il voto
  const starValue = (index + 1) * 2; 


  //ora devo capire se con il mouse ho riempito per intero la stella oppure no
  //infatti se value è >= di starValue, quindi del valore massimo per quella stella, allora la name dell'icon sarà 'star'
  //che rappresenta la stella piena.Se invece il valore +1 è uguale a starvalue di quella stella allora metà altrimenti se è < è vuota
  // es. voto 7, stella 1 ha starValue 2, quindi piena, stella 2 ha starvalue 4 quindi piena,
  //stella 3 ha star value 6, quindi anche stella 3 è piena.
  //la stella 4 invece ha star value 8, ma il voto è 7, quindi value>=starValue è falsa
  //ma value+1==starValue è vera, vuol dire che la stella 4 si riempie a metà
  //invece le restanti stelle la stella 5 che ha starValue 10, sarà vuota quindi icon name star-outline
  //poichè il voto attuale anche incrementato di 1 sarà < della sua Starvalue, quindi il suo valore massimo
 

  if (value >= starValue) {
    return 'star'; // piena
  } else if (value + 1 === starValue) {
    return 'star-half'; // metà
  } else {
    return 'star-outline'; // vuota
  }
}

onHoverStar(index: number, event: MouseEvent) {
  if(!this.modificaValutazioneAttiva) return; //se la modifica non è attiva ignoriamo l'hover
  this.half = false; // reset
}
//in questa funzione calcoliamo in base al movimento del mouse sulle stelle, il valore di overValue, quindi quello di anteprima

onDetectHalf(event: MouseEvent, index: number) {
  if(!this.modificaValutazioneAttiva) return; //se la modifica non è attiva ritorniamo senza fare nulla

  //con questo otteniamo le coordinate e le dimensioni del box che contiene la stella 
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  //in x salviamo la posizione del mouse dentro la stella
  //infatti event.ClientX ci restituisce la posizione orizzontale del mouse, invece rect.left ci dà la distanza tra il bordo sinistro della stella e quello dello schermo
  const x = event.clientX - rect.left;
  const width = rect.width;//in width salvo la grandezza del box della stella
  //ora calcoliamo se siamo a sinistra della stella o a destra
  //infatti se la posizione x del mouse dentro la stella è < della grandezza diviso due, quindi si trova a sinistra
  //allora this.half vale true, che indica che siamo a sinistra della stella
  //altrimenti vale false
  const halfClicked = x < width / 2;
  this.half = halfClicked;

  //qui calcoliamo il valore di anteprima della stella
  //infatti con index*2 calcoliamo il valore base della stella
  //infatti la stella 1, in posizione 0 ha valore 0 di base, invece la stella 1 di base ha valore 2

  //quindi poi sommiamo 1 se siamo nella metà altrimenti 2 se siamo dopo
  //es. se siamo a sinistra della prima stella, la hovervalue vale 0+1=1, infatti vuol dire che 
  //si riempirà solo la prima stella ed a metà
  //se siamo invece dopo la prima stella ma prima della seconda, allora la prima stella avrà valore 2 che è il suo massimo
  //invece la seconda stella se non l'abbiamo superata o toccata con il mouse sarà vuota
  //facendo questa logica con tutte le stelle, vedremo in anteprima il valore delle stelle
  //questo valore di anteprima poi ciservirà a calcolare una nuova valutazione
  //infatti nella funzione getStarIcon, se hovervalue è >=0 allora prendiamo il suo valore da visualizzare
  //altrimenti prendiamo quello che era salvato in valutazione che inizialmente è -1
  this.hoverValue = index * 2 + (halfClicked ? 1 : 2);
}

//quando il mouse si allontana dal conteiner che contiene le stelle, resetto il valore di anteprima a -1
resetHover() {
 if(this,this.modificaValutazioneAttiva) {
  this.hoverValue = -1;
  this.modificaValutazioneAttiva=false;
 }
 
}

//quando clicco su una stella imposta il valore di valutazione al valore del hoverValue che in quel momento
//sta tenendo conto del valore in antemprima della valutazione
onClickStar(index: number) {

//se il ruolo utente è diverso da guest allora consento l'aggiunta ai preferiti
  //altrmenti visualizzo un popup che mi dice di accedere per usufruire della funzionalità
if(!(this.ruoloUtente=='guest')){

  if(!this.modificaValutazioneAttiva){
    this.modificaValutazioneAttiva=true; //al primo click se la modifica era disattivata la abilitiamo
  }
  //altrimenti se abbiamo cliccato con la modifica attiva allora vogliamo salvare la valutazione
  else{
    this.valutazione = this.hoverValue; //al secondo click confermo la valutazione
    this.aggiungi_rimuoviValutazione(); //richiamo la funzione che modifica la valutazione a quel film da parte dell'utente
    this.modificaValutazioneAttiva = false;//disattivo la modifica attiva


  }
}
else{
     this.dialogService.apriAvviso({messaggio:'Per usufruire di tale funzionalità devi effettuare l\'accesso',testoConferma:'Accedi',soloConferma:false})
.then(risposta => {
    //se l'utente clicca accedi lo riporto al login
    if (risposta){
    this.router.navigate(['/login']);
    }  
  });
}
  
}

annullaValutazione(){
  this.valutazione = 0;
  this.hoverValue = -1;
  this.aggiungi_rimuoviValutazione(); //richiamo la funzione che modifica la valutazione a quel film da parte dell'utente
  this.modificaValutazioneAttiva = false; // se vuoi uscire dalla modalità di modifica

}




}
