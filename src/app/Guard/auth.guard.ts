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




// import { inject } from '@angular/core';
// import { CanActivateFn, Router } from '@angular/router';
// import { UserAuthService } from '../Services/user-auth.service';
// import { of } from 'rxjs';
// import { map, catchError } from 'rxjs/operators';

// export const authGuard: CanActivateFn = (route, state) => {
//   let authService=inject(UserAuthService);
//   let routerservice=inject(Router);

  
//   if (!authService.isLoggedIn()) {
//     routerservice.navigate(['/login']);
//     return of(false);
//   }


//     if (authService.isTokenExpired()) {
//       //debugger
//       const refreshToken$ = authService.refreshToken();
//       //console.log('mss',refreshToken$);
//       if (!refreshToken$) {
//         routerservice.navigate(['/login']);
//         return of(false);
//       }
  
//       return refreshToken$.pipe(
//         map(() => true), // Token refreshed successfully
//         catchError(() => {
//           routerservice.navigate(['/login']);
//           return of(false);
//         })
//       );
//     }
  
//     return of(true);
//   };

// import { inject } from '@angular/core';
// import { CanActivateFn, Router } from '@angular/router';
// import { UserAuthService } from '../Services/user-auth.service';
// import { of } from 'rxjs';
// import { map, catchError } from 'rxjs/operators';

// export const authGuard: CanActivateFn = (route, state) => {
//   const authService = inject(UserAuthService);
//   const router = inject(Router);

//   if (!authService.isLoggedIn()) {
//     router.navigate(['/login']);
//     return of(false);
//   }

//   if (authService.isTokenExpired()) {
//     const refreshToken$ = authService.refreshToken();
//     if (!refreshToken$) {
//       router.navigate(['/login']);
//       return of(false);
//     }

//     return refreshToken$.pipe(
//       map((newTokens: any) => {
//         authService.startRefreshTokenTimer(newTokens.accessToken, newTokens.refreshToken);
//         return true;
//       }),
//       catchError(() => {
//         router.navigate(['/login']);
//         return of(false);
//       })
//     );
//   }

//   // Token is valid - optionally ensure timer is running
//   const tokens = sessionStorage.getItem('JWT_TOKEN');
//   if (tokens) {
//     const parsed = JSON.parse(tokens);
//     authService.startRefreshTokenTimer(parsed.accessToken, parsed.refreshToken);
//   }

//   return of(true);
// };
