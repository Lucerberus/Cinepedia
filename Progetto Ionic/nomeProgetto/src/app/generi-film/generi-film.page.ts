import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar,IonCard } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { FilmService } from '../services/film.service';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import{GetImageService}from 'src/app/services/get-image.service';
@Component({
  selector: 'app-generi-film',
  templateUrl: './generi-film.page.html',
  styleUrls: ['./generi-film.page.scss'],
  standalone: true,
  imports: [IonContent,IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,IonCard,NavbarComponent]
})
export class GeneriFilmPage implements OnInit {
filmPerGenere: any[] = [];
idGenere:any;

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

  constructor(private imageService:GetImageService,private http: HttpClient, private filmService:FilmService, private route:ActivatedRoute,private router:Router) { }

  ngOnInit() {
    this.idGenere = +this.route.snapshot.paramMap.get('id')!;
  console.log('ID film selezionato:', this.idGenere);
   this.filmService.getFilmsGeneri(this.idGenere).subscribe({
      next: (data) => {
        this.filmPerGenere = data;
      },
      error: (err) => {
        console.error(`Errore nel caricamento dei film per genere`, err);
      }
    });
  }

  
  
getNomeGenere(id: number): string {
  const g = this.generi.find(g => g.id === id);
  return g ? g.nome : 'Sconosciuto';
}

vaiADettagli(id: number) {
  this.router.navigate(['/film', id]);
}

getImage(path:string): string {

  return this.imageService.getImage1(path);
  
}



}
