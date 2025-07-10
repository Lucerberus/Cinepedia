import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component'; // path giusto
import{FooterComponent}from './footer/footer.component';
import { ServerStatusService } from './services/server-status-service.service';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonicModule, RouterOutlet,NavbarComponent,FooterComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {


serverSpento=false;
constructor(private router: Router,private serverStatus: ServerStatusService) {
  //recupero il valore restituito dal service che verifca lo stato del server ogni 10 secondi
  //se ritorna false porto l'utente alla pagina dove lo avviso di questo evento 
  //altrimenti lo porto alla pagina di home
  this.serverStatus.status$.subscribe(status => {
      if(status==false || status==null){
        this.serverSpento=true;
           this.router.navigate(['/server-offline',]); 
      }
      else{
          if(this.serverSpento){
            this.router.navigate(['/home',]); 
            this.serverSpento=false;
          }
         
         
      }
    });
 }

vaiAHome() {
  this.router.navigate(['/home',]);  
}





}