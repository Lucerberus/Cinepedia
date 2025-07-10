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
import { AuthService } from '../services/auth.service';
import{GetImageService}from 'src/app/services/get-image.service';
@Component({
  selector: 'app-film-preferiti',
  templateUrl: './film-preferiti.page.html',
  styleUrls: ['./film-preferiti.page.scss'],
  standalone: true,
  imports: [IonContent,IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,IonCard,NavbarComponent]
})


 

export class FilmPreferitiPage implements OnInit {
filmPreferiti: any[] = [];
idUtente=this.auth.getIdUtente();
  constructor(private imageService:GetImageService,private http: HttpClient, private filmService:FilmService, private route:ActivatedRoute,private router:Router, private auth:AuthService) { }

  ngOnInit() {
    
  }
  //si richiama ogni volta che visito questa pagina, cos' si aggiorna subito
   ionViewWillEnter() {
this.filmService.getFilmPreferiti(this.idUtente).subscribe({
      next: (data) => {
        this.filmPreferiti = data;
      },
      error: (err) => {
        console.error(`Errore nel caricamento dei film preferiti`, err);
      }
    });

  }

vaiADettagli(id: number) {
  this.router.navigate(['/film', id]);
}

getImage(path:string): string {
  
return this.imageService.getImage1(path);
 
}





}
