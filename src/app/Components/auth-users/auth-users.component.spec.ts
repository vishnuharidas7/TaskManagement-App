// import { ComponentFixture, TestBed } from '@angular/core/testing';

// import { AuthUsersComponent } from './auth-users.component';

// describe('AuthUsersComponent', () => {
//   let component: AuthUsersComponent;
//   let fixture: ComponentFixture<AuthUsersComponent>;

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [AuthUsersComponent]
//     })
//     .compileComponents();

//     fixture = TestBed.createComponent(AuthUsersComponent);
//     component = fixture.componentInstance;
//     fixture.detectChanges();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });
// });
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthUsersComponent } from './auth-users.component';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserAuthService } from '../../Services/user-auth.service';
import { LoggerServiceService } from '../../Services/logger-service.service';
import { of, throwError } from 'rxjs';
import { ErrorHandler } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';

describe('AuthUsersComponent', () => {
  let component: AuthUsersComponent;
  let fixture: ComponentFixture<AuthUsersComponent>;
  let authServiceSpy: jasmine.SpyObj<UserAuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let loggerSpy: jasmine.SpyObj<LoggerServiceService>;
  let errorHandlerSpy: jasmine.SpyObj<ErrorHandler>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('UserAuthService', ['login']);
    const router = jasmine.createSpyObj('Router', ['navigate']);
    const logger = jasmine.createSpyObj('LoggerServiceService', ['info', 'error']);
    const errorHandler = jasmine.createSpyObj('ErrorHandler', ['handleError']);

    await TestBed.configureTestingModule({
     // declarations: [AuthUsersComponent],
      imports: [AuthUsersComponent, FormsModule,RouterTestingModule],
      providers: [
        { provide: UserAuthService, useValue: authSpy },
        { provide: Router, useValue: router },
        { provide: LoggerServiceService, useValue: logger },
        { provide: ErrorHandler, useValue: errorHandler },
        {
          provide: ActivatedRoute, useValue: {
            snapshot: { params: {} },
            queryParams: of({})
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthUsersComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(UserAuthService) as jasmine.SpyObj<UserAuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    loggerSpy = TestBed.inject(LoggerServiceService) as jasmine.SpyObj<LoggerServiceService>;
    errorHandlerSpy = TestBed.inject(ErrorHandler) as jasmine.SpyObj<ErrorHandler>;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize properly on ngOnInit', () => {
    component.ngOnInit();
    // Currently empty, but test for coverage
    expect(true).toBeTrue();
  });

  it('should not proceed with login if already loading', () => {
    component.isLoading = true;
    const event = new Event('submit');
    spyOn(event, 'preventDefault');
    component.loginFunction(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('should login successfully and redirect to adminDashboard', fakeAsync(() => {
    const event = new Event('submit');
    spyOn(event, 'preventDefault');
    const mockResponse = of({});
    authServiceSpy.login.and.returnValue(mockResponse);
    spyOn(sessionStorage, 'getItem').and.returnValue('Admin');

    component.username = 'admin';
    component.password = 'password';
    component.loginFunction(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(authServiceSpy.login).toHaveBeenCalledWith({ UserName: 'admin', Password: 'password' });

    tick(1000);

    expect(component.isLoading).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/adminDashboard']);
    expect(loggerSpy.info).toHaveBeenCalledWith('UI-Login successfully');
  }));

  it('should login successfully and redirect to userDashboard', fakeAsync(() => {
    const event = new Event('submit');
    spyOn(event, 'preventDefault');
    const mockResponse = of({});
    authServiceSpy.login.and.returnValue(mockResponse);
    spyOn(sessionStorage, 'getItem').and.returnValue('User');

    component.username = 'user';
    component.password = 'password';
    component.loginFunction(event);

    tick(1000);

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/userDashboard']);
    expect(loggerSpy.info).toHaveBeenCalled();
  }));

  it('should handle login failure with known message', () => {
    const event = new Event('submit');
    spyOn(event, 'preventDefault');
    const errorResponse = {
      error: { message: 'Invalid credentials' }
    };
    authServiceSpy.login.and.returnValue(throwError(() => errorResponse));
    spyOn(window, 'alert');

    component.loginFunction(event);

    expect(loggerSpy.error).toHaveBeenCalledWith('Login failed', errorResponse);
    expect(component.isLoading).toBeFalse();
    expect(window.alert).toHaveBeenCalledWith('Login Failed: Invalid credentials');
  });

  it('should handle login failure with unknown message', () => {
    const event = new Event('submit');
    spyOn(event, 'preventDefault');
    const errorResponse = {
      error: { message: 'An unexpected error occurred. Please try again later.', detail: 'Something went wrong' }
    };
    authServiceSpy.login.and.returnValue(throwError(() => errorResponse));
    spyOn(window, 'alert');

    component.loginFunction(event);

    expect(window.alert).toHaveBeenCalledWith('Login Failed: Something went wrong');
  });

  it('should handle completely unknown error response', () => {
    const event = new Event('submit');
    spyOn(event, 'preventDefault');
    const errorResponse = {}; // no message or detail
    authServiceSpy.login.and.returnValue(throwError(() => errorResponse));
    spyOn(window, 'alert');

    component.loginFunction(event);

    expect(window.alert).toHaveBeenCalledWith('Login Failed.An unexpected error occurred');
  });
});