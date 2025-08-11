// import { TestBed } from '@angular/core/testing';
// import { CanActivateFn } from '@angular/router';

// import { authGuard } from './auth.guard';

// describe('authGuard', () => {
//   const executeGuard: CanActivateFn = (...guardParameters) => 
//       TestBed.runInInjectionContext(() => authGuard(...guardParameters));

//   beforeEach(() => {
//     TestBed.configureTestingModule({});
//   });

//   it('should be created', () => {
//     expect(executeGuard).toBeTruthy();
//   });
// });
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { UserAuthService } from '../Services/user-auth.service';
import { of, isObservable, firstValueFrom } from 'rxjs';

describe('authGuard', () => {
  let mockAuthService: jasmine.SpyObj<UserAuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('UserAuthService', [
      'isLoggedIn',
      'isTokenExpired',
      'refreshToken',
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: UserAuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('should return true when user is logged in, token valid, and role allowed', async () => {
    sessionStorage.setItem('user_role', 'admin');

    mockAuthService.isLoggedIn.and.returnValue(true);
    mockAuthService.isTokenExpired.and.returnValue(false);

    const guardFn = authGuard(['admin']);

    const result = TestBed.runInInjectionContext(() => guardFn(mockRoute, mockState));

    //Support both Observable and direct boolean
    const finalResult = isObservable(result) ? await firstValueFrom(result) : result;

    expect(finalResult).toBeTrue();
  });
});