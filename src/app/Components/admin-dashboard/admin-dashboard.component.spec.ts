import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { UserAuthService } from '../../Services/user-auth.service';
import { UsersService } from '../../Services/users.service';
import { TasksService } from '../../Services/tasks.service';
import { LoggerServiceService } from '../../Services/logger-service.service';
import { ErrorHandler } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormControl, ValidationErrors } from '@angular/forms';
import { Observable, from, of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Tasks } from '../../Models/tasks';
import { NotificationTask } from '../../Models/notificationTask';
import { Users } from '../../Models/users';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;

  let mockUserService: jasmine.SpyObj<UsersService>;
  let mockTaskService: jasmine.SpyObj<TasksService>;
  let mockAuthService: jasmine.SpyObj<UserAuthService>;
  let mockLogger: jasmine.SpyObj<LoggerServiceService>;
  let mockErrorHandler: jasmine.SpyObj<ErrorHandler>;

  beforeEach(async () => {
    mockUserService = jasmine.createSpyObj('UsersService', [
      'getAllUsers',
      'getUserbyId',
      'updateUser',
      'checkUsernameExists',
      'updatepassword'
    ]);
    mockTaskService = jasmine.createSpyObj('TasksService', [
      'getAllTasks',
      'getTaskNotificationAdmin'
    ]);
    mockAuthService = jasmine.createSpyObj('UserAuthService', ['logout']);
    mockLogger = jasmine.createSpyObj('LoggerServiceService', ['error', 'info']);
    mockErrorHandler = jasmine.createSpyObj('ErrorHandler', ['handleError']);

    await TestBed.configureTestingModule({
      //declarations: [],  // Component goes here
      imports: [AdminDashboardComponent , ReactiveFormsModule, FormsModule],  // Only NgModules here
      providers: [
        { provide: UsersService, useValue: mockUserService },
        { provide: TasksService, useValue: mockTaskService },
        { provide: UserAuthService, useValue: mockAuthService },
        { provide: LoggerServiceService, useValue: mockLogger },
        { provide: ErrorHandler, useValue: mockErrorHandler },
        { provide: ActivatedRoute, useValue: {} }  // Provide a dummy/mock ActivatedRoute
      ],
      schemas: [NO_ERRORS_SCHEMA]  // Ignore unknown elements (like router-outlet)
    }).compileComponents();
  });
  

  beforeEach(() => {

    mockUserService.getAllUsers.and.returnValue(of([]));

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    //fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call getUser and getTask on ngOnInit', () => {
    spyOn(component, 'getUser');
    spyOn(component, 'getTask');

    component.ngOnInit();

    expect(component.getUser).toHaveBeenCalled();
    expect(component.getTask).toHaveBeenCalled();
   });
   
   describe('mapRoleNameToId', () => {
    it('should return 1 for "admin"', () => {
      const result = component['mapRoleNameToId']('admin');
      expect(result).toBe(1);
    });

    it('should return 2 for "user"', () => {
      const result = component['mapRoleNameToId']('user');
      expect(result).toBe(2);
    });

    it('should return 1 for "ADMIN" (case insensitive)', () => {
      const result = component['mapRoleNameToId']('ADMIN');
      expect(result).toBe(1);
    });

    it('should return 0 for unknown role "manager"', () => {
      const result = component['mapRoleNameToId']('manager');
      expect(result).toBe(0);
    });

    it('should return 0 for empty string', () => {
      const result = component['mapRoleNameToId']('');
      expect(result).toBe(0);
    });
  });

  


   it('should unsubscribe from notificationSubscription on destroy', () => {
    const mockSub = jasmine.createSpyObj('Subscription', ['unsubscribe']);
    (mockSub as any).closed = false;
  
    (component as any).notificationSubscription = mockSub;
  
    component.ngOnDestroy();
  
    expect(mockSub.unsubscribe).toHaveBeenCalled();
  });

  it('should not close the dropdown if click is inside bell or dropdown', () => {
    // Arrange
    const bell = document.createElement('div');
    bell.classList.add('notification-bell');
  
    const dropdown = document.createElement('div');
    dropdown.classList.add('notification-dropdown');
  
    document.body.appendChild(bell);
    document.body.appendChild(dropdown);
  
    const insideBellEvent = new MouseEvent('click', { bubbles: true });
    const insideDropdownEvent = new MouseEvent('click', { bubbles: true });
  
    spyOn(document, 'querySelector').and.callFake((selector: string) => {
      if (selector === '.notification-bell') return bell;
      if (selector === '.notification-dropdown') return dropdown;
      return null;
    });
  
    component.notificationDropdownVisible = true;
  
    // Act - Click inside bell
    component.onDocumentClick({ target: bell } as unknown as MouseEvent);
    expect(component.notificationDropdownVisible).toBeTrue();
  
    // Act - Click inside dropdown
    component.onDocumentClick({ target: dropdown } as unknown as MouseEvent);
    expect(component.notificationDropdownVisible).toBeTrue();
  
    // Cleanup
    document.body.removeChild(bell);
    document.body.removeChild(dropdown);
  });
  
  it('should close the dropdown if click is outside bell and dropdown', () => {
    // Arrange
    const bell = document.createElement('div');
    bell.classList.add('notification-bell');
  
    const dropdown = document.createElement('div');
    dropdown.classList.add('notification-dropdown');
  
    document.body.appendChild(bell);
    document.body.appendChild(dropdown);
  
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);
  
    spyOn(document, 'querySelector').and.callFake((selector: string) => {
      if (selector === '.notification-bell') return bell;
      if (selector === '.notification-dropdown') return dropdown;
      return null;
    });
  
    component.notificationDropdownVisible = true;
  
    // Act
    component.onDocumentClick({ target: outsideElement } as unknown as MouseEvent);
  
    // Assert
    expect(component.notificationDropdownVisible).toBeFalse();
  
    // Cleanup
    document.body.removeChild(bell);
    document.body.removeChild(dropdown);
    document.body.removeChild(outsideElement);
  });

   describe('Pagination Logic', () => {

    it('should return correct paginated tasks for current page', () => {
      component.pageSize = 2;
      component.currentPage = 2;
      component.taskLists = [
        { taskId: 1 }, { taskId: 2 },
        { taskId: 3 }, { taskId: 4 },
        { taskId: 5 }
      ] as any;
  
      const paginated = component.paginatedTasks;
      expect(paginated.length).toBe(2);
      expect(paginated[0].taskId).toBe(3);
      expect(paginated[1].taskId).toBe(4);
    });
  
    it('should return correct totalPages based on taskLists and pageSize', () => {
      component.taskLists = new Array(10).fill({}).map((_, i) => ({ taskId: i + 1 })) as any;
      component.pageSize = 3;
  
      const totalPages = component.totalPages;
      expect(totalPages).toBe(4);  // 10 items / 3 per page => ceil(3.33) = 4
    });
  
    it('should update pageSize and reset currentPage to 1 on page size change', () => {
      component.currentPage = 3;
      const event = {
        target: { value: '5' }
      } as unknown as Event;
  
      component.onPageSizeChange(event);
  
      expect(component.pageSize).toBe(5);
      expect(component.currentPage).toBe(1);
    });
  
  });


  it('should load users successfully', () => {
    const mockUsers = [{
      id: 1,
      name: 'John',
      userName: 'john',
      roleId: 1,
      roleName: 'Admin',
      email: 'john@gmail.com',
      status: true,
      phoneNumber: '1232112343',
      password: '',
      gender: ''
    }];

    mockUserService.getAllUsers.and.returnValue(of(mockUsers));

    component.getUser();

    expect(component.userList).toEqual(mockUsers as any);
    expect(component.userCount).toBe(1);
  });

  it('should handle error while loading users', () => {
    mockUserService.getAllUsers.and.returnValue(throwError(() => new Error('User load error')));

    component.getUser();

    expect(mockLogger.error).toHaveBeenCalled();
    expect(mockErrorHandler.handleError).toHaveBeenCalled();
  });

  it('should toggle notification dropdown visibility', () => {
    component.notificationDropdownVisible = false;
    component.toggleNotificationDropdown();
    expect(component.notificationDropdownVisible).toBeTrue();
  });

  it('should decode JWT and extract user info correctly', () => {
    const payload = {
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': '10',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'admin'
    };
    const token = `header.${btoa(JSON.stringify(payload))}.signature`;

    spyOn(sessionStorage, 'getItem').and.returnValue(token);

    const userInfo = component.getUserInfoFromToken();

    expect(userInfo).toEqual({ userId: 10, roleId: 1 });
  });

  it('should return null for invalid token in getUserInfoFromToken', () => {
    spyOn(sessionStorage, 'getItem').and.returnValue(null);

    const result = component.getUserInfoFromToken();

    expect(result).toBeNull();
  });

  it('should return null if userIdString or roleName is missing in the token payload', () => {
    // Only include one of the required claims
    const payload = {
      // Missing userId claim:
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'admin'
    };
    const token = `header.${btoa(JSON.stringify(payload))}.signature`;
  
    spyOn(sessionStorage, 'getItem').and.returnValue(token);
  
    const result = component.getUserInfoFromToken();
  
    expect(result).toBeNull();
  });

  it('should return null and log an error when JWT parsing fails', () => {
    // Simulate a malformed base64 payload
    const invalidBase64Payload = '!!!invalidbase64@@@';
    const token = `header.${invalidBase64Payload}.signature`;
  
    spyOn(sessionStorage, 'getItem').and.returnValue(token);
    spyOn(console, 'error');
  
    const result = component.getUserInfoFromToken();
  
    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      'Error parsing JWT token:',
      jasmine.any(Error)
    );
  });


  it('should load tasks and update stats correctly', () => {
    const mockTasks : Tasks[] = [
      { taskId: 1, taskName:'prod issue',taskDescription:'', taskType:'',
      taskState:'', userName:'david', userId:1, dueDate: new Date('2025-08-10'),
      priority:'', createdBy:1, referenceId:'', taskStatus: 'Completed' },
      { taskId: 2, taskName:'testing',taskDescription:'', taskType:'',
      taskState:'', userName:'clement', userId:2, dueDate: new Date('2025-08-10'),
      priority:'', createdBy:2, referenceId:'', taskStatus: 'OnDue' },
      { taskId: 3, taskName:'featur',taskDescription:'', taskType:'',
      taskState:'', userName:'John', userId:3, dueDate: new Date('2025-08-10'),
      priority:'', createdBy:1, referenceId:'', taskStatus: 'New' }
    ];
  
    mockTaskService.getAllTasks.and.returnValue(of(mockTasks));
  
    component.getTask();
  
    expect(component.taskLists.length).toBe(3);
    expect(component.taskCount).toBe(3);
  
    expect(component.stats.find(s => s.title === 'Total Tasks')?.count).toBe(3);
    expect(component.stats.find(s => s.title === 'Completed Tasks')?.count).toBe(1);
    expect(component.stats.find(s => s.title === 'Pending Tasks')?.count).toBe(1);
    expect(component.stats.find(s => s.title === 'New Tasks')?.count).toBe(1);
  });

  it('should handle error when loading tasks', () => {
    const mockError = new Error('Failed to load tasks');
    
    // Arrange: return an observable that throws an error
    mockTaskService.getAllTasks.and.returnValue(throwError(() => mockError));
  
    // Act
    spyOn(window, 'alert'); // prevent actual alert popup
    component.getTask();
  
    // Assert
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to load task list', mockError);
    expect(mockErrorHandler.handleError).toHaveBeenCalledWith(mockError);
    expect(window.alert).toHaveBeenCalledWith('Faild to load tasks.');
  });

  it('should log an error and return if userInfo is null', () => {
    // Arrange: Make getUserInfoFromToken return null
    spyOn(component, 'getUserInfoFromToken').and.returnValue(null);
    const consoleErrorSpy = spyOn(console, 'error');
  
    // Act
    component.goToSettingsOpenModal();
  
    // Assert
    expect(consoleErrorSpy).toHaveBeenCalledWith('User ID not found in token');
  });

  it('should load notifications successfully', () => {
    const mockNotifications : NotificationTask [] = [
      { taskId: 1, taskName: 'Fix Bug', taskStatus: 'New', dueDate: '2025-08-15', userName:'john', referenceId:'' },
      { taskId: 2, taskName: 'Testing', taskStatus: 'New', dueDate: '2025-08-05', userName:'john', referenceId:'' },
    ];
  
    mockTaskService.getTaskNotificationAdmin.and.returnValue(of(mockNotifications));
  
    component.loadNotification();
  
    expect(component.notifications).toEqual(mockNotifications as any);
    expect(mockTaskService.getTaskNotificationAdmin).toHaveBeenCalled();
  });

  it('should handle error when loading notifications', () => {
    const mockError = new Error('Notification fetch failed');
  
    spyOn(console, 'error');
    mockTaskService.getTaskNotificationAdmin.and.returnValue(throwError(() => mockError));
  
    component.loadNotification();
  
    expect(console.error).toHaveBeenCalledWith('Failed to load notifications:', mockError);
  });

  it('should call logout method from UserAuthService', () => {
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should initialize userFormSettings form with correct controls and validators', () => {
    const mockUserInfo = { userId: 123, roleId: 1 };
    spyOn(component, 'getUserInfoFromToken').and.returnValue(mockUserInfo);
  
    component.setFormStateSettings();
  
    const form = component.userFormSettings;
  
    expect(form).toBeTruthy();
    expect(form.get('id')?.value).toBe(123);
    expect(form.get('roleid')?.value).toBe(1);
  
    expect(form.get('name')).toBeTruthy();
    expect(form.get('userName')).toBeTruthy();
    expect(form.get('email')).toBeTruthy();
    expect(form.get('password')).toBeTruthy();
    expect(form.get('phoneNumber')).toBeTruthy();
    expect(form.get('gender')).toBeTruthy();
  
    // Check required validator
    expect(form.get('name')?.hasError('required')).toBeTrue();
    form.get('name')?.setValue('John');
    expect(form.get('name')?.valid).toBeTrue();
  });

  it('should mark required fields as invalid when empty', () => {
    spyOn(component, 'getUserInfoFromToken').and.returnValue({ userId: 1, roleId: 1 });
  
    component.setFormStateSettings();
  
    component.userFormSettings.patchValue({
      name: '',
      userName: '',
      email: '',
      password: '',
      phoneNumber: '',
      gender: ''
    });
  
    expect(component.userFormSettings.valid).toBeFalse();
    expect(component.userFormSettings.get('name')?.hasError('required')).toBeTrue();
    expect(component.userFormSettings.get('userName')?.hasError('required')).toBeTrue();
  });

  it('should validate correct and incorrect email formats', () => {
    component.setFormStateSettings();
  
    const emailControl = component.userFormSettings.get('email');
    emailControl?.setValue('invalid-email');
  
    expect(emailControl?.valid).toBeFalse();
    expect(emailControl?.hasError('email')).toBeTrue();
  
    emailControl?.setValue('valid@example.com');
    expect(emailControl?.valid).toBeTrue();
  });

  it('should validate phone number format and length', () => {
    component.setFormStateSettings();
  
    const phoneControl = component.userFormSettings.get('phoneNumber');
  
    phoneControl?.setValue('123'); // too short
    expect(phoneControl?.valid).toBeFalse();
  
    phoneControl?.setValue('abcdefghij'); // invalid characters
    expect(phoneControl?.valid).toBeFalse();
  
    phoneControl?.setValue('1234567890'); // valid
    expect(phoneControl?.valid).toBeTrue();
  });

  it('should not trigger username validator initially if username matches originalUsername', fakeAsync(() => {
    component.orginalUserName = 'john';
    component.setFormStateSettings();
  
    component.userFormSettings.get('userName')?.setValue('john');
    tick(300); // debounceTime
  
    component.userFormSettings.get('userName')?.statusChanges.subscribe(status => {
      expect(status).toBe('VALID');
    });
  }));

  describe('getUserByid', () => {
    beforeEach(() => {
      spyOn(console, 'warn');
    });
  
    it('should warn and return if userInfo is not found', () => {
      spyOn(component, 'getUserInfoFromToken').and.returnValue(null);
  
      component.getUserByid();
  
      expect(console.warn).toHaveBeenCalledWith('User ID not found in token');
      // No further calls expected
    });
  
    it('should call userService.getUserbyId and assign userByid when userInfo is found', () => {
      const mockUserInfo = { userId: 123, roleId:1 };
      const mockResponse: Users = { id: 123, roleId: 1, name: 'Test User', phoneNumber: '12', userName:'test', roleName:'admin',
    email:'test@example.com', gender:'Male', status:true,  password:'test'  };
  
      spyOn(component, 'getUserInfoFromToken').and.returnValue(mockUserInfo);
      (component as any).userService = {
        getUserbyId: jasmine.createSpy().and.returnValue({
          subscribe: (callback: any) => {
            callback(mockResponse);
          }
        })
      } as any;
  
      component.getUserByid();
  
      expect((component as any).userService.getUserbyId).toHaveBeenCalledWith(123);
      expect(component.userByid).toEqual(mockResponse);
    });
  });

  it('should return the userName FormControl from userFormSettings', () => {
    const mockControl = new FormControl('testUser');
  
    component.userFormSettings = {
      get: jasmine.createSpy('get').and.callFake((controlName: string) => {
        if (controlName === 'userName') {
          return mockControl;
        }
        return null;
      })
    } as any;
  
    const result = component.userNameControl;
  
    expect(component.userFormSettings.get).toHaveBeenCalledWith('userName');
    expect(result).toBe(mockControl);
  });

  it('should return the email FormControl from userFormSettings', () => {
    const mockEmailControl = new FormControl('test@example.com');
  
    component.userFormSettings = {
      get: jasmine.createSpy('get').and.callFake((controlName: string) => {
        if (controlName === 'email') {
          return mockEmailControl;
        }
        return null;
      })
    } as any;
  
    const result = component.emailControl;
  
    expect(component.userFormSettings.get).toHaveBeenCalledWith('email');
    expect(result).toBe(mockEmailControl);
  });

  it('should return the phoneNumber FormControl from userFormSettings', () => {
    const mockPhoneNumberControl = new FormControl('1234567890');
  
    component.userFormSettings = {
      get: jasmine.createSpy('get').and.callFake((controlName: string) => {
        if (controlName === 'phoneNumber') {
          return mockPhoneNumberControl;
        }
        return null;
      })
    } as any;
  
    const result = component.phoneNumberControl;
  
    expect(component.userFormSettings.get).toHaveBeenCalledWith('phoneNumber');
    expect(result).toBe(mockPhoneNumberControl);
  });



  it('should fetch user by ID and open the settings modal', fakeAsync(() => {
    const userInfo = { userId: 1, roleId: 1 };
    const mockUser: Users = {
      id: 1,
      name: 'John Doe',
      userName: 'john',
      email: 'john@example.com',
      password: '1234',
      phoneNumber: '1234567890',
      gender: 'male',
      roleId: 1,
      roleName: 'admin',
      status: true
    };
  
    const fb = new FormBuilder();
    
    component.userFormSettings = fb.group({
      name: [''],
      userName: [''],
      email: [''],
      password: [''],
      phoneNumber: [''],
      gender: [''],
      role: ['']
    });

    spyOn(component, 'getUserInfoFromToken').and.returnValue(userInfo);
    mockUserService.getUserbyId.and.returnValue(of(mockUser));
  
    spyOn(document, 'getElementById').and.returnValue({
      style: { display: 'none' }
    } as any);
  
    component.goToSettingsOpenModal();
  
    tick(); // simulate observable completion
  
    expect(mockUserService.getUserbyId).toHaveBeenCalledWith(1);
    expect(component.userByid).toEqual(mockUser);
    expect(component.orginalUserName).toBe('john');
    expect(component.userFormSettings.get('name')?.value).toBe('John Doe');
    expect(document.getElementById).toHaveBeenCalledWith('settingsModel');
  }));

  it('should handle error when fetching user fails in goToSettingsOpenModal', fakeAsync(() => {
    const userInfo = { userId: 1, roleId: 1 };
    spyOn(component, 'getUserInfoFromToken').and.returnValue(userInfo);
    mockUserService.getUserbyId.and.returnValue(throwError(() => new Error('User fetch failed')));
    
    // Spy on alert and console
    spyOn(window, 'alert');
    spyOn(console, 'error');
  
    // DOM element mock (modal should not be shown)
    spyOn(document, 'getElementById').and.returnValue({
      style: { display: 'none' }
    } as any);
  
    component.goToSettingsOpenModal();
  
    tick();
  
    expect(mockUserService.getUserbyId).toHaveBeenCalledWith(1);
    expect(component.userByid).toBeNull();
    expect(window.alert).toHaveBeenCalledWith('Failed to load user settings.');
    expect(console.error).toHaveBeenCalledWith('Error fetching user', jasmine.any(Error));
    // You can also check that modal did not become visible
    const modal = document.getElementById('settingsModel');
    expect(modal?.style.display).toBe('none');
  }));

  it('should reset the form and hide the settings modal', () => {
    // Arrange: mock modal element
    const mockElement = {
      style: { display: 'block' }
    };
    component.settingModel = {
      nativeElement: mockElement
    } as any;
  
    // Spy on setFormStateSettings and reset
    const formResetSpy = spyOn(component.userFormSettings, 'reset');
    const formStateSpy = spyOn(component, 'setFormStateSettings');
  
    // Act
    component.closeGotoSettingModal();
  
    // Assert
    expect(formStateSpy).toHaveBeenCalled();
    expect(mockElement.style.display).toBe('none');
    expect(formResetSpy).toHaveBeenCalled();
  });

  // it('should return { usernameTaken: true } if username exists', fakeAsync(() => {
  //   // Mock the userService method
  //   const mockUserService = {
  //     checkUsernameExists: jasmine.createSpy().and.returnValue(of(true))
  //   };
  
  //   // Inject the mock service into the component manually if needed
  //   //component.user = mockUserService as any;
  
  //   const validator = component.UsernameExistsValidator();
  //   const control = new FormControl('existingUser');
  //   control.setAsyncValidators(validator);
  
  //   // Trigger valueChanges by setting the value
  //   control.setValue('existingUser');
  //   tick(300); // simulate debounceTime
  
  //   (validator(control) as Observable<ValidationErrors | null>).subscribe(result => {
  //     expect(mockUserService.checkUsernameExists).toHaveBeenCalledWith('newUser');
  //     expect(result).toEqual({ usernameTaken: true });
  //   });
  // }));


  // it('should call updateUser service on valid form', fakeAsync(() => {
  //   spyOn(window, 'alert');
  //   spyOn(window.location, 'reload');
  //   spyOn(component, 'getUserByid');
  //   spyOn(component, 'closeGotoSettingModal');

  //   component.userFormSettings.patchValue({
  //     name: 'John Doe',
  //     userName: 'john',
  //     email: 'john@example.com',
  //     password: '123456',
  //     phoneNumber: '1234567890',
  //     gender: 'Male'
  //   });

  //   mockUserService.updateUser.and.returnValue(of({}));

  //   component.updateUser();
  //   tick();

  //   expect(mockUserService.updateUser).toHaveBeenCalled();
  //   expect(window.alert).toHaveBeenCalledWith('User Updated Successfully....');
  //   expect(component.getUserByid).toHaveBeenCalled();
  //   expect(component.closeGotoSettingModal).toHaveBeenCalled();
  //   expect(window.location.reload).toHaveBeenCalled();
  // }));
  // it('should call updateUser service on valid form', fakeAsync(() => {
  //   spyOn(window, 'alert');
  //   spyOn(window.location, 'reload').and.callFake(() => {});
  //   spyOn(component, 'getUserByid');
  //   spyOn(component, 'closeGotoSettingModal');
  
  //   spyOn(component, 'getUserInfoFromToken').and.returnValue({ userId: 123,
  //     roleId: 1
  //   });
  
  //   // patch all required fields including id and roleid
  //   component.userFormSettings.patchValue({
  //     id: '123',
  //     roleid: 'admin',
  //     name: 'John Doe',
  //     userName: 'john',
  //     email: 'john@example.com',
  //     password: '123456',
  //     phoneNumber: '1234567890',
  //     gender: 'Male'
  //   });
  
  //   // optionally, disable async validators for userName
  //  // component.userFormSettings.controls['userName'].setAsyncValidators(null);
  //  spyOn(component, 'UsernameExistsValidator').and.returnValue(() => null);

  //   mockUserService.updateUser.and.returnValue(of({}));
  
  //   component.updateUser();
  //   tick();
  
  //   expect(mockUserService.updateUser).toHaveBeenCalled();
  //   expect(window.alert).toHaveBeenCalledWith('User Updated Successfully....');
  //   expect(component.getUserByid).toHaveBeenCalled();
  //   expect(component.closeGotoSettingModal).toHaveBeenCalled();
  //   expect(window.location.reload).toHaveBeenCalled();
  // }));
  

  // it('should not trigger username validator initially if username matches originalUsername', () => {
  //   component.orginalUserName = 'john';
  //   component.userFormSettings.controls['userName'].setValue('john');
  
  //   const errors = component.userFormSettings.controls['userName'].errors;
  //   expect(errors).toBeNull(); // no validation errors because username matches original
  // });



  // it('should call updateUser service on valid form', fakeAsync(() => {
  //   spyOn(window, 'alert');
  //   spyOn(window.location, 'reload').and.callFake(() => {});
  //   spyOn(component, 'getUserByid');
  //   spyOn(component, 'closeGotoSettingModal');
  
  //   spyOn(component, 'getUserInfoFromToken').and.returnValue({
  //     userId: 123,
  //     roleId: 1
  //   });
  
  //   // Mock async validator to always pass
  //   spyOn(component, 'UsernameExistsValidator').and.returnValue(() => Promise.resolve(null));
  
  //   // Rebuild form with mocked async validator
  //   component.setFormStateSettings();
  
  //   component.userFormSettings.patchValue({
  //     id: '123',
  //     roleid: 'admin',
  //     name: 'John Doe',
  //     userName: 'john',
  //     email: 'john@example.com',
  //     password: '123456',
  //     phoneNumber: '1234567890',
  //     gender: 'Male'
  //   });
  
  //   mockUserService.updateUser.and.returnValue(of({}));
  
  //   component.userFormSettings.updateValueAndValidity();
  //   component.updateUser();
  //   tick();
  
  //   expect(mockUserService.updateUser).toHaveBeenCalled();
  //   expect(window.alert).toHaveBeenCalledWith('User Updated Successfully....');
  //   expect(component.getUserByid).toHaveBeenCalled();
  //   expect(component.closeGotoSettingModal).toHaveBeenCalled();
  //   expect(window.location.reload).toHaveBeenCalled();
  // }));
  it('should return { usernameTaken: true } if username exists', fakeAsync(() => {
    // Arrange
    const mockUserService = {
      checkUsernameExists: jasmine.createSpy().and.returnValue(of(true))  // ✅ returns observable
    };
  
    //component.userService = mockUserService as any;
    component.orginalUserName = 'originalUser';
  
    const validator = component.UsernameExistsValidator();
    const control = new FormControl('newUser');
  
    // Manually simulate valueChanges (required for async validator to work)
    control.setValue('newUser'); // triggers valueChanges
  
    // Wait for debounce time
    tick(300);
  
    (validator(control) as any).subscribe((result: ValidationErrors | null) => {
      expect(mockUserService.checkUsernameExists).toHaveBeenCalledWith('newUser');
      expect(result).toEqual({ usernameTaken: true });
    });
  }));

  it('should return null if username does not exist', fakeAsync(() => {
    const mockUserService = {
      checkUsernameExists: jasmine.createSpy().and.returnValue(of(false))
    };
  
    // Inject mocked service
    (component as any).userService = mockUserService;
    (component as any).orginalUserName = 'originalUser';
  
    const validator = component.UsernameExistsValidator();
    const control = new FormControl('newUser');
  
    // Force the type as Observable so we can safely subscribe
    const result$ = validator(control) as Observable<ValidationErrors | null>;
  
    tick(300);
  
    result$.subscribe(result => {
      expect(result).toBeNull();
      expect(mockUserService.checkUsernameExists).toHaveBeenCalledWith('newUser');
    });
  }));

  it('should return null if username is same as original username', (done) => {
    const mockUserService = {
      checkUsernameExists: jasmine.createSpy()
    };
  
    //component.userService = mockUserService as any;
    component.orginalUserName = 'sameUser';
  
    const validator = component.UsernameExistsValidator();
    const control = new FormControl('sameUser');
  
    const result = validator(control);
  
    from(result).subscribe(res => {
      expect(res).toBeNull();
      expect(mockUserService.checkUsernameExists).not.toHaveBeenCalled();
      done();
    });
  });


  it('should alert and return if userFormSettings is invalid', () => {
    spyOn(window, 'alert');
    component.userFormSettings = {
      invalid: true,
      value: {},
      reset: jasmine.createSpy()
    } as any;
  
    component.updateUser();
  
    expect(window.alert).toHaveBeenCalledWith('Please Fill All Fields....');
    // Since it returns early, no further calls expected, e.g. userService.updateUser should NOT be called
    expect((component as any).userService.updateUser).not.toHaveBeenCalled();
  });


   
  it('should handle successful updateUser response correctly', () => {
    spyOn(window, 'alert'); 
    spyOn(component, 'getUserByid');
    spyOn(component.userFormSettings, 'reset');
    spyOn(component, 'closeGotoSettingModal');
    spyOn(component, 'reloadPage');
  
    // Mock form as valid with some value
    component.userFormSettings = {
      invalid: false,
      value: { id: 1, name: 'Test User' },
      reset: jasmine.createSpy('reset')
    } as any;
  
    (component as any).userService = {
      updateUser: jasmine.createSpy().and.returnValue({
        subscribe: (callbacks: any) => {
          callbacks.next('success response');
        }
      })
    } as any;
  
    component.updateUser();
  
    expect(window.alert).toHaveBeenCalledWith('User Updated Successfully....'); 
    expect(component.getUserByid).toHaveBeenCalled();
    expect(component.userFormSettings.reset).toHaveBeenCalled();
    expect(component.closeGotoSettingModal).toHaveBeenCalled();
    expect(component.reloadPage).toHaveBeenCalled();
  });




 
  it('should handle error when updateUser fails', fakeAsync(() => {
    const error = new Error('Update failed');
  
    // Set up form with some valid data
    component.userFormSettings = new FormBuilder().group({
      id: [1],
      name: ['Jane Doe'],
      userName: ['jane'],
      email: ['jane@example.com'],
      password: ['newpassword'],
      roleId: [1],
      phoneNumber: ['1234567890'],
      gender: ['female']
    });
  
    mockUserService.updateUser.and.returnValue(throwError(() => error));
  
    spyOn(component, 'getUser');
    spyOn(component, 'closeGotoSettingModal');
    spyOn(window, 'alert');
    spyOn(console, 'error');
  
    component.updateUser();
    tick();
  
    expect(mockUserService.updateUser).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalled(); // logs error internally
    expect(mockErrorHandler.handleError).toHaveBeenCalledWith(error);
    expect(window.alert).toHaveBeenCalledWith('Failed to update user. Please try again later.');
    expect(component.getUser).not.toHaveBeenCalled();
    expect(component.closeGotoSettingModal).not.toHaveBeenCalled();
  }));

  

  it('should open the password modal by setting display to block', () => {
    // Arrange: create a mock element with a style object
    const mockModalElement = {
      style: { display: 'none' }
    } as any;
  
    // Spy on document.getElementById to return the mock modal
    spyOn(document, 'getElementById').and.returnValue(mockModalElement);
  
    // Act: call the method
    component.openPassswordModel();
  
    // Assert: check that display is set to 'block'
    expect(mockModalElement.style.display).toBe('block');
    expect(document.getElementById).toHaveBeenCalledWith('passwordModal');
  });

  it('should close the password modal by setting display to none', () => {
    // Arrange: mock passwordModal with a nativeElement having a style object
    component.passwordModal = {
      nativeElement: {
        style: { display: 'block' }  // Initially block
      }
    } as any;
  
    // Act: call closePswdModel()
    component.closePswdModel();
  
    // Assert: display should be set to 'none'
    expect(component.passwordModal!.nativeElement.style.display).toBe('none');
  });
  

  it('should initialize pswdForm with correct controls and validators', () => {
    // Arrange: Spy to return specific userId and roleId
    spyOn(component, 'getUserInfoFromToken').and.returnValue({ userId: 123, roleId: 1 });
  
    // Act
    component.setPswdFormState();
  
    // Assert
    expect(component.pswdForm).toBeDefined();
  
    const controls = component.pswdForm.controls;
    expect(controls['id']).toBeDefined();
    expect(controls['curpswd']).toBeDefined();
    expect(controls['newpswd']).toBeDefined();
    expect(controls['confrmNewpswd']).toBeDefined();
  
    expect(controls['id'].value).toBe(123);
  
    expect(controls['curpswd'].validator).toBeTruthy();
    expect(controls['newpswd'].validator).toBeTruthy();
    expect(controls['confrmNewpswd'].validator).toBeTruthy();
  
    // Instead of strict equality, just check the validator exists
    expect(component.pswdForm.validator).toBeTruthy();
  });
  
  

  // it('should validate that newpswd and confrmNewpswd match using passwordsMatchValidator', () => {
  //   // Arrange
  //   const formBuilder = new FormBuilder();
  
  
  //   const formGroup = formBuilder.group({
  //     newpswd: ['password123'],
  //     confrmNewpswd: ['password123']
  //   }, 
  //   { validators: componentInstance.passwordsMatchValidator() });
  
  //   // Act & Assert (matching passwords)
  //   expect(formGroup.valid).toBeTrue();
  //   expect(formGroup.errors).toBeNull();
  
  //   // Update to mismatching passwords
  //   formGroup.get('confrmNewpswd')?.setValue('differentPassword');
  
  //   // Re-evaluate validity
  //   formGroup.updateValueAndValidity();
  
  //   expect(formGroup.valid).toBeFalse();
  //   expect(formGroup.errors).toEqual({ passwordMismatch: true });
  // });

  it('should validate that passwords match using passwordsMatchValidator', () => {
    // Arrange
    const formBuilder = new FormBuilder();
  
    const formGroup = formBuilder.group(
      {
        newpswd: ['Password123'],
        confrmNewpswd: ['Password123']
      },
      { validators: component.passwordsMatchValidator() }  // use component instance
    );
  
    // Act & Assert (when passwords match)
    expect(formGroup.valid).toBeTrue();
    expect(formGroup.errors).toBeNull();
  
    // Update to mismatched password
    formGroup.get('confrmNewpswd')?.setValue('Mismatch123');
    formGroup.updateValueAndValidity();
  
    // Assert (when passwords do not match)
    expect(formGroup.valid).toBeFalse();
    expect(formGroup.errors).toEqual({ passwordMismatch: true });
  });

  it('should alert and return if pswdForm is invalid', () => {
    spyOn(window, 'alert');
  
    // Mock pswdForm as invalid
    component.pswdForm = {
      invalid: true,
    } as any;
  
    component.updatePassword();
  
    expect(window.alert).toHaveBeenCalledWith('Please fill in all fields and ensure passwords match.');
  });

  it('should update password successfully and close modal', fakeAsync(() => {
    // Arrange
    const passwordData = {
      id: 1,
      curpswd: 'oldPassword',
      newpswd: 'newPassword',
      confrmNewpswd: 'newPassword'
    };
  
    // Set up valid pswdForm
    component.pswdForm = new FormBuilder().group({
      id: [passwordData.id],
      curpswd: [passwordData.curpswd],
      newpswd: [passwordData.newpswd],
      confrmNewpswd: [passwordData.confrmNewpswd]
    }, { validators: component.passwordsMatchValidator() });
  
    mockUserService.updatepassword.and.returnValue(of({}));
  
    spyOn(window, 'alert');
    spyOn(component, 'closePswdModel');
  
    // Act
    component.updatePassword();
    tick();
  
    // Assert
    expect(mockUserService.updatepassword).toHaveBeenCalledWith(passwordData);
    expect(window.alert).toHaveBeenCalledWith('Password updated successfully');
    expect(component.closePswdModel).toHaveBeenCalled();
  }));

  it('should handle error when password update fails', fakeAsync(() => {
    const error = new Error('Update failed');
  
    component.pswdForm = new FormBuilder().group({
      id: [1],
      curpswd: ['oldPass'],
      newpswd: ['newPass'],
      confrmNewpswd: ['newPass']
    }, { validators: component.passwordsMatchValidator() });
  
    mockUserService.updatepassword.and.returnValue(throwError(() => error));
  
    spyOn(window, 'alert');
    spyOn(component, 'closePswdModel');
  
    component.updatePassword();
    tick();
  
    expect(mockUserService.updatepassword).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to update user', error);  // updated
    expect(mockErrorHandler.handleError).toHaveBeenCalledWith(error);
    expect(window.alert).toHaveBeenCalledWith('Failed to update user. Please try again later.');  // updated
    expect(component.closePswdModel).not.toHaveBeenCalled();
  }));
  

});
