import { Component, OnInit, ViewChildren, ElementRef ,QueryList, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle,IonButton } from '@ionic/angular/standalone';
import { FilmService } from '../services/film.service';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { AuthService } from '../services/auth.service';
import { environment } from 'src/environments/environment';
import{GetImageService}from 'src/app/services/get-image.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle,NavbarComponent,IonButton
  ],

})
export class HomePage implements OnInit {

  //----------------------------------------SEZIONE RICHIEDI FILM + FUNZIONE PER LO SCROLL---------------------------------
  moviesNuoveUscite: any[] = [];
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
moviesPerGenere: { [key: number]: any[] } = {};
  @ViewChildren('scrollContainer') scrollContainers!: QueryList<ElementRef<HTMLDivElement>>;
  constructor(private imageService:GetImageService,private auth: AuthService,private filmService: FilmService, private router: Router) {}

  utenteRuolo:any;
  


  ionViewWillEnter() {

    this.utenteRuolo=this.auth.getRole();
  }

  //questo mi serve per prendere i film, richiamo la funzione getFilms() da filmService
  ngOnInit() {
    
    
      for (const genere of this.generi) {
    this.filmService.getFilmsGeneri(genere.id).subscribe({
      next: (data) => {
        this.moviesPerGenere[genere.id] = data;
      },
      error: (err) => {
        console.error(`Errore nel caricamento dei film per genere ${genere.nome}:`, err);
      }
    });
  }


      
    this.filmService.getFilmsNuoveUscite().subscribe({
      next: (data) => {
        this.moviesNuoveUscite = data;//gli oggetti film vengono caricati nell'array movies
      },
      error: (err) => {
        console.error('Errore nel caricamento dei film:', err);
      }
    });

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
//FUNZIONE CHE TI PORTA ALLA PAGINA DETTAGLI DEI FILM QUANDO VENGONO CLICCATE LE COPERTINE

vaiADettagli(id: number) {
  console.log('Clicked movie with id:', id);
  this.router.navigate(['/film', id]);
}

vaiAModifica(filmID:any){
  console.log("film prima di passarlo",filmID);
this.router.navigate(['/modifica-film', filmID]);
}

vaiARimuovi(filmID:any){
this.router.navigate(['/rimuovi-film', filmID]);
}


getImage(path:string): string {
  

 return this.imageService.getImage1(path);
}


}
