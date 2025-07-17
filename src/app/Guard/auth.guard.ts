import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { UserAuthService } from '../Services/user-auth.service';
import { of, defer } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { routes } from '../app.routes';

export function authGuard(allowedRoles:string[]): CanActivateFn 
{
  return(route:ActivatedRouteSnapshot)=>{  
  const authService = inject(UserAuthService);
  const router = inject(Router);

  return defer(() => {
    if (!authService.isLoggedIn()) {
      router.navigate(['/login']);
      return of(false);
    }

    if (authService.isTokenExpired()) {
      return authService.refreshToken().pipe(
        map(() => true),
        catchError(() => {
          router.navigate(['/login']);
          return of(false);
        })
      );
    }

    //checkrole
    const userRole=sessionStorage.getItem('user_role')
    if(!userRole||!allowedRoles.includes(userRole)){
      router.navigate(['/login']);
      return of(false)
    }

    return of(true);
  });
};
}
