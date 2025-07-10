import { Component, OnInit ,ViewChildren,ElementRef ,QueryList,ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar ,IonCard,IonCardHeader, IonCardTitle,IonCardContent} from '@ionic/angular/standalone';
import { ActivatedRoute } from '@angular/router';
import { FilmService } from '../services/film.service';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { environment } from 'src/environments/environment';
import{GetImageService}from 'src/app/services/get-image.service';
@Component({
  selector: 'app-attore-dettagli',
  templateUrl: './attore-dettagli.page.html',
  styleUrls: ['./attore-dettagli.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule,IonCard,IonCardHeader, IonCardTitle,IonCardContent,NavbarComponent]
})
export class AttoreDettagliPage implements OnInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  constructor(private imageService:GetImageService,private filmService: FilmService,private route: ActivatedRoute,private router: Router) { }
  id!: number;
  attore: any;
  films:any=[];
  films_regista:any=[];
  genere!:string;

  ngOnInit() {
  
  this.id = +this.route.snapshot.paramMap.get('id')!;
  console.log('ID attore selezionato:', this.id);

  //richiedo i dettagli dell'attore con id 
  this.filmService.getAttoriDettagli(this.id).subscribe({
    next: (data) => {
      console.log('Dati ricevuti:', data);
      this.attore = data[0];//metto data[0] perchè movie non sarà un array quindi non passo data che è un array di oggetti, ma devo passare l'unico film, che è in data[0]
      console.log("attore passato",this.attore);
      //lo cerco tra gli attori, se tra gli attori non è stato trovato lo cerco tra i registi
      if(!this.attore){

          this.filmService.getRegistiDettagli(this.id).subscribe({
    next: (data) => {
      console.log('Dati ricevuti:', data);
      this.attore = data[0];
    },
    error: (err) => {
      console.error('Errore nel caricamento del film:', err);
    }
  });
      } 
      switch (Number(this.attore.gender)) {
  case 0:
    this.genere='Non specificato';
    break;
  case 1:
        this.genere='Femmina';

    break;
    case 2:
        this.genere='Maschio';

    break;
    case 3:
        this.genere='Non-binary';
    break;
  default:
    
    break;
}
    },
    error: (err) => {
      console.error('Errore nel caricamento del film:', err);
    }
  });

  //richiedo tutti i film che l'attore con id ha fatto e li salvo in movies
   this.filmService.getAttoriFilms(this.id).subscribe({
    next: (data) => {
      console.log('Dati ricevuti:', data);
      this.films = data;
    },
    error: (err) => {
      console.error('Errore nel caricamento del film:', err);
    }
  });

  //richiedo tutti i film che l'attore con id ha fatto e li salvo in movies
   this.filmService.getRegistiFilms(this.id).subscribe({
    next: (data) => {
      console.log('Dati ricevuti:', data);
      this.films_regista = data;
    },
    error: (err) => {
      console.error('Errore nel caricamento del film:', err);
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



    //porta ai dettagli del film selezionato tra quelli in cui ha partecipato l'attore
vaiADettagli(id: number) {
  this.router.navigate(['/film', id]);  
}



getImage(path:string): string {
  

 return this.imageService.getImage1(path);
}

//Se un attore non ha una descrizione visualizzo una stringa di default
getBiography(bio: string | null): string {
  if (!bio || bio === '' || bio === 'null') {
    return 'Non abbiamo una descrizione per questa persona';
  }
  return bio;
}

getData(bio: string | null): string {
  if (!bio || bio === '' || bio === 'null') {
    return 'Nessun dato';
  }
  return bio;
}


}
