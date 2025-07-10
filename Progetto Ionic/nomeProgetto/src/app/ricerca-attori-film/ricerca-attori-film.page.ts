import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar,IonCard,IonButton,IonCardContent } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { FilmService } from '../services/film.service';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { AuthService } from '../services/auth.service';
import{GetImageService}from 'src/app/services/get-image.service';
@Component({
  selector: 'app-ricerca-attori-film',
  templateUrl: './ricerca-attori-film.page.html',
  styleUrls: ['./ricerca-attori-film.page.scss'],
  standalone: true,
  imports: [IonContent,IonCardContent,IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,IonCard,NavbarComponent,IonButton]
})
export class RicercaAttoriFilmPage implements OnInit {

  constructor(private imageService:GetImageService,private http: HttpClient, private filmService:FilmService, private route:ActivatedRoute,private router:Router, private auth:AuthService) { }


risultatiFilm:any[]=[];
risultatiAttori:any[]=[];
nomeCercato:string='';

mostraFilm=true;
mostraAttori=false;



ionViewWillEnter() {
  this.caricaDati();
}

ngOnInit() {
  window.addEventListener('aggiorna-ricerca', () => {
    this.caricaDati();
  });
}


//ricevo gli array di oggetti film e attori
//preferisco inviare gli array di oggetti per evitare di rifare nuovamente la richiesta di corrispondenza al server
//dato che viene fatta già mentre scriviamo il nome nel campo di ricerca
caricaDati() {
  this.mostraFilm=true;
this.mostraAttori=false;
  const state = window.history.state;

  this.risultatiFilm = state['listaFilm'] || [];
  this.risultatiAttori = state['listaAttori'] || [];
  this.nomeCercato = state['nomeCercato'] || '';
  console.log("Ricerca aggiornata", this.nomeCercato);
}




vaiADettagliFilm(id: number) {
  this.router.navigate(['/film', id]);
}


vaiADettagliAttori(id: number) {
  this.router.navigate(['/attore', id]);
}


visualizza_film(){
this.mostraFilm=true;
this.mostraAttori=false;
}

visualizza_attori(){
this.mostraFilm=false;
this.mostraAttori=true;
}



getImage(path:string): string {


return this.imageService.getImage1(path); 


}

}




