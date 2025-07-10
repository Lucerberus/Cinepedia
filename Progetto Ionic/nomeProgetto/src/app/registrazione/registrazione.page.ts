import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle,IonCardContent ,IonItem, IonInput,IonLabel, IonButton,IonIcon} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { DialogService } from '../services/dialog.service';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-registrazione',
  templateUrl: './registrazione.page.html',
  styleUrls: ['./registrazione.page.scss'],
  standalone: true,
  imports: [IonContent,RouterModule, IonHeader, NavbarComponent,IonTitle, IonToolbar, CommonModule, FormsModule, IonCard, IonCardHeader, IonCardTitle,IonCardContent,IonItem,IonInput,IonLabel,IonButton,IonIcon]
})
export class RegistrazionePage implements OnInit {

  constructor(private dialogService: DialogService,private auth: AuthService,private router: Router) { }

  ngOnInit() {
  }


email = '';
username='';
password = '';
confermaPassword='';
  
showPassword: boolean = false;

erroreEmailValidator: boolean = false;
errorePasswordValidator:boolean=false;
errorePassword:boolean=false;
erroreUsernameEsistente:boolean=false;
erroreEmailEsistente:boolean=false;
erroreCampiNonCompilati:boolean=false;

emailInviata=false;

ionViewWillEnter() {
this.email = '';
this.username='';
this.password = '';
this.confermaPassword='';
this.showPassword = false;
this.erroreEmailValidator = false;
this.errorePasswordValidator=false;
this.errorePassword=false;
this.erroreUsernameEsistente=false;
this.erroreEmailEsistente=false;
this.erroreCampiNonCompilati=false;
this.emailInviata=false;
}




doRegistrazione() {
  //qui inizio una serie di controlli per verificare la correttezza dei dati inseriti dall'utente
  //in caso di errore la funzione fa return, ma prima imposta a true la variabile booleana dell'errore così che nel html visualizzo i messaggi usando ngif

  if (!this.email || !this.username || !this.password || !this.confermaPassword) {
    this.erroreCampiNonCompilati=true;
    return;
  }
  else{
    this.erroreCampiNonCompilati=false;
  }

  if (!this.EmailValidator(this.email)) {
    this.erroreEmailValidator=true;
    return;
  }
  else{
    this.erroreEmailValidator=false;
  }

  if(!this.PasswordValidator(this.password)){
    this.errorePasswordValidator=true;
   
    return;
  }
  else{
    this.errorePasswordValidator=false;
  }

  if (this.password !== this.confermaPassword) {
    this.errorePassword=true;
  
    return;
  }
  else{
    this.errorePassword=false;
  }

  //se il codice è arrivato qui vuol dire che ha superato tutti gli errori, dato che ad almeno un errore tra quelli sopra la funzione fa da sola return
  //quindi ora invio i dati al server che verifica se l'email già esiste, oppure se l'username è già stato usato. in questi casi torna errori che controllo e avviso l'utente
  //nel caso in cui tutto vada bene il server manda una token, username e ruolo per fare automaticamente il login con tali dati inseriti e portare già l'utente alla homepage
  this.auth.registrazione(this.email.toLowerCase(), this.username, this.password).subscribe({
    //se la risposta è senza errore 
    next: (res) => {
      this.emailInviata=true;
    },
    error: (err) => {
       this.emailInviata=false;

      //in caso di errore apro un avviso con il messaggio di errore che il server mi sta inviando
      const messaggioErrore = err.error?.message || 'Errore sconosciuto';
      this.dialogService.apriAvviso({messaggio:messaggioErrore, titolo:'Errore!'});

       

       if (err.status === 409) {
      const message = err.error?.message;

        if (message === 'Esiste già un account con questa email') {
        this.erroreEmailEsistente=true;
        }
        else{
           this.erroreEmailEsistente=false;
        }

        if (message === 'Username giù utilizzato') {
        this.erroreUsernameEsistente=true;
        }
        else{
           this.erroreUsernameEsistente=false;
        }  
    
    }

    if(err.status===500){
      alert("errore durante il caricamento nel DB");
    }
    
  }
  });


}

EmailValidator(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

PasswordValidator(password: string): boolean {
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return pattern.test(password);
}

passwordVisibile(){
  this.showPassword=!this.showPassword;
}

}
