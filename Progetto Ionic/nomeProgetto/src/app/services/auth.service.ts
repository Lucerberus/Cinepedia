import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

type UserRole = 'guest' | 'user' | 'admin';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticated = false;
  private currentUser: { id:number, email:string, username: string, profile_image:string,role: UserRole } | null = null;

  constructor(private http: HttpClient) {
    //richiamo la funzione restoreSession che mi recupera i dati dell'utente,  se esistono. 
    //mi serve così che se aggiorno la pagina per esempio, il sito ha modo di recuperare i dati dell'utente dal localstorage, altrimenti mi chiederebbe di nuovo di fare l'accesso
    this.restoreSession();

  }

  login(email: string, password: string) {
    return this.http.post<any>(environment.IP+'/api/login', { email, password });
  }

  registrazione(email:string, username:string, password:string){
     return this.http.post<any>(environment.IP+'/api/richiesta-registrazione', { email, username,password });
  }
  //modifica password profilo dell'utente
  modificaPassword(idUtente:number, passwordAttualePassata:string,nuovaPassword:string){
    return this.http.post<any>(environment.IP+'/api/modifica-password', {idUtente,passwordAttualePassata, nuovaPassword});
  }
  //modifica username profilo dell'utente
   modificaUsername(idUtente:number, nuovoUsername:string){
    return this.http.post<any>(environment.IP+'/api/modifica-username', {idUtente,nuovoUsername });
  }

  //modifica l'immagine profilo dell'utente
  modificaProfileImage(formData:FormData){
    return this.http.post<any>(environment.IP+'/api/modifica-profile-image',formData);
  }

  //richiesta per il reset della password
  richiestaResetPassword(email:string){
    return this.http.post<any>(environment.IP+'/api/richiesta-reset',{email});
  }

  //controllo la validità della token per il reset della password, se è valida ritorno la email dell account da ripristinare
   controlloToken(token: string): Observable<any> {
    return this.http.get<any>(`${environment.IP}/api/verifica-token?token=${token}`);
    }

    //richiesta per il reset della password
  resetPassword(token:string,nuovaPassword:string){
    return this.http.post<any>(environment.IP+'/api/reset-password',{token,nuovaPassword});
  }

  confermaAccount(token:string){
     return this.http.post<any>(environment.IP+'/api/conferma-registrazione',{token});
  }
  


   
aggiornaUsernameNelLocalStorage(nuovoUsername: string): void {
  const utenteString = localStorage.getItem('utente');

  if (utenteString) {
    const utente = JSON.parse(utenteString);
    utente.username = nuovoUsername;
    localStorage.setItem('utente', JSON.stringify(utente));
  }
}


aggiornaProfileImageNelLocalStorage(profile_path: string): void {
  const utenteString = localStorage.getItem('utente');

  if (utenteString) {
    const utente = JSON.parse(utenteString);
    utente.profile_image = profile_path;
    localStorage.setItem('utente', JSON.stringify(utente));
  }
}

  //questa funzione mi permette di salvare i dati dell'utente nel browser :username e ruolo dentro l'oggetto user, che viene convertito in stringa prima di essere salvato nel localstorage)
  //Dopo questa funzione   l'utente è considerato loggato,  il ruolo sono disponibili per tutto il sito, se ricarichi la pagina, puoi ricostruire la sessione leggendo i dati da localStorage
  //ricostruiamo la sessione nella funzione più sotto restoreSession(), dove ricarichiamo tuser prenendo i valori dal localstorage dove erano salvati

    
  
  handleLoginResponse(response: any) {
    this.currentUser = response.utente;
    this.isAuthenticated = true;
    localStorage.setItem('utente', JSON.stringify(this.currentUser));
  }


  getCurrentUser(): any {
    const userJson = localStorage.getItem('utente');
    if (userJson) {
      return JSON.parse(userJson);
    }
    return { id: -1, email:"",username: 'Guest', profile_image:'',role: 'guest' };
  }

  getUsername():any{
    return this.currentUser!.username ||'guest';
  }

  getEmail():any{
    return this.currentUser!.email ||'';
  }

  logout() {
    this.isAuthenticated = false;

    localStorage.removeItem('utente');
    //ripristino l'utente a default
    this.currentUser = { id: -1, email:"",username: 'Guest',profile_image:'', role: 'guest' };
  }

  

  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  getRole(): UserRole {
    return this.currentUser?.role || 'guest';
  }

  getIdUtente(): number{
    return this.currentUser!.id || -1;
  }

  getProfileImage(): string{
    return this.currentUser!.profile_image || '';
  }


  //con questa funzione veririco se un utente ha un determinato ruolo. infatti riceve come parametro il nome del ruolo che voglio verificare, e poi lo confronta con il ruolo dell'utente richiamando this.getRole
  //se sono uguali ritorna True altrimenti false
  hasRole(requiredRole: string): boolean {
    return this.getRole() === requiredRole;
  }


  // Per ricaricare dopo un refresh
  restoreSession() {
    const utente = localStorage.getItem('utente');

    if ( utente) {
      this.currentUser = JSON.parse(utente);
      this.isAuthenticated = true;
    }
    else{
      // Set guest di default
    this.currentUser = { id: -1, email:"",username: 'Guest',profile_image:'', role: 'guest' };
    this.isAuthenticated = false;
    }
    
  }
}
