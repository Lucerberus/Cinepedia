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
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [RouterModule,IonContent, IonHeader, NavbarComponent,IonTitle, IonToolbar, CommonModule, FormsModule, IonCard, IonCardHeader, IonCardTitle,IonCardContent,IonItem,IonInput,IonLabel,IonButton,IonIcon]
})
export class ResetPasswordPage implements OnInit {

  constructor(private dialogService: DialogService,private auth: AuthService,private router: Router,private route: ActivatedRoute) { }
email = '';
token='';
password = '';
confermaPassword='';
  
showPassword: boolean = false;
errorePasswordValidator:boolean=false;
errorePassword:boolean=false;
token_valido=false;


ionViewWillEnter() {
 this.email = '';
this.token='';
this.password = '';
this.confermaPassword='';
  
this.showPassword = false;
this.errorePasswordValidator=false;
this.errorePassword=false;
this.token_valido=false;

this.route.queryParams.subscribe(params => {
    this.token = params['token']; //prendo il token che la pagina sta ricevendo e lo salvo nella variabile token
    console.log('Token ricevuto:', this.token);
      //verifico se il token è ancora valido , se si il server mi ritorna l'email e mi visualizza il form per compilare la password
  //altrimenti mi visualizza un messaggio dove informa che il token non è valido
  this.auth.controlloToken(this.token).subscribe({
    //se la risposta è senza errore 
    next: (res) => {
      this.email=res.email;
      this.token_valido=true;

    },
    error: (err) => {

      this.token_valido=false;

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


reset_password() {
  //qui inizio una serie di controlli per verificare la correttezza dei dati inseriti dall'utente
  //in caso di errore la funzione fa return, ma prima imposta a true la variabile booleana dell'errore così che nel html visualizzo i messaggi usando ngif


  if(!this.PasswordValidator(this.password) || this.password=='' || !this.password){
    this.errorePasswordValidator=true;
   
    return;
  }
  else{
    this.errorePasswordValidator=false;
  }

  //se le due password non coincidono
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
  this.auth.resetPassword(this.token, this.password).subscribe({
    //se la risposta è senza errore 
    next: (res) => {
      //in caso di successo visualizzo il messaggio di successo inviato dal server, appena l'utente clicca ok ricarico la pagina così può continuarea fare altre modifiche
      const messaggioSuccesso = res?.message || 'Password aggiornata con successo!';
       this.dialogService.apriAvviso({messaggio:messaggioSuccesso, titolo:'Successo!'}).then((risposta:any) => {
    if (risposta){
      this.router.navigate(['/login']);//mi riporto alla login
    }  
  });
    },
    error: (err) => {

      //in caso di errore apro un avviso con il messaggio di errore che il server mi sta inviando
      const messaggioErrore = err.error?.message || 'Errore sconosciuto';
      this.dialogService.apriAvviso({messaggio:messaggioErrore, titolo:'Errore!'});

       if (err.status === 400) {
           this.token_valido=false;
    
    }

    if(err.status===500){
      //in caso di errore apro un avviso con il messaggio di errore che il server mi sta inviando
      const messaggioErrore = err.error?.message || 'Errore sconosciuto';
      this.dialogService.apriAvviso({messaggio:messaggioErrore, titolo:'Errore!'});
    }
    
  }
  });


  
}



PasswordValidator(password: string): boolean {
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return pattern.test(password);
}

passwordVisibile(){
  this.showPassword=!this.showPassword;
}

}
