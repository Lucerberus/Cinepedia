import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';
import { PendingChangesGuard } from './guards/pending-changes.guard';





export const routes: Routes = [

  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
{
    path: 'generi-film/:id',
    loadComponent: () => import('./generi-film/generi-film.page').then( m => m.GeneriFilmPage)
  },
  
  {
    //quando il path termina con film/:id allora mi porto alla pagina film-dettagli.page
     path: 'film/:id',
    loadComponent: () => import('./film-dettagli/film-dettagli.page').then(m => m.FilmDettagliPage),
  },
  {
    //quando il path termina con film/:id allora mi porto alla pagina film-dettagli.page
     path: 'attore/:id',
    loadComponent: () => import('./attore-dettagli/attore-dettagli.page').then(m => m.AttoreDettagliPage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'access-denied',
    loadComponent: () => import('./access-denied/access-denied.page').then(m => m.AccessDeniedPage),
  },
  {
    path: 'registrazione',
    loadComponent: () => import('./registrazione/registrazione.page').then( m => m.RegistrazionePage)
  },
  {
    path: 'carica-film',
    loadComponent: () => import('./carica-film/carica-film.page').then( m => m.CaricaFilmPage),
    canActivate: [roleGuard('admin')],
    canDeactivate: [PendingChangesGuard]
  },
  {
    path: 'modifica-film',
    loadComponent: () => import('./modifica-film/modifica-film.page').then( m => m.ModificaFilmPage),
    canActivate: [roleGuard('admin')],
    canDeactivate: [PendingChangesGuard]
  },
  {
    path: 'modifica-film/:id',
    loadComponent: () => import('./modifica-film/modifica-film.page').then( m => m.ModificaFilmPage),
    canActivate: [roleGuard('admin')],
    canDeactivate: [PendingChangesGuard]
  },
  {
    path: 'account',
    loadComponent: () => import('./account/account.page').then( m => m.AccountPage)
  },
  {
    path: 'rimuovi-film',
    loadComponent: () => import('./rimuovi-film/rimuovi-film.page').then( m => m.RimuoviFilmPage),
    canActivate: [roleGuard('admin')],
    canDeactivate: [PendingChangesGuard]
  },
  {
    path: 'rimuovi-film/:id',
    loadComponent: () => import('./rimuovi-film/rimuovi-film.page').then( m => m.RimuoviFilmPage),
    canActivate: [roleGuard('admin')],
    canDeactivate: [PendingChangesGuard]
  },
  {
    path: 'modifica-attore',
    loadComponent: () => import('./modifica-attore/modifica-attore.page').then( m => m.ModificaAttorePage),
    canActivate: [roleGuard('admin')],
    canDeactivate: [PendingChangesGuard]
  },
   {
    path: 'modifica-attore/:idAttore/:idFilm',
    loadComponent: () => import('./modifica-attore/modifica-attore.page').then( m => m.ModificaAttorePage),
    canActivate: [roleGuard('admin')],
    canDeactivate: [PendingChangesGuard]
  },
  {
    path: 'rimuovi-attore',
    loadComponent: () => import('./rimuovi-attore/rimuovi-attore.page').then( m => m.RimuoviAttorePage),
    canActivate: [roleGuard('admin')],
    canDeactivate: [PendingChangesGuard]
  },
  {
    path: 'rimuovi-attore/:idAttore/:idFilm',
    loadComponent: () => import('./rimuovi-attore/rimuovi-attore.page').then( m => m.RimuoviAttorePage),
    canActivate: [roleGuard('admin')],
    canDeactivate: [PendingChangesGuard]
  },
  {
    path: 'film-preferiti',
    loadComponent: () => import('./film-preferiti/film-preferiti.page').then( m => m.FilmPreferitiPage)
  },
  { path: 'ricerca-attori-film',
    loadComponent: () => import('./ricerca-attori-film/ricerca-attori-film.page').then( m => m.RicercaAttoriFilmPage)
  },  {
    path: 'server-offline',
    loadComponent: () => import('./server-offline/server-offline.page').then( m => m.ServerOfflinePage)
  },
  {
    path: 'richiedi-recupera-password',
    loadComponent: () => import('./richiedi-recupera-password/richiedi-recupera-password.page').then( m => m.RichiediRecuperaPasswordPage)
  },
  {
    path: 'richiedi-recupera-password',
    loadComponent: () => import('./richiedi-recupera-password/richiedi-recupera-password.page').then( m => m.RichiediRecuperaPasswordPage)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.page').then( m => m.ResetPasswordPage)
  },
  {
    path: 'conferma-email',
    loadComponent: () => import('./conferma-email/conferma-email.page').then( m => m.ConfermaEmailPage)
  },

  
  
  
];
