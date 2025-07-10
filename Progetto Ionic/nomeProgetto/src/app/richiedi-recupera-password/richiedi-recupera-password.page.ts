import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonText, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle,IonCardContent ,IonItem, IonInput,IonLabel, IonButton} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
@Component({
  selector: 'app-richiedi-recupera-password',
  templateUrl: './richiedi-recupera-password.page.html',
  styleUrls: ['./richiedi-recupera-password.page.scss'],
  standalone: true,
  imports: [IonText,IonContent, IonHeader,NavbarComponent, IonTitle, IonToolbar, CommonModule, FormsModule, IonCard, IonCardHeader, IonCardTitle,IonCardContent,IonItem,IonInput,IonLabel,IonButton,RouterModule]
})
export class RichiediRecuperaPasswordPage implements OnInit {

 dialogService: any;

  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit() {
  }

ionViewWillEnter() {
  this.email = '';
  this.erroreEmail=false;
 this.erroreAccount=false;
 this.emailInviata=false;
 this.erroreRichiesta=false; //si attiva quando c'è già una richiesta di reset in corso
 this.tempo_rimasto='';
}



email = '';


erroreEmail:boolean=false;
erroreAccount:boolean=false;
emailInviata:boolean=false;
erroreRichiesta:boolean=false; //si attiva quando c'è già una richiesta di reset in corso
tempo_rimasto:string='';


Invio_email() {



  if (!this.EmailValidator(this.email) || !this.email || this.email=='') {
    this.erroreEmail=true;
    return;
  }
  else{
    this.erroreEmail=false;
  }


//se ha inserito una email valida richiamo il server all'invio dell'email



  this.auth.richiestaResetPassword(this.email).subscribe({
    next: (res) => {
     this.emailInviata=true;
    },
    error: (err) => {
       this.emailInviata=false;
      //se il server risponde con 404 vuol dire che non esiste nessuna acount
       if (err.status === 404) {  
      this.erroreAccount=true;
       }
       else{
         this.erroreAccount=false;
       }

       //errore che avvisa che c'è già una richiesta in corso e visualizza il tempo rimasto
       if(err.status===401){
        this.erroreRichiesta=true;
          this.tempo_rimasto = err.error?.tempo_rimasto || '';//ritorno il tempo rimasto per la scadenza del token
       }
       else{
        this.erroreRichiesta=false;
        this.tempo_rimasto='';
       }

       if(err.status===500){
        //in caso di errore apro un avviso con il messaggio di errore che il server mi sta inviando
      const messaggioErrore = err.error?.message || 'Errore sconosciuto';
      this.dialogService.apriAvviso({messaggio:messaggioErrore, titolo:'Errore!'});
       }

       
    
    }
  });

}




EmailValidator(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}



}
