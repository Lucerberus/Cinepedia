import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle,IonCardContent ,IonItem, IonInput,IonLabel, IonButton} from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader,NavbarComponent, IonTitle, IonToolbar, CommonModule, FormsModule, IonCard, IonCardHeader, IonCardTitle,IonCardContent,IonItem,IonInput,IonLabel,IonButton,RouterModule]
})
export class LoginPage implements OnInit {
  dialogService: any;

  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit() {
  }

email = '';
password = '';

erroreEmail:boolean=false;
errorePassword:boolean=false;

showPassword: boolean = false;
passwordVisibile(){
  this.showPassword=!this.showPassword;
}


doLogin() {
  this.auth.login(this.email, this.password).subscribe({
    next: (res) => {
      this.auth.handleLoginResponse(res);
      this.router.navigate(['/home']);
     


    },
    error: (err) => {
       if (err.status === 401) {
      const message = err.error?.message;

        if (message === 'Credenziali non valide') {
        this.errorePassword=true;


        
      } else 
       this.errorePassword=false;
      if (message === 'Account non registrato') {
         this.erroreEmail=true;
      }
      else{
         this.erroreEmail=false;
      }

      
       }

       if(err.status===500){
        //in caso di errore apro un avviso con il messaggio di errore che il server mi sta inviando
      const messaggioErrore = err.error?.message || 'Errore sconosciuto';
      this.dialogService.apriAvviso({messaggio:messaggioErrore, titolo:'Errore!'});
       }

       
    
    }
  });

}

}