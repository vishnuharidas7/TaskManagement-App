import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgotPasswordComponent } from './forgot-password.component';
import { UserAuthService } from '../../Services/user-auth.service';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authServiceSpy: jasmine.SpyObj<UserAuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('UserAuthService', ['sendForgotPasswordEmail']);
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent,RouterTestingModule],
      providers: [
        { provide: UserAuthService, useValue: authServiceSpy },
        {
          provide: ActivatedRoute, useValue: {
            snapshot: { params: {} },
            queryParams: of({})
          }
        }
        
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call sendForgotPasswordEmail if email is empty', () => {
    //arrange
    component.email = '';
    //act
    component.submitForgotPassword();
    //assert
    expect(authServiceSpy.sendForgotPasswordEmail).not.toHaveBeenCalled();
  });

  it('should call sendForgotPasswordEmail when email is provided', () => {
      //arrange
    component.email = 'test@example.com';
    authServiceSpy.sendForgotPasswordEmail.and.returnValue(of(null));
    spyOn(window, 'alert');

    //act
    component.submitForgotPassword();

    //assert
    expect(authServiceSpy.sendForgotPasswordEmail).toHaveBeenCalledWith('test@example.com');
    expect(window.alert).toHaveBeenCalledWith('New password will be sent if email is valid.');
  });

  it('should handle known error response', () => {
    //arrange
    const errorResponse = {
      error: { Error: 'Email not found' }
    };
    component.email = 'wrong@example.com';
    authServiceSpy.sendForgotPasswordEmail.and.returnValue(throwError(() => errorResponse));
    spyOn(window, 'alert');
     //act
    component.submitForgotPassword();
    
    //assert
    expect(window.alert).toHaveBeenCalledWith('Error: Email not found');
  });

  it('should handle unknown error response gracefully', () => {
      //arrange
    const errorResponse = {
      error: {}
    };
    component.email = 'something@example.com';
    authServiceSpy.sendForgotPasswordEmail.and.returnValue(throwError(() => errorResponse));
    spyOn(window, 'alert');
    //act
    component.submitForgotPassword();
    //assert
    expect(window.alert).toHaveBeenCalledWith('Error: Unknown error occurred');
  });
});
