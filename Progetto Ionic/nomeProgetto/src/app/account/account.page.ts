import { Component, OnInit, ViewChild, ElementRef  } from '@angular/core';
import { IonIcon,IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle,IonCardContent ,IonItem, IonInput,IonLabel, IonButton, IonAvatar} from '@ionic/angular/standalone';
import { NavbarComponent } from '../navbar/navbar.component';
import { RouterModule, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { DialogService } from '../services/dialog.service';
import { FilmService } from '../services/film.service';
import{GetImageService}from 'src/app/services/get-image.service';
@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  standalone: true,
  imports: [IonIcon,FormsModule,IonContent, IonHeader, IonTitle,CommonModule, IonToolbar, IonCard, IonCardHeader, IonCardTitle,IonCardContent,IonItem,IonInput,IonLabel,IonButton,IonAvatar,RouterModule,NavbarComponent],
})
export class AccountPage implements OnInit {
  @ViewChild('fileInput', { static: false }) fileInputRef!: ElementRef<HTMLInputElement>;
  constructor(private imageService:GetImageService,private filmService: FilmService,private dialogService: DialogService,private auth: AuthService,private router: Router) {}

   ionViewWillEnter() {

    this.user = this.auth.getUsername();
    this.email = this.auth.getEmail();
    this.user_profile_path=this.auth.getProfileImage();
    this.filmPreferiti= [];
    this.filmValutati=[];

  
    this.chiudiModifiche();
    this.chiudiModificheUsername();

    this.filmService.getFilmPreferiti(this.auth.getIdUtente()).subscribe({
      next: (data) => {
        this.filmPreferiti = data;
            console.log("film preferiti:",this.filmPreferiti);

      },
      error: (err) => {
        console.error(`Errore nel caricamento dei film preferiti`, err);
      }
    });

    this.filmService.getFilmValutati(this.auth.getIdUtente()).subscribe({
      next: (data) => {
        this.filmValutati = data;
           console.log("film valutati:",this.filmValutati);
      },
      error: (err) => {
        console.error(`Errore nel caricamento dei film preferiti`, err);
      }
    });

 


  }
  user: any;
  email:any;
  user_profile_path:any;
  filmPreferiti: any[] = [];
  filmValutati: any[] = [];

passwordAttuale:string='';
nuovaPassword:string='';
nuovoUsername:string='';
confermaPassword:string='';
showPassword: boolean = false;
modificaPasswordAttiva:boolean=false;
modificaUsernameAttiva:boolean=false;
modificaImageAttiva:boolean=false;
errorePasswordValidator:boolean=false;
errorePassword1:boolean=false; //password corrente errata
errorePassword2:boolean=false; //password nuova e conferma password diverse
errorePassword3:boolean=false; //password nuova uguale a quella vecchia
erroreUsernameEsistente:boolean=false;
erroreUsernameVuoto:boolean=false;
erroreUsernameUguale:boolean=false;
erroreCampiNonCompilati:boolean=false;


  previewImageUser:string | ArrayBuffer | null =null;
  user_profile_Image = new FormData();
 

  


  profileImageUrl: string | null = null; 

ngOnInit() {

 
  }

attivaModUsername(){
this.modificaUsernameAttiva=true;
this.nuovoUsername=this.user;
}


attivaModPassword(){
this.modificaPasswordAttiva=true;

}
passwordVisibile(){
  this.showPassword=!this.showPassword;
}

modificaUsername(){
  if (!this.nuovoUsername) {
    this.erroreUsernameVuoto=true;
    return;
  }
  else{
    this.erroreUsernameVuoto=false;
  }

  //nuovo user inserito uguale a quello attuale
  if (this.nuovoUsername==this.user) {
    this.erroreUsernameUguale=true;
    return;
  }
  else{
    this.erroreUsernameUguale=false;
  }

  //se sono qui vuol dire che l'utente ha inserito un username valido e diverso da quello attuale

this.auth.modificaUsername(this.auth.getIdUtente(),this.nuovoUsername).subscribe({
    //se la risposta è senza errore 
    next: (res) => {
       const messaggioSuccesso = res?.message;
      this.dialogService.apriAvviso({messaggio:messaggioSuccesso, titolo:'Successo!'}).then(risposta => {
    if (risposta){
        this.auth.aggiornaUsernameNelLocalStorage(this.nuovoUsername);//aggiorno l'username nei dati dell'utente del localstorage così l'attuale sessione continuerà con il nuovo username
        this.chiudiModificheUsername();
        window.location.reload();
        
    }  
  });
    
     
    },
    error: (err) => {
       if (err.status === 409) {
      const message = err.error?.message;

        if (message === 'username esistente') {
        this.erroreUsernameEsistente=true;
        }
        else{
           this.erroreUsernameEsistente=false;
        } 
    }
    else{
      //in caso di errore apro un avviso con il messaggio di errore che il server mi sta inviando
      const messaggioErrore = err.error?.message || 'Errore sconosciuto';
     this.dialogService.apriAvviso({messaggio:messaggioErrore, titolo:'Errore!'});
    }

    
    
  }
  });
}

modificaPassword(){
  
  //qui inizio una serie di controlli per verificare la correttezza dei dati inseriti dall'utente
  //in caso di errore la funzione fa return, ma prima imposta a true la variabile booleana dell'errore così che nel html visualizzo i messaggi usando ngif

  if (!this.passwordAttuale ||  !this.nuovaPassword || !this.confermaPassword) {
    this.erroreCampiNonCompilati=true;
    return;
  }
  else{
    this.erroreCampiNonCompilati=false;
  }

  if(!this.PasswordValidator(this.nuovaPassword)){
    this.errorePasswordValidator=true;
   
    return;
  }
  else{
    this.errorePasswordValidator=false;
  }



  //se il conferma password non corrisponde a quella attuale
  if (this.nuovaPassword !== this.confermaPassword) {
    this.errorePassword2=true;
  
    return;
  }
  else{
    this.errorePassword2=false;
  }





  //se il codice è arrivato qui vuol dire che ha superato tutti gli errori, dato che ad almeno un errore tra quelli sopra la funzione fa da sola return
  //quindi ora invio i dati al server che verifica se l'email già esiste, oppure se l'username è già stato usato. in questi casi torna errori che controllo e avviso l'utente
  //nel caso in cui tutto vada bene il server manda una token, username e ruolo per fare automaticamente il login con tali dati inseriti e portare già l'utente alla homepage
  this.auth.modificaPassword(this.auth.getIdUtente(),this.passwordAttuale,this.nuovaPassword).subscribe({
    //se la risposta è senza errore 
    next: (res) => {
       const messaggioSuccesso = res?.message;
      this.dialogService.apriAvviso({messaggio:messaggioSuccesso, titolo:'Successo!'}).then(risposta => {
    if (risposta){
        this.chiudiModifiche();
        window.location.reload();
    }  
  });
    
     
    },
    error: (err) => {
       if (err.status === 409) {
      const message = err.error?.message;

        if (message === 'password errata') {
        this.errorePassword1=true;
        }
        else{
           this.errorePassword1=false;
        }  

        if (message === 'password uguali') {
        this.errorePassword3=true;
        }
        else{
           this.errorePassword3=false;
        }  
    
    }
    else{
      //in caso di errore apro un avviso con il messaggio di errore che il server mi sta inviando
      const messaggioErrore = err.error?.message || 'Errore sconosciuto';
     this.dialogService.apriAvviso({messaggio:messaggioErrore, titolo:'Errore!'});
    }

    
    
  }
  });


}

modificaProfiloImage(){
  
const formData = new FormData();
formData.append('profile_image', this.user_profile_Image.get('image') as File);
formData.append('userId',this.auth.getIdUtente().toString());
this.auth.modificaProfileImage(formData).subscribe({
    //se la risposta è senza errore 
    next: (res) => {
      //in caso di successo visualizzo il messaggio di successo inviato dal server, appena l'utente clicca ok l'utente viene riportato alla pagina di home
      const messaggioSuccesso = res?.message || 'Immagine profilo aggiornata!';
    this.dialogService.apriAvviso({messaggio:messaggioSuccesso, titolo:'Successo!'}).then(risposta => {
    if (risposta){
        //il server mi risponde inviandomi la profile_path appena creato, cos' posso aggiornare subito nel local storage il valore così da vedere subito l'immagine profilo modificata
        //altrimenti avrei dovuto aspettare un nuovo login
        this.auth.aggiornaProfileImageNelLocalStorage(res.profile_path);
        this.chiudiModificheImage();
        window.location.reload();
    } 
  });

    },
    error: (err) => {
      //in caso di errore apro un avviso con il messaggio di errore che il server mi sta inviando
      const messaggioErrore = err.error?.message || 'Errore sconosciuto';
     this.dialogService.apriAvviso({messaggio:messaggioErrore, titolo:'Errore!'});
       

  }
  });

}



PasswordValidator(password: string): boolean {
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return pattern.test(password);
}


chiudiModificheImage(){
this.modificaImageAttiva=false;
this.user_profile_Image=new FormData();
this.previewImageUser=null;
  if (this.fileInputRef?.nativeElement) {
    this.fileInputRef.nativeElement.value = '';
  }
}


chiudiModificheUsername(){
  this.nuovoUsername='';
   this.modificaUsernameAttiva=false;
   this.erroreUsernameEsistente=false;
this.erroreUsernameVuoto=false;
this.erroreUsernameUguale=false;
}

chiudiModifiche(){
   this.passwordAttuale='';
  this.nuovaPassword='';
  this.confermaPassword='';
  this.showPassword= false;
  this.modificaPasswordAttiva=false;
  this. errorePasswordValidator=false;
 this.errorePassword1=false; //password corrente errata
 this.errorePassword2=false; //password nuova e conferma password diverse
 this.errorePassword3=false; //password nuova uguale a quella vecchia
 this.erroreUsernameEsistente=false;
 this.erroreCampiNonCompilati=false;
}

triggerImagePicker() {
  this.fileInputRef.nativeElement.click();
  this.modificaImageAttiva=true;
}

getImageProfile(path: string | ArrayBuffer | null | undefined): string {
  return this.imageService.getImage2(path,this.previewImageUser);
}

getImageFilm(path: string | ArrayBuffer | null | undefined):string {
return this.imageService.getImage1(path);
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

vaiADettagli(id: number) {
  this.router.navigate(['/film', id]);
}

onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
   

    reader.onload = () => {
    
        this.previewImageUser = reader.result;
        this.user_profile_Image.set('image', file);//imposto l'immagine copertina nella posterimage, se ne esisteva una la sovrasrive perchè sto usando set
     
    };

    reader.readAsDataURL(file);
  }
}



stars = new Array(5).fill(0);
//qui decidiamo che stella visualizzare, quindi piena, mezza oppure vuota
getStarIcon(index: number,film:any): string {
  //se stiamo passando sopra le stelle con il mouse prende il valore temporaneo hoverValue, altrmenti prendiamo la valuazione salvata nella variabile valutazione
  const value =film.valutazione;
  //calcola il valore della stella, infatti la stella si posizione 0 nell'array vale 2, quindi (0+1)*2=2
  //invece per esempio se è illuminata fino alla terza stella allora abbiamo 3*2=6 quindi 3 stelle su 5 vale 6 il voto
  const starValue = (index + 1) * 2; 


  //ora devo capire se con il mouse ho riempito per intero la stella oppure no
  //infatti se value è >= di starValue, quindi del valore massimo per quella stella, allora la name dell'icon sarà 'star'
  //che rappresenta la stella piena.Se invece il valore +1 è uguale a starvalue di quella stella allora metà altrimenti se è < è vuota
  // es. voto 7, stella 1 ha starValue 2, quindi piena, stella 2 ha starvalue 4 quindi piena,
  //stella 3 ha star value 6, quindi anche stella 3 è piena.
  //la stella 4 invece ha star value 8, ma il voto è 7, quindi value>=starValue è falsa
  //ma value+1==starValue è vera, vuol dire che la stella 4 si riempie a metà
  //invece le restanti stelle la stella 5 che ha starValue 10, sarà vuota quindi icon name star-outline
  //poichè il voto attuale anche incrementato di 1 sarà < della sua Starvalue, quindi il suo valore massimo
 

  if (value >= starValue) {
    return 'star'; // piena
  } else if (value + 1 === starValue) {
    return 'star-half'; // metà
  } else {
    return 'star-outline'; // vuota
  }
}

  logout() {
    this.auth.logout();
  }



}