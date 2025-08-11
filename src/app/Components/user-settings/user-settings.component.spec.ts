import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { UserSettingsComponent } from './user-settings.component';
import { UserAuthService } from '../../Services/user-auth.service';
import { UsersService } from '../../Services/users.service';
import { LoggerServiceService } from '../../Services/logger-service.service';
import { ErrorHandler } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

fdescribe('UserSettingsComponent', () => {
  let component: UserSettingsComponent;
  let fixture: ComponentFixture<UserSettingsComponent>;

  let mockAuthService: jasmine.SpyObj<UserAuthService>;
  let mockUserService: jasmine.SpyObj<UsersService>;
  let mockLoggerService: jasmine.SpyObj<LoggerServiceService>;
  let mockErrorHandler: jasmine.SpyObj<ErrorHandler>;

  beforeEach(async () => {

    mockAuthService = jasmine.createSpyObj('UserAuthService', ['logout']);
    mockUserService = jasmine.createSpyObj('UsersService', ['getUserbyId', 'updateUser', 'checkUsernameExists', 'updatepassword']);
    mockLoggerService = jasmine.createSpyObj('LoggerServiceService', ['info', 'error']);
    mockErrorHandler = jasmine.createSpyObj<ErrorHandler>('ErrorHandler', ['handleError']);
    
    await TestBed.configureTestingModule({
      //declarations: [],
      imports: [UserSettingsComponent,ReactiveFormsModule, FormsModule],
      providers: [
        { provide: UserAuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUserService },
        { provide: LoggerServiceService, useValue: mockLoggerService },
        { provide: ErrorHandler, useValue: mockErrorHandler },
        {provide:ActivatedRoute,useValue:{}},
      ]
    })
    .compileComponents();

    // fixture = TestBed.createComponent(UserSettingsComponent);
    // component = fixture.componentInstance;
    // fixture.detectChanges();
  });

  beforeEach(() => {
     // Mock the getUserbyId call to avoid undefined.subscribe
  mockUserService.getUserbyId.and.returnValue(of({
    id:1,
    userName:'amal',
    email:'amal@gmail.com',
    roleId:2,
    roleName:'User',
    status:true,
    name:'Amal',
    phoneNumber:'9898987678',
    gender:'Male',
    password:'amalamal'
  }));
    fixture = TestBed.createComponent(UserSettingsComponent);
    component = fixture.componentInstance;

    // Mock JWT token for decoding
    const mockPayload = {
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': '1',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'user'
    };
    const encodedPayload = btoa(JSON.stringify(mockPayload));
    const mockToken = `header.${encodedPayload}.signature`;
    sessionStorage.setItem('JWT_TOKEN', mockToken);

    fixture.detectChanges(); // triggers ngOnInit
  });

  afterEach(() => {
    sessionStorage.removeItem('JWT_TOKEN');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should call logout on authService', () => {
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });



  describe('getUserInfoFromToken', () => {

    it('should return null when token is not set', () => {
      sessionStorage.removeItem(component.JWT_TOKEN);
      expect(component.getUserInfoFromToken()).toBeNull();
    });
    

    it('should return userId and roleId from a valid JWT token', () => {
      const payload = {
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': '123',
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'admin'
      };
      const base64Payload = btoa(JSON.stringify(payload));
      const fakeToken = `header.${base64Payload}.signature`;
  
      sessionStorage.setItem(component.JWT_TOKEN, fakeToken);
  
      const result = component.getUserInfoFromToken();
      expect(result).toEqual({ userId: 123, roleId: 1 }); // admin => 1
    });
  
    it('should return null if token is malformed', () => {
      sessionStorage.setItem(component.JWT_TOKEN, 'bad.token');
      const result = component.getUserInfoFromToken();
      expect(result).toBeNull();
    });
    
    it('should return null if required claims are missing', () => {
      const payload = {
        someOtherClaim: 'value'
      };
      const base64Payload = btoa(JSON.stringify(payload));
      const fakeToken = `header.${base64Payload}.signature`;
  
      sessionStorage.setItem(component.JWT_TOKEN, fakeToken);
  
      const result = component.getUserInfoFromToken();
      expect(result).toBeNull();
    });
  })

  it('should map role names to correct IDs', () => {
    // @ts-ignore to bypass private access for testing
    expect(component['mapRoleNameToId']('admin')).toBe(1);
    expect(component['mapRoleNameToId']('user')).toBe(2);
    expect(component['mapRoleNameToId']('somethingElse')).toBe(0);
    expect(component['mapRoleNameToId']('ADMIN')).toBe(1);  // test case insensitive
  });


 describe('UsernameExistsValidator', () => {
  it('should return null immediately if control value equals originalUserName', (done) => { 
    const control = new FormControl('existingUser');
    component.orginalUserName = 'existingUser';  // Make sure this is set
  
    const validatorFn = component.UsernameExistsValidator();
    const validationResult = validatorFn(control);
  
    if ('subscribe' in validationResult) {
      validationResult.subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    } else if ('then' in validationResult) {
      validationResult.then(result => {
        expect(result).toBeNull();
        done();
      });
    } else {
      // fallback if neither
      done.fail('Validator did not return an Observable or Promise');
    }
  });
  
  it('should call userService.checkUsernameExists and return validation error if username exists', fakeAsync(() => {
    const control = new FormControl('');
  
    mockUserService.checkUsernameExists.and.returnValue(of(true)); // username exists
  
    control.setValue('newUser');
  
    const validatorFn = component.UsernameExistsValidator();
    const validationResult = validatorFn(control);
  
    let validationError: any;
  
    // Narrow the return type before subscribing or then-ing
    if ('subscribe' in validationResult) {
      validationResult.subscribe(res => {
        validationError = res;
      });
    } else if ('then' in validationResult) {
      validationResult.then(res => {
        validationError = res;
      });
    }

      // Set value AFTER subscribing so valueChanges triggers
    control.setValue('newUser');
  
    tick(300); // debounce time
    tick();
  
    expect(mockUserService.checkUsernameExists).toHaveBeenCalledWith('newUser');
    expect(validationError).toEqual({ usernameTaken: true });
  }));

  it('should return null if username does not exist', fakeAsync(() => {
    const control = new FormControl('');
  
    mockUserService.checkUsernameExists.and.returnValue(of(false)); // username does NOT exist
  
    const validatorFn = component.UsernameExistsValidator();
  
    // Get the validation result
    const validationResult = validatorFn(control);
  
    // Set the value AFTER getting the observable so valueChanges emits
    control.setValue('newUser');
  
    let result: any;
  
    if ('subscribe' in validationResult) {
      validationResult.subscribe((res: ValidationErrors | null) => {
        result = res;
      });
    } else if ('then' in validationResult) {
      validationResult.then((res: ValidationErrors | null) => {
        result = res;
      });
    }
     // Set value AFTER subscribing so valueChanges triggers
     control.setValue('newUser');
  
  
    tick(300); // simulate debounce time
    tick();
  
    expect(mockUserService.checkUsernameExists).toHaveBeenCalledWith('newUser');
    expect(result).toBeNull();
  }));

});

  it('should warn and return early if userInfo is null', () => {
    // Arrange — setup the spy BEFORE anything triggers ngOnInit
    spyOn(component, 'getUserInfoFromToken').and.returnValue(null); // Force return null
    const consoleWarnSpy = spyOn(console, 'warn');
  
    // If you have a global spy from beforeEach, do NOT spyOn again — just assert
    mockUserService.getUserbyId.calls.reset(); // Reset any earlier calls
  
    // Act
    component.getUserByid();
  
    // Assert
    expect(consoleWarnSpy).toHaveBeenCalledWith('User ID not found in token');
    expect(mockUserService.getUserbyId).not.toHaveBeenCalled();
  });
  




  describe('updateUser', () => {

    beforeEach(() => {
      // Setup a basic valid form group
      component.userFormSettings.setValue({
        id: 1,
        userName: 'amal',
        email: 'amal@gmail.com',
        name: 'Amal',
        phoneNumber: '9898987678',
        gender: 'Male',
        roleid: 2,
       // status: true,
       // password: 'amalamal',
       // roleName: 'User'
      });
    });

    it('should alert and return if form is invalid', () => {
      spyOn(window, 'alert');
      component.userFormSettings.markAsTouched(); // make it dirty
      component.userFormSettings.setErrors({ invalid: true });

      component.updateUser();

      expect(window.alert).toHaveBeenCalledWith('Please Fill All Fields....');
    });

    it('should update user successfully and perform all side-effects', fakeAsync(() => {
      const mockResponse = { success: true };

      // Make sure form is valid
      component.userFormSettings.setErrors(null);

      // Spies
      spyOn(window, 'alert');
      spyOn(component, 'reloadPage');
      const resetSpy = spyOn(component.userFormSettings, 'reset');
      const getUserByIdSpy = spyOn(component, 'getUserByid');
      spyOn(console, 'log');

      mockUserService.updateUser.and.returnValue(of(mockResponse));

      component.updateUser();
      tick();

      expect(console.log).toHaveBeenCalledWith(component.userFormSettings.value);
      expect(mockUserService.updateUser).toHaveBeenCalledWith(component.userFormSettings.value);
      expect(window.alert).toHaveBeenCalledWith('User Updated Successfully....');
      expect(mockLoggerService.info).toHaveBeenCalledWith('User updated successfully');
      expect(getUserByIdSpy).toHaveBeenCalled();
      expect(resetSpy).toHaveBeenCalled();
      expect(component.reloadPage).toHaveBeenCalled();
    }));

   it('should handle error when updateUser fails', fakeAsync(() => {
  const mockError = new Error('Update failed');
  component.userFormSettings.setErrors(null); // valid form

  spyOn(window, 'alert');
  spyOn(component, 'reloadPage');
  const resetSpy = spyOn(component.userFormSettings, 'reset');
  const getUserByIdSpy = spyOn(component, 'getUserByid');

  //Correctly simulate error
  mockUserService.updateUser.and.returnValue(throwError(() => mockError));

  component.updateUser();
  tick();

  expect(mockUserService.updateUser).toHaveBeenCalled();
  expect(mockLoggerService.error).toHaveBeenCalledWith('Failed to update user', mockError);
  expect(mockErrorHandler.handleError).toHaveBeenCalledWith(mockError);
  expect(window.alert).toHaveBeenCalledWith('Failed to update user. Please try again later.');
  expect(getUserByIdSpy).not.toHaveBeenCalled();
  expect(resetSpy).not.toHaveBeenCalled();
  expect(component.reloadPage).not.toHaveBeenCalled();
}));
});


describe('passwordsMatchValidator', () => {
  it('should return null when passwords match', () => {
    const validatorFn = component.passwordsMatchValidator();

    const formGroup = new FormGroup({
      newpswd: new FormControl('password123'),
      confrmNewpswd: new FormControl('password123'),
    });

    const result = validatorFn(formGroup);
    expect(result).toBeNull();
  });

  it('should return error when passwords do not match', () => {
    const validatorFn = component.passwordsMatchValidator();

    const formGroup = new FormGroup({
      newpswd: new FormControl('password123'),
      confrmNewpswd: new FormControl('differentPassword'),
    });

    const result = validatorFn(formGroup);
    expect(result).toEqual({ passwordMismatch: true });
  });

  it('should return null if one or both controls are missing', () => {
    const validatorFn = component.passwordsMatchValidator();

    const formGroup = new FormGroup({
      newpswd: new FormControl('password123')
      // confrmNewpswd is missing
    });

    const result = validatorFn(formGroup);
    expect(result).toBeNull();
  });
});

describe('openPassswordModel',()=>{
  it('should set pswdSubmitted to false and display passwordModal when element exists', () => {
    component.pswdSubmitted = true; // initially true, to test change
  
    // Create a mock element with a style object
    const mockElement = {
      style: { display: '' }
    } as unknown as HTMLElement;
  
    // Spy on document.getElementById to return mockElement
    spyOn(document, 'getElementById').and.returnValue(mockElement);
  
    component.openPassswordModel();
  
    expect(component.pswdSubmitted).toBeFalse();
    expect(document.getElementById).toHaveBeenCalledWith('passwordModal');
    expect(mockElement.style.display).toBe('block');
  });
  
  it('should set pswdSubmitted to false and do nothing if element is null', () => {
    component.pswdSubmitted = true;
  
    spyOn(document, 'getElementById').and.returnValue(null);
  
    component.openPassswordModel();
  
    expect(component.pswdSubmitted).toBeFalse();
    expect(document.getElementById).toHaveBeenCalledWith('passwordModal');
    // Nothing else to check, since element was null
  });
  

})

describe('closePasswordModel',()=>{
  it('should hide the password modal when passwordModal exists', () => {
    component.passwordModal = {
      nativeElement: {
        style: { display: 'block' }
      }
    } as any;
  
    component.closePswdModel();
  
    expect(component.passwordModal!.nativeElement.style.display).toBe('none');
  });
  
  it('should not throw error if passwordModal is null', () => {
    component.passwordModal = undefined;
  
    expect(() => component.closePswdModel()).not.toThrow();
  });
})
 
describe('updatePassword',()=>{
  it('should show alert and return if form is invalid', () => {
    spyOn(window, 'alert');

    component.pswdForm.setErrors({ required: true }); // mark form invalid

    component.updatePassword();

    expect(window.alert).toHaveBeenCalledWith('Please fill in all fields and ensure passwords match.');
  });

  it('should update password and perform all success actions when form is valid', () => {
    // Arrange
    const formValue = {
      id: 1,
      curpswd: 'oldpass',
      newpswd: 'newpass123',
      confrmNewpswd: 'newpass123'
    };
  
    component.pswdForm.setValue(formValue);
    mockUserService.updatepassword.and.returnValue(of({}));
  
    // Spies
    const alertSpy = spyOn(window, 'alert');
    const resetSpy = spyOn(component.pswdForm, 'reset');
    const closeSpy = spyOn(component, 'closePswdModel');
    const reloadSpy = spyOn(component, 'reloadPage');
  
    // Act
    component.updatePassword();
  
    // Assert
    expect(alertSpy).toHaveBeenCalledWith('Password updated successfully');
    expect(resetSpy).toHaveBeenCalled();
    expect(component.pswdSubmitted).toBeTrue();
    expect(closeSpy).toHaveBeenCalled();
    expect(reloadSpy).toHaveBeenCalled();
  });
  
  it('should handle error if password update fails', () => {
    const alertSpy = spyOn(window, 'alert');
    const consoleErrorSpy = spyOn(console, 'error');
    const mockError = new Error('Update failed');

    //spyOn((component as any).errorHandler, 'handleError');
    mockUserService.updatepassword.and.returnValue(throwError(() => mockError));

    component.pswdForm.setValue({
      id: 1,
      curpswd: 'oldpass',
      newpswd: 'newpass123',
      confrmNewpswd: 'newpass123'
    });

    component.updatePassword();

    expect(component.pswdSubmitted).toBeTrue();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update user', mockError);
    expect(mockLoggerService.error).toHaveBeenCalledWith('Failed to update user', mockError);
    expect(mockErrorHandler.handleError).toHaveBeenCalledWith(mockError);
    expect(alertSpy).toHaveBeenCalledWith('Failed to update user. Please try again later.');
  });
})






});
