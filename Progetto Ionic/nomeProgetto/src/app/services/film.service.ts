import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Attore } from '../carica-film/carica-film.page'; 
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class FilmService {
  constructor(private http: HttpClient) {}

  //per ogni genere richiedo tutti i film appartenenti a quel genere
  getFilmsGeneri(genereId: number): Observable<any[]> {
  return this.http.get<any[]>(`${environment.IP}/api/films?genre=${genereId}`);
  
  }

  //richiedo i dettagli di un film 
  getFilmsDettagli(idFilm: number): Observable<any> {
  return this.http.get<any>(`${environment.IP}/api/films/dettagli?id=${idFilm}`);
  }

  //richiedo i dettagli di un attore
  getAttoriDettagli(idAttore: number): Observable<any> {
  return this.http.get<any>(`${environment.IP}/api/attori/dettagli?id=${idAttore}`);
  }

  //richiedo i dettagli di un attore
  getRegistiDettagli(idAttore: number): Observable<any> {
  return this.http.get<any>(`${environment.IP}/api/registi/dettagli?id=${idAttore}`);
  }

  //richiedo tutti gli attori di un film
  getFilmsAttori(idFilm: number): Observable<any> {
  return this.http.get<any>(`${environment.IP}/api/films/attori?id=${idFilm}`);
  }

  //richiedo tutti i film che un attore a fatto
  getAttoriFilms(idAttore: number): Observable<any> {
  return this.http.get<any>(`${environment.IP}/api/attori/films?id=${idAttore}`);
  }
  //richiedo tutti i film che un regista a fatto
  getRegistiFilms(idRegista: number): Observable<any> {
  return this.http.get<any>(`${environment.IP}/api/registi/films?id=${idRegista}`);
  }


  //richiedo tutti i generi di un film passato per id
  getFilmsGenere(idFilm: number): Observable<any> {
  return this.http.get<any>(`${environment.IP}/api/films/generi?id=${idFilm}`);
  }

   //richiedo tutti i film preferiti di un utente passato per id
  getFilmPreferiti(idUtente: number): Observable<any> {
  return this.http.get<any>(`${environment.IP}/api/films/preferiti?id=${idUtente}`);
  }

   //richiedo tutti i film valutati di un utente passato per id
  getFilmValutati(idUtente: number): Observable<any> {
  return this.http.get<any>(`${environment.IP}/api/films/valutati?id=${idUtente}`);
  }


  getFilmsNuoveUscite(): Observable<any[]> {
  const dataOggi = new Date();//creo l'oggetto data per la data di oggi
  const cinqueMesiFa = new Date(); //creo l'oggetto data che mi serve per calcolare la data 5 mesi prima la data di oggi
  cinqueMesiFa.setMonth(dataOggi.getMonth() - 2); //dell'oggetto data cinqueMesiFa setto il mese a 5 mesi prima della data corrente, prendendo il mese della data di oggi e sottraendogli 5

  //siccome ottengo una cosa del tipo "Thu Jun 12 2025 12:29:27 GMT+0200 (Ora legale dell’Europa centrale)", devo formattarlo in stile yyyy-mm-dd per usarlo in sql
  const dataOggiISO = dataOggi.toISOString().split('T')[0]; // yyyy-mm-dd
  const cinqueMesiFaISO = cinqueMesiFa.toISOString().split('T')[0]; // yyyy-mm-dd


  console.log(dataOggi);
  return this.http.get<any[]>(`${environment.IP}/api/films/nuoveUscite?from=${cinqueMesiFaISO}&to=${dataOggiISO}`);//faccio la richiesta http inviando la data di oggi e la data di 5 mesi fa già calcolata
  }

  

 


  //carica film nel db
  caricaFilm(formData:FormData){
     return this.http.post<any>(environment.IP+'/api/carica-film', formData);
  }


  
  //modifica film nel db
  modificaFilm(formData:FormData){
     return this.http.post<any>(environment.IP+'/api/modifica-film', formData);
  }

  //modifica film nel db
  rimuoviFilm(idFilm:number){
     return this.http.post<any>(environment.IP+'/api/rimuovi-film', {idFilm});
  }


//modifica film nel db
  modificaAttore(formData:FormData){
     return this.http.post<any>(environment.IP+'/api/modifica-attore', formData);
  }

//modifica film nel db
  rimuoviAttore(idAttore:number){
     return this.http.post<any>(environment.IP+'/api/rimuovi-attore', {idAttore});
  }


//aggiungi o rimuove film tra i preferiti di un utente quando viene richiamata
aggiungi_rimuoviPreferiti(idUtente:number,idFilm:number,preferito:boolean){
     return this.http.post<any>(environment.IP+'/api/aggiungi-rimuovi-preferiti', {idUtente,idFilm,preferito});
  }  

  //aggiungi o rimuove film tra i preferiti di un utente quando viene richiamata
controllaPreferito(idUtente:number,idFilm:number){
     return this.http.post<any>(environment.IP+'/api/controlla-preferiti', {idUtente,idFilm});
  }  



//aggiungi o rimuove valutazione ad un film da parte dell'utente
aggiungi_rimuoviValutazione(idUtente:number,idFilm:number,valutazione:number){
     return this.http.post<any>(environment.IP+'/api/aggiungi-rimuovi-valutazione', {idUtente,idFilm,valutazione});
  }  

//ottengo il valore della valutazione di un film da parte dell'utente
controllaValutazione(idUtente:number,idFilm:number){
     return this.http.post<any>(environment.IP+'/api/controlla-valutazione', {idUtente,idFilm});
  } 





  

}
