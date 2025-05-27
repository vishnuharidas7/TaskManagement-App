
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
 
@Injectable({
  providedIn: 'root'
})

export class UserAuthService {

  private readonly JWT_TOKEN = 'JWT_TOKEN';
  private loggedUser?: string;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private refreshTokenTimer?: ReturnType<typeof setTimeout>;
  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { UserName: string; Password: string }): Observable<any> {

    return this.http
      .post('https://localhost:7268/api/Auth/login', credentials)
      .pipe(
        tap((tokens: any) =>
          this.doLoginUser(credentials.UserName, tokens)
        )
      );
  }
 
  private doLoginUser(username: string, tokensFromBE: any): void {

    this.loggedUser = username;
    this.storeJwtToken(tokensFromBE);
    const tokens = typeof tokensFromBE === 'string' ? JSON.parse(tokensFromBE) : tokensFromBE;
    this.startRefreshTokenTimer(tokens.accessToken, tokens.refreshToken);
    this.isAuthenticatedSubject.next(true);

  }
 
  // private storeJwtToken(jwt: any): void {
  //   sessionStorage.setItem(
  //     this.JWT_TOKEN,
  //     typeof jwt === 'string' ? jwt : JSON.stringify(jwt)
  //   );

  // }
 
  private storeJwtToken(tokens: { accessToken: string, refreshToken: string }): void {
    sessionStorage.setItem(this.JWT_TOKEN, JSON.stringify(tokens));
  }

  getCurrentAuthUser(): Observable<any> {
    return this.http.get('https://localhost:7268/api/Auth/me');
  }
 
  isLoggedIn(): boolean {
    return !!sessionStorage.getItem(this.JWT_TOKEN);
  }
 
  isTokenExpired(): boolean {
    const tokens = sessionStorage.getItem(this.JWT_TOKEN);
    if (!tokens) return true;
    try {
      const token = JSON.parse(tokens).accessToken;
      const decoded = jwtDecode<any>(token);
      if (!decoded.exp) return true;
      const expirationDate = decoded.exp * 1000;
      const now = Date.now();
      return expirationDate < now;
    } 
    catch (err) {
      console.error('Token decoding failed:', err);
      return true;
    }

  }
 
  //RefreshToken

  refreshToken(): Observable<any> {
    const tokensRaw = sessionStorage.getItem(this.JWT_TOKEN);
    if (!tokensRaw) return of(null);
    const tokens = JSON.parse(tokensRaw);
    const { refreshToken } = tokens;
    return this.http
      .post<any>('https://localhost:7268/api/Auth/refresh', {
        
        refreshToken

      })
      .pipe(
        tap((newTokens: any) => {
          
          const updatedTokens = {
            accessToken: newTokens.accessToken,
            refreshToken: refreshToken  // ✅ fallback
          };
        
          this.storeJwtToken(updatedTokens);
        })
      );
  }
 
  //Refresh token timer

  public startRefreshTokenTimer(accessToken: string, refreshToken: string): void {
    if (this.refreshTokenTimer) {
      clearTimeout(this.refreshTokenTimer);
    }
 
    const decodedAccess: any = jwtDecode(accessToken);
    const accessExpiresAt = decodedAccess.exp * 1000;
    const timeout = accessExpiresAt - Date.now() - 60000; // 1 min before expiry
    const decodedRefresh: any = jwtDecode(refreshToken);
    const refreshExpiresAt = decodedRefresh.exp * 1000;
    if (Date.now() >= refreshExpiresAt) {
      console.warn('Refresh Token Expired');
      this.logout();
      return;
    }
 
    if (timeout > 0) {
      console.log(`Refresh token timer set for ${Math.round(timeout / 1000)} seconds`);
      this.refreshTokenTimer = setTimeout(() => {
        this.refreshToken().subscribe({
          next: (newTokens: any) => {
            const currentTokensRaw = sessionStorage.getItem(this.JWT_TOKEN);
            const currentTokens = currentTokensRaw ? JSON.parse(currentTokensRaw) : {};
          
            const updatedTokens = {
              accessToken: newTokens.accessToken,
              refreshToken: newTokens.refreshToken ?? currentTokens.refreshToken
            };
          
            this.storeJwtToken(updatedTokens);
            this.startRefreshTokenTimer(updatedTokens.accessToken, updatedTokens.refreshToken);
          },

          error: (err) => {
            console.error('Refresh token failed', err);
            this.logout();
          }
        });
      }, timeout);

    } else {
      console.warn('Token about to expire, refreshing immediately');
      this.refreshToken().subscribe({
        next: (newTokens: any) => {
          const currentTokensRaw = sessionStorage.getItem(this.JWT_TOKEN);
          const currentTokens = currentTokensRaw ? JSON.parse(currentTokensRaw) : {};
        
          const updatedTokens = {
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken ?? currentTokens.refreshToken
          };
        
          this.storeJwtToken(updatedTokens);
          this.startRefreshTokenTimer(updatedTokens.accessToken, updatedTokens.refreshToken);
        },

        error: (err) => {
          console.error('Immediate token refresh failed', err);
          this.logout();
        }
      });
    }
  }
 
  public stopRefreshTokenTimer(): void {
    if (this.refreshTokenTimer) {
      clearTimeout(this.refreshTokenTimer);
      this.refreshTokenTimer = undefined;
    }
  }
 

  logout(): void {
    this.stopRefreshTokenTimer();
    sessionStorage.removeItem(this.JWT_TOKEN);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

}

 