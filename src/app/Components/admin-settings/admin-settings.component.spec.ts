 import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AdminSettingsComponent } from './admin-settings.component';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { from, of, throwError } from 'rxjs';
import { TasksService } from '../../Services/tasks.service';
import { UserAuthService } from '../../Services/user-auth.service';
import { UsersService } from '../../Services/users.service';
import { LoggerServiceService } from '../../Services/logger-service.service';
import { ErrorHandler, NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

describe('AdminSettingsComponent', () => {
  let component: AdminSettingsComponent;
  let fixture: ComponentFixture<AdminSettingsComponent>;

  let mockTaskService: any;
  let mockAuthService: any;
  let mockUsersService: any;
  let mockLogger: any;
  let mockErrorHandler: any;

  beforeEach(async () => {
    mockTaskService = jasmine.createSpyObj('TasksService', ['getTaskNotificationAdmin']);
    mockAuthService = jasmine.createSpyObj('UserAuthService', ['logout']);
    mockUsersService = jasmine.createSpyObj('UsersService', ['getUserbyId', 'updateUser', 'updatepassword', 'checkUsernameExists']);
    mockLogger = jasmine.createSpyObj('LoggerServiceService', ['info', 'error']);
    mockErrorHandler = jasmine.createSpyObj('ErrorHandler', ['handleError']);

    await TestBed.configureTestingModule({
      //declarations: [],
      imports: [AdminSettingsComponent, ReactiveFormsModule, FormsModule],
      providers: [ 
        { provide: TasksService, useValue: mockTaskService },
        { provide: UserAuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: LoggerServiceService, useValue: mockLogger },
        { provide: ErrorHandler, useValue: mockErrorHandler },
        { provide: ActivatedRoute, useValue: {} } 
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });


  it('should call all methods inside ngOnInit', fakeAsync(() => {
    fixture = TestBed.createComponent(AdminSettingsComponent);
    component = fixture.componentInstance;
  
    const loadNotificationSpy = spyOn(component, 'loadNotification');
    const setFormStateSettingsSpy = spyOn(component, 'setFormStateSettings');
    const getUserByidSpy = spyOn(component, 'getUserByid');
    const setPswdFormStateSpy = spyOn(component, 'setPswdFormState');
  
    component.ngOnInit();
  
    // Simulate 5 seconds for the timer to emit
    tick(5000);
  
    expect(loadNotificationSpy).toHaveBeenCalled();
    expect(setFormStateSettingsSpy).toHaveBeenCalled();
    expect(getUserByidSpy).toHaveBeenCalled();
    expect(setPswdFormStateSpy).toHaveBeenCalled();
  }));

  it('should unsubscribe from notification timer in ngOnDestroy', () => {
    const subscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);
    (component as any).notificationSubscription = subscription;
  
    component.ngOnDestroy();
  
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });
  

  it('should toggle notificationDropdownVisible', () => {
    expect(component.notificationDropdownVisible).toBeFalse();
    component.toggleNotificationDropdown();
    expect(component.notificationDropdownVisible).toBeTrue();
  });

  it('should load notifications successfully', () => {
    const mockNotifications  = [{ taskId:1, taskName: 'Task1', dueDate:'2025-05-20', taskStatus:'New', userName:'abc', referenceId:'1' }];
    mockTaskService.getTaskNotificationAdmin.and.returnValue(of(mockNotifications));

    component.loadNotification();

    expect(component.notifications).toEqual(mockNotifications);
  });

  it('should handle error when loading notifications fails', () => {
    const consoleSpy = spyOn(console, 'error');
    mockTaskService.getTaskNotificationAdmin.and.returnValue(throwError(() => new Error('Error')));

    component.loadNotification();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load notifications:', jasmine.any(Error));
  });

  it('should close notification dropdown on outside click', () => {
    component.notificationDropdownVisible = true;
  
    const bell = document.createElement('div');
    bell.classList.add('notification-bell');
    document.body.appendChild(bell);
  
    const event = new MouseEvent('click');
    spyOn(document, 'querySelector').and.callFake((selector: string) => {
      if (selector === '.notification-bell') return bell;
      return null;
    });
  
    component.onDocumentClick(event);
    expect(component.notificationDropdownVisible).toBeFalse();
  
    document.body.removeChild(bell);
  });

  

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
    // Arrange
    component.pswdSubmitted = true;
    spyOn(document, 'getElementById').and.returnValue(null);
  
    // Act
    component.openPassswordModel();
  
    // Assert
    expect(document.getElementById).toHaveBeenCalledWith('passwordModal');
    expect(component.pswdSubmitted).toBeFalse(); 
  });

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



  it('should return null if JWT token is missing', () => {
    sessionStorage.removeItem('JWT_TOKEN');
    expect(component.getUserInfoFromToken()).toBeNull();
  });

  it('should return null for invalid base64 in token', () => {
    sessionStorage.setItem('JWT_TOKEN', 'invalid.token.payload');
    const result = component.getUserInfoFromToken();
    expect(result).toBeNull();
  });

  it('should return null if required claims are missing', () => {
  const mockPayload = {
    'someOtherClaim': 'value'
  };
  const base64Payload = btoa(JSON.stringify(mockPayload));
  const mockToken = `header.${base64Payload}.signature`;

  sessionStorage.setItem('JWT_TOKEN', mockToken);

  const result = component.getUserInfoFromToken();

  expect(result).toBeNull();
});

it('should return null if control value equals originalUserName', (done) => {
  const control = new FormControl('admin');
  component.orginalUserName = 'admin';

  const validatorFn = component.UsernameExistsValidator();
  const result = validatorFn(control);

  if (result && 'subscribe' in result) {
    result.subscribe(res => {
      expect(res).toBeNull();
      done();
    });
  } else {
    expect(result).toBeNull();
    done();
  }
});

it('should return validation error if username exists', fakeAsync(() => {
  const control = new FormControl('');
  component.orginalUserName = 'admin';

  const validatorFn = component.UsernameExistsValidator();

  mockUsersService.checkUsernameExists.and.returnValue(of(true)); // Username exists

  const result = validatorFn(control);

  let validationError: any;

  if ('subscribe' in result) {
    result.subscribe(res => {
      validationError = res;
    });
  }

  control.setValue('existingUser'); // Triggers valueChanges
  tick(300); // debounceTime
  tick();

  expect(mockUsersService.checkUsernameExists).toHaveBeenCalledWith('existingUser');
  expect(validationError).toEqual({ usernameTaken: true });
}));



  it('should patch form with user data', () => {
    const mockUser = {
      id: 1,
      name: 'John',
      userName: 'john123',
      email: 'john@example.com',
      phoneNumber: '1234567890',
      gender: 'male',
      status:true,
      roleId:1,
      roleName:'Admin',
      password:''
    };

    spyOn(component, 'getUserInfoFromToken').and.returnValue({ userId: 1, roleId: 1 });
    mockUsersService.getUserbyId.and.returnValue(of(mockUser));

    component.getUserByid();

    expect(component.userByid).toEqual(mockUser);
    expect(component.adminFormSettings.get('userName')?.value).toBe(mockUser.userName);
  });

  it('should update user successfully', () => {
    // Arrange
    const fixture = TestBed.createComponent(AdminSettingsComponent);
    const component = fixture.componentInstance;
    component.setFormStateSettings();
  
    const mockFormValue = {
      id: 1,
      name: 'Test User',
      userName: 'testuser',
      email: 'test@example.com',
      roleid: 1,
      phoneNumber: '1234567890',
      gender: 'male'
    };
  
    component.adminFormSettings.setValue(mockFormValue);
  
    mockUsersService.updateUser.and.returnValue(of({}));
    spyOn(window, 'alert');
    spyOn(component, 'getUserByid');
    spyOn(component.adminFormSettings, 'reset');
    spyOn(component, 'reloadPage');
  
    // Act
    component.updateUser();
  
    // Assert
    expect(mockUsersService.updateUser).toHaveBeenCalledWith(mockFormValue);
    expect(window.alert).toHaveBeenCalledWith('User Updated Successfully....');
    expect(mockLogger.info).toHaveBeenCalledWith('User updated successfully');
    expect(component.getUserByid).toHaveBeenCalled();
    expect(component.adminFormSettings.reset).toHaveBeenCalled();
    expect(component.reloadPage).toHaveBeenCalled();
  });

  it('should show alert if form is invalid', () => {
    component.setFormStateSettings();
    component.adminFormSettings.patchValue({
      name: '',  // Invalid
      email: 'not-an-email',  // Invalid
      phoneNumber: '123', // Too short
      gender: ''
    });
  
    spyOn(window, 'alert');
  
    component.updateUser();
  
    expect(window.alert).toHaveBeenCalledWith('Please Fill All Fields....');
  });

  it('should handle error during user update', () => {
    component.setFormStateSettings();
    component.adminFormSettings.patchValue({
      name: 'John',
      userName: 'john123',
      email: 'john@example.com',
      phoneNumber: '1234567890',
      gender: 'male'
    });

    mockUsersService.updateUser.and.returnValue(throwError(() => new Error('Update failed')));

    spyOn(window, 'alert');

    component.updateUser();

    expect(window.alert).toHaveBeenCalledWith('Failed to update user. Please try again later.');
    expect(mockErrorHandler.handleError).toHaveBeenCalled();
  });

  it('should alert and return if pswdForm is invalid', () => {
    component.setPswdFormState(); // Ensure the form is initialized
  
    // Set invalid form values (missing required fields)
    component.pswdForm.patchValue({
      curpswd: '',
      newpswd: '',
      confrmNewpswd: ''
    });
  
    spyOn(window, 'alert');
  
    component.updatePassword();
  
    expect(window.alert).toHaveBeenCalledWith('Please fill in all fields and ensure passwords match.');
    expect(mockUsersService.updatepassword).not.toHaveBeenCalled();
  });
  
  it('should update password successfully', () => {
    component.setPswdFormState();
    component.pswdForm.patchValue({
      curpswd: 'old123',
      newpswd: 'new123',
      confrmNewpswd: 'new123'
    });

    mockUsersService.updatepassword.and.returnValue(of({}));
    spyOn(window, 'alert');
    spyOn(component, 'reloadPage'); 
    component.closePswdModel = jasmine.createSpy();

    component.updatePassword();

    expect(window.alert).toHaveBeenCalledWith('Password updated successfully');
    expect(component.closePswdModel).toHaveBeenCalled();
    expect(component.reloadPage).toHaveBeenCalled();
  });

  it('should handle error during password update', () => {
    component.setPswdFormState();
    component.pswdForm.patchValue({
      curpswd: 'old123',
      newpswd: 'new123',
      confrmNewpswd: 'new123'
    });

    mockUsersService.updatepassword.and.returnValue(throwError(() => new Error('Password update failed')));
    spyOn(window, 'alert');

    component.updatePassword();

    expect(window.alert).toHaveBeenCalledWith('Failed to update user. Please try again later.');
    expect(component.pswdSubmitted).toBeTrue();
  });

  it('should validate matching passwords', () => {
    const fb = TestBed.inject(FormBuilder);
    const group = fb.group({
      newpswd: '123456',
      confrmNewpswd: '123456'
    }, { validators: component.passwordsMatchValidator() });

    expect(group.valid).toBeTrue();
  });

  it('should invalidate non-matching passwords', () => {
    const fb = TestBed.inject(FormBuilder);
    const group = fb.group({
      newpswd: '123456',
      confrmNewpswd: 'abcdef'
    }, { validators: component.passwordsMatchValidator() });

    expect(group.errors?.['passwordMismatch']).toBeTrue();
  });

  it('should call logout', () => {
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should return null for original username', (done) => {
    const fb = new FormBuilder();
    component.orginalUserName = 'admin';
    const control = fb.control('admin');
  
    const validatorResult = component.UsernameExistsValidator()(control);
    from(validatorResult).subscribe(result => {
      expect(result).toBeNull();
      done();
    });
  });

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
 
    mockUsersService.checkUsernameExists.and.returnValue(of(true)); // username exists
 
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
 
    expect(mockUsersService.checkUsernameExists).toHaveBeenCalledWith('newUser');
    expect(validationError).toEqual({ usernameTaken: true });
  }));

  it('should return null if username does not exist', fakeAsync(() => {
    const control = new FormControl('initialValue');
  
    mockUsersService.checkUsernameExists.and.returnValue(of(false));
  
    const validatorFn = component.UsernameExistsValidator();
  
    const validationResult = validatorFn(control);
  
    let result: ValidationErrors | null | undefined;
  
    if ('subscribe' in validationResult) {
      validationResult.subscribe(res => {
        result = res;
      });
    } else if ('then' in validationResult) {
      validationResult.then(res => {
        result = res;
      });
    }
  
    control.setValue('newUser');
  
    tick(300);
    tick();
  
    expect(mockUsersService.checkUsernameExists).toHaveBeenCalledWith('newUser');
    expect(result).toBeNull();
  }));

  it('should return 1 for role "admin"', () => {
    const result = (component as any).mapRoleNameToId('admin');
    expect(result).toBe(1);
  });
  
  it('should return 2 for role "user"', () => {
    const result = (component as any).mapRoleNameToId('user');
    expect(result).toBe(2);
  });

  it('should return 0 for unknown roles', () => {
    expect((component as any).mapRoleNameToId('unknown')).toBe(0);
    expect((component as any).mapRoleNameToId('')).toBe(0);
  });
  
  it('should throw error for null or undefined', () => {
    expect(() => (component as any).mapRoleNameToId(null)).toThrow();
    expect(() => (component as any).mapRoleNameToId(undefined)).toThrow();
  });

});

 
