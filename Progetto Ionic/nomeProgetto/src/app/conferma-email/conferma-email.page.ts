import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonToolbar,IonHeader, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle,IonCardContent ,IonItem, IonInput,IonLabel, IonButton,IonIcon} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { FilmService } from '../services/film.service';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DialogService } from '../services/dialog.service';
@Component({
  selector: 'app-conferma-email',
  templateUrl: './conferma-email.page.html',
  styleUrls: ['./conferma-email.page.scss'],
  standalone: true,
  imports: [RouterModule,IonContent, IonHeader, NavbarComponent,IonTitle, IonToolbar, CommonModule, FormsModule, IonCard, IonCardHeader, IonCardTitle,IonCardContent,IonItem,IonInput,IonLabel,IonButton,IonIcon]
})
export class ConfermaEmailPage implements OnInit {

  constructor(private dialogService: DialogService,private auth: AuthService,private router: Router,private route: ActivatedRoute) { }
username = '';
token='';
password = '';
confermaPassword='';
  
showPassword: boolean = false;
errorePasswordValidator:boolean=false;
errorePassword:boolean=false;


accountConfermato=false;

ionViewWillEnter() {
 this.username = '';
this.token='';
this.password = '';
this.confermaPassword='';
  
this.showPassword = false;
this.errorePasswordValidator=false;
this.errorePassword=false;


this.accountConfermato=false;

this.route.queryParams.subscribe(params => {
    this.token = params['token']; //prendo il token che la pagina sta ricevendo e lo salvo nella variabile token
    console.log('Token ricevuto:', this.token);
      //verifico se il token è ancora valido , se si il server mi ritorna l'email e mi visualizza il form per compilare la password
  //altrimenti mi visualizza un messaggio dove informa che il token non è valido
  this.auth.controlloToken(this.token).subscribe({
    //se la risposta è senza errore 
    next: (res) => {
     
      //se il controllo token è andato a buon fine devo confermare l'account lo faccio richiamando una get del server 
      //il server resetterà la token ed imposterà il campo 'confermato' ad 1, così che da ora l'utente potrà fare il login perchè l'account è stato confermato
      
      this.auth.confermaAccount(this.token).subscribe({
        next: (res) => {
           this.username=res.username;
          this.accountConfermato=true;
        },
        error: (err) => {
          this.accountConfermato=false;
           //in caso di errore apro un avviso con il messaggio di errore che il server mi sta inviando
          const messaggioErrore = err.error?.message || 'Errore sconosciuto';
          this.dialogService.apriAvviso({messaggio:messaggioErrore, titolo:'Errore!'});

        }
      });
     
      

    },
    error: (err) => {

  
      this.accountConfermato=false;

    if(err.status===500){
     //in caso di errore apro un avviso con il messaggio di errore che il server mi sta inviando
      const messaggioErrore = err.error?.message || 'Errore sconosciuto';
      this.dialogService.apriAvviso({messaggio:messaggioErrore, titolo:'Errore!'});
    }
    
  }
  });

  });




}


ngOnInit() {
 

  }

}
