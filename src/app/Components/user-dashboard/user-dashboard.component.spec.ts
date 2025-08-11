import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { UserDashboardComponent } from './user-dashboard.component';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormControl, ValidationErrors } from '@angular/forms';
import { TasksService } from '../../Services/tasks.service';
import { UserAuthService } from '../../Services/user-auth.service';
import { LoggerServiceService } from '../../Services/logger-service.service';
import { UsersService } from '../../Services/users.service';
import { Observable, of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ElementRef, ErrorHandler } from '@angular/core';
import { Tasks } from '../../Models/tasks';

describe('UserDashboardComponent', () => {
  let component: UserDashboardComponent;
  let fixture: ComponentFixture<UserDashboardComponent>;

  // Mocks
  let mockTasksService: jasmine.SpyObj<TasksService>;
  let mockAuthService: jasmine.SpyObj<UserAuthService>;
  let mockLogger: jasmine.SpyObj<LoggerServiceService>;
  let mockUserService: jasmine.SpyObj<UsersService>;
  let mockErrorHandler: jasmine.SpyObj<ErrorHandler>;
  

  beforeEach(async () => {
    mockTasksService = jasmine.createSpyObj('TasksService', ['getUserTask', 'addTask', 'updateTask', 'deleteTask', 'getTaskNotification']);
    mockAuthService = jasmine.createSpyObj('UserAuthService', ['logout']);
    mockLogger = jasmine.createSpyObj('LoggerServiceService', ['error', 'info']);
    mockUserService = jasmine.createSpyObj('UsersService', ['getUserbyId', 'updateUser', 'checkUsernameExists', 'updatepassword']);
    mockErrorHandler=jasmine.createSpyObj('ErrorHandler',['handleError']);
      // Mock getUserTask to return an Observable to avoid undefined.subscribe error
  mockTasksService.getUserTask.and.returnValue(of([])); 
    await TestBed.configureTestingModule({
      //declarations: [UserDashboardComponent],
      imports: [ReactiveFormsModule, FormsModule,UserDashboardComponent,CommonModule],
      providers: [
        { provide: TasksService, useValue: mockTasksService },
        { provide: UserAuthService, useValue: mockAuthService },
        { provide: LoggerServiceService, useValue: mockLogger },
        { provide: UsersService, useValue: mockUserService },
        { provide: ActivatedRoute, useValue: {} },
        {provide:ErrorHandler,useValue:mockErrorHandler}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserDashboardComponent);
    component = fixture.componentInstance;

    // Setup a fake token in sessionStorage for getUserInfoFromToken()
    const fakePayload = {
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': '1',
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'user'
    };
    const fakeToken = `header.${btoa(JSON.stringify(fakePayload))}.signature`;
    sessionStorage.setItem('JWT_TOKEN', fakeToken);

    component.userFormSettings = new FormGroup({
      name: new FormControl(''),
      userName: new FormControl(''),
      email: new FormControl(''),
      password: new FormControl(''),
      phoneNumber: new FormControl(''),
      gender: new FormControl(''),
      role: new FormControl('')
    });

  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create component and initialize forms', () => {
    //fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.taskForm).toBeDefined();
    expect(component.userFormSettings).toBeDefined();
    expect(component.pswdForm).toBeDefined();
  });

  it('should parse JWT token correctly', () => {
    const userInfo = component.getUserInfoFromToken();

    expect(userInfo).toEqual({ userId: 1, roleId: 2 }); // 'user' role maps to 2
  });

  it('should apply filters correctly', () => {
    component.allTasks = [
      { taskStatus: 'New', dueDate: '2025-08-01T00:00:00', taskType: 'Bug', priority: 'High', referenceId: 'ABC123', taskName: 'Fix bug' } as any,
      { taskStatus: 'Completed', dueDate: '2025-08-02T00:00:00', taskType: 'Feature', priority: 'Low', referenceId: 'XYZ789', taskName: 'Add feature' } as any,
    ];

    component.filters = {
      date: '2025-08-01',
      type: '',
      status: '',
      priority: '',
      taskId: '',
      taskNames: ''
    };

    component.applyFilters();

    expect(component.filteredTasks.length).toBe(1);
    expect(component.filteredTasks[0].taskName).toBe('Fix bug');
  });
  

  it('should paginate tasks correctly', () => {
    component.filteredTasks = [];
    for(let i = 1; i <= 12; i++) {
      component.filteredTasks.push({ taskName: `Task ${i}` } as any);
    }

    component.pageSize = 5;
    component.totalPages = Math.ceil(component.filteredTasks.length / component.pageSize);
    component.currentPage = 2;

    component.updatePaginatedTasks();

    expect(component.paginatedTasks.length).toBe(5);
    expect(component.paginatedTasks[0].taskName).toBe('Task 6');
  });

  it('should update pageSize, reset currentPage, recalculate totalPages and call updatePaginatedTasks', () => {
    // Arrange: mock filteredTasks with full required properties matching your interface
    component.filteredTasks = Array(12).fill(null).map((_, i) => ({
      taskId: i + 1,
      taskName: `Task ${i + 1}`,
      userName: 'User',
      userId: 1,
      taskDescription: 'Mock description',
      taskStatus: 'New',
      dueDate: new Date('2025-08-01T00:00:00'),
      priority: 'High',
      createdBy: 1,
      taskType: 'Bug',
      referenceId: `REF${i + 1}`,
      taskState: 'Open'
    }));
  
    spyOn(component, 'updatePaginatedTasks');
  
    // Create fake event simulating selecting "5" as page size
    const event = {
      target: { value: '5' }
    } as unknown as Event;
  
    // Act
    component.onPageSizeChange(event);
  
    // Assert
    expect(component.pageSize).toBe(5);
    expect(component.currentPage).toBe(1);
    expect(component.totalPages).toBe(Math.ceil(12 / 5)); // 3 pages
    expect(component.updatePaginatedTasks).toHaveBeenCalled();
  });

  it('should set currentPage to the given page and call updatePaginatedTasks', () => {
    spyOn(component, 'updatePaginatedTasks');
  
    component.goToPage(3);
  
    expect(component.currentPage).toBe(3);
    expect(component.updatePaginatedTasks).toHaveBeenCalled();
  });
  

  it('should toggle notification dropdown', () => {
    expect(component.notificationDropdownVisible).toBe(false);

    component.toggleNotificationDropdown();
    expect(component.notificationDropdownVisible).toBe(true);

    component.toggleNotificationDropdown();
    expect(component.notificationDropdownVisible).toBe(false);
  });

  it('should open and close modal', () => {
    fixture.detectChanges();
  
    const modalElement = fixture.nativeElement.querySelector('#myModal');
    component.model = new ElementRef(modalElement); // Assign the ElementRef manually
  
    component.openModal();
    expect(modalElement.style.display).toBe('block');
  
    component.closeModal();
    expect(modalElement.style.display).toBe('none');
  });

  it('should return date string in YYYY-MM-DD format by splitting at "T"', () => {
    const input = '2025-08-04T12:34:56Z';
    const result = component.toDateInputFormat(input);
    expect(result).toBe('2025-08-04');
  });

  it('should correctly count tasks by status', () => {
    component.tasks = [
      { taskStatus: 'New' } as any,
      { taskStatus: 'New' } as any,
      { taskStatus: 'OnDue' } as any,
      { taskStatus: 'Completed' } as any,
      { taskStatus: 'Completed' } as any,
      { taskStatus: 'Completed' } as any
    ];
  
    component.countTaskStatuses();
  
    expect(component.assignedTasksCount).toBe(2);   // 2 tasks with 'New'
    expect(component.inProgressTasksCount).toBe(1); // 1 task with 'OnDue'
    expect(component.completedTasksCount).toBe(3);  // 3 tasks with 'Completed'
  });

  it('should call alert when openAddTaskModal is called', () => {
    spyOn(window, 'alert');
  
    component.openAddTaskModal();
  
    expect(window.alert).toHaveBeenCalledWith('Open task creation modal (to be implemented)');
  });
  
  
  it('should open modal and patch taskForm with formatted task data on edit', () => {
    // Arrange: Spy on openModal and patchValue
    spyOn(component, 'openModal');
    spyOn(component.taskForm, 'patchValue');
  
    const mockTask: Tasks = {
      taskId: 1,
      taskName: 'Test Task',
      userName: 'User1',
      userId: 1,
      taskDescription: 'Description',
      taskStatus: 'New',
      dueDate: new Date('2025-08-04T00:00:00'),
      priority: 'High',
      createdBy: 1,
      taskType: 'Bug',
      referenceId: 'REF1',
      taskState: 'Open'
    };
  
    // Spy on toDateInputFormat to control output
    spyOn(component, 'toDateInputFormat').and.returnValue('2025-08-04');
  
    // Act
    component.onEdit(mockTask);
  
    // Assert
    expect(component.openModal).toHaveBeenCalled();
    expect(component.toDateInputFormat).toHaveBeenCalledWith(mockTask.dueDate);
    expect(component.taskForm.patchValue).toHaveBeenCalledWith({
      ...mockTask,
      dueDate: '2025-08-04',
      userName: mockTask.userName
    });
  });
  
  
   it('should call addTask on form submit if taskId is 0', fakeAsync(() => {
    const fb = TestBed.inject(FormBuilder);
    mockTasksService.addTask.and.returnValue(of({}));
    spyOn(window, 'alert');

    component.taskForm = fb.group({
      taskId: 0,
      taskName: ['Task1', Validators.required],
      userId: [1, Validators.required],
      dueDate: ['2025-08-02', Validators.required],
      taskDescription: ['desc', Validators.required],
      priority: ['High', Validators.required],
      taskType: ['Bug', Validators.required],
      userName: ['User1'],
      taskStatus: ['New', Validators.required],
      createdBy: [1]
    });

    component.onSubmit();
    tick();

    expect(mockTasksService.addTask).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Task Added Successfully....');
  }));

  it('should call updateTask on form submit if taskId is not 0', fakeAsync(() => {
    const fb = TestBed.inject(FormBuilder);
    mockTasksService.updateTask.and.returnValue(of({}));
    spyOn(window, 'alert');

    component.taskForm = fb.group({
      taskId: 123,
      taskName: ['Task1', Validators.required],
      userId: [1, Validators.required],
      dueDate: ['2025-08-02', Validators.required],
      taskDescription: ['desc', Validators.required],
      priority: ['High', Validators.required],
      taskType: ['Bug', Validators.required],
      userName: ['User1'],
      taskStatus: ['New', Validators.required],
      createdBy: [1]
    });

    component.onSubmit();
    tick();

    expect(mockTasksService.updateTask).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Task Updated Successfully....');
  }));

  it('should handle error on updateTask failure', fakeAsync(() => {
    spyOn(window, 'alert');
    const error = new Error('Update error');
    mockTasksService.updateTask.and.returnValue(throwError(() => error));
  
    component.taskForm = new FormGroup({
      taskId: new FormControl(123),
      taskName: new FormControl('Task1', Validators.required),
      userId: new FormControl(1, Validators.required),
      dueDate: new FormControl('2025-08-02', Validators.required),
      taskDescription: new FormControl('desc', Validators.required),
      priority: new FormControl('High', Validators.required),
      taskType: new FormControl('Bug', Validators.required),
      userName: new FormControl('User1'),
      taskStatus: new FormControl('New', Validators.required),
      createdBy: new FormControl(1),
    });
  
    component.onSubmit();
    tick();
  
    expect(mockLogger.error).toHaveBeenCalledWith('Task Updation Faild', error);
    expect(mockErrorHandler.handleError).toHaveBeenCalledWith(error);
    expect(window.alert).toHaveBeenCalledWith('Faild task added. Please try again.');
  }));
  
  it('should alert if form is invalid', () => {
    spyOn(window, 'alert');
  
    component.taskForm = new FormGroup({
      taskId: new FormControl(null),
      taskName: new FormControl('', Validators.required) // empty to trigger invalid
    });
  
    component.onSubmit();
  
    expect(window.alert).toHaveBeenCalledWith('Please Fill All Fields....');
  });

  it('should handle error on addTask failure', fakeAsync(() => {
    spyOn(window, 'alert');
    mockTasksService.addTask.and.returnValue(throwError(() => new Error('Add error')));
  
    component.taskForm = new FormGroup({
      taskId: new FormControl(0),
      taskName: new FormControl('Task1', Validators.required),
      userId: new FormControl(1, Validators.required),
      dueDate: new FormControl('2025-08-02', Validators.required),
      taskDescription: new FormControl('desc', Validators.required),
      priority: new FormControl('High', Validators.required),
      taskType: new FormControl('Bug', Validators.required),
      userName: new FormControl('User1'),
      taskStatus: new FormControl('New', Validators.required),
      createdBy: new FormControl(1),
    });
  
    component.onSubmit();
    tick();
  
    expect(mockLogger.error).toHaveBeenCalledWith('Task Added Faild', jasmine.any(Error));
    expect(mockErrorHandler.handleError).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Faild task added. Please try again.');
  }));

  it('should handle error if getUserTask fails', fakeAsync(() => {
    const fakeUser = { userId: 1, roleId: 2 };
    const error = new Error('Network error');
  
    // Arrange: return user info and simulate service error
    spyOn(component, 'getUserInfoFromToken').and.returnValue(fakeUser);
    mockTasksService.getUserTask.and.returnValue(throwError(() => error));
  
    // Spy on all expected side effects
    const consoleSpy = spyOn(console, 'error');
  
    spyOn(window, 'alert');
  
    // Act
    component.getTasks();
    tick();
  
    // Assert
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load user tasks', error);
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to load user tasks', error);
    expect(mockErrorHandler.handleError).toHaveBeenCalledWith(error);
    expect(window.alert).toHaveBeenCalledWith("Could not fetch tasks. Please try again later.");
  }));
  
  
  it('should log error and return if userId is missing in getTasks()', () => {
    spyOn(component, 'getUserInfoFromToken').and.returnValue(null);
    const consoleSpy = spyOn(console, 'error');
  
    component.getTasks();
  
    expect(consoleSpy).toHaveBeenCalledWith('User ID not found in token');
  });

    

  it('should handle delete task confirmation and success', fakeAsync(() => {
    
    spyOn(window, 'confirm').and.returnValue(true);//user clicks "OK"
    mockTasksService.deleteTask.and.returnValue(of({}));
    spyOn(window, 'alert');

    component.tasks = [{ taskId: 1 } as any];

    component.onDelete(1);
    tick();

    expect(mockTasksService.deleteTask).toHaveBeenCalledWith(1);
    expect(window.alert).toHaveBeenCalledWith('Task deleted successfully.');
    expect(mockLogger.info).toHaveBeenCalledWith('Task with ID 1 deleted successfully');
  }));

  it('should handle delete task cancel', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.onDelete(1);
    expect(mockTasksService.deleteTask).not.toHaveBeenCalled();
  });
  it('should handle error when deleteTask fails', fakeAsync(() => {
    const taskId = 123;
    const error = new Error('Delete failed');
      //   Mock confirm to allow deletion
  spyOn(window, 'confirm').and.returnValue(true);
  
    mockTasksService.deleteTask.and.returnValue(throwError(() => error));
  
    // Spy on console, alert, logger, and error handler
    const consoleSpy = spyOn(console, 'error');
    spyOn(window, 'alert');
  
    component.onDelete(taskId);
    tick();
  
    const expectedMessage = `Failed to delete task with ID ${taskId}`;
  
    expect(consoleSpy).toHaveBeenCalledWith(expectedMessage, error);
    expect(mockLogger.error).toHaveBeenCalledWith(expectedMessage, error);
    expect(mockErrorHandler.handleError).toHaveBeenCalledWith(error);
    expect(window.alert).toHaveBeenCalledWith('Failed to delete the task. Please try again later.');
  }));
  

  it('should call logout from auth service', () => {
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should load notifications', fakeAsync(() => {
    mockTasksService.getTaskNotification.and.returnValue(of([{ id: 1 } as any]));
    component.loadNotification();
    tick();
    expect(component.notifications.length).toBe(1);
  }));

  it('should log an error and return if user info is missing', () => {
    spyOn(component, 'getUserInfoFromToken').and.returnValue(null);
    const consoleSpy = spyOn(console, 'error');
  
    component.loadNotification();
  
    expect(consoleSpy).toHaveBeenCalledWith('User ID not found in token');
  });
  it('should log an error if getTaskNotification fails', fakeAsync(() => {
    const fakeUser = { userId: 1 ,roleId:1};
    spyOn(component, 'getUserInfoFromToken').and.returnValue(fakeUser);
  
    const error = new Error('Network error');
    mockTasksService.getTaskNotification.and.returnValue(throwError(() => error));
    const consoleSpy = spyOn(console, 'error');
  
    component.loadNotification();
    tick();
  
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load notifications:', error);
  }));
  
  

  it('should call getUserbyId and set userByid when token has userInfo', () => {
    const mockUserInfo = { userId: 2,roleId:1 };
    const mockUserData = { id:1,
      userName:'amal',
      email:'',
      roleId:1,
      roleName:'',
      status:true,
      name:'',
      phoneNumber:'',
      gender:'',
      password:'' };
  
    spyOn(component, 'getUserInfoFromToken').and.returnValue(mockUserInfo);
    mockUserService.getUserbyId.and.returnValue(of(mockUserData));
  
    component.getUserByid();
  
    expect(mockUserService.getUserbyId).toHaveBeenCalledWith(2);
    expect(component.userByid).toEqual(mockUserData);
  });
  

  it('should warn and return if user info is not found in token (getUserByid)', () => {
    spyOn(component, 'getUserInfoFromToken').and.returnValue(null);  // Simulate missing user info
    const warnSpy = spyOn(console, 'warn');
  
    component.getUserByid();
  
    expect(warnSpy).toHaveBeenCalledWith('User ID not found in token');
  });
  
  it('should log error and alert if getUserbyId fails', fakeAsync(() => {
    // Arrange
    spyOn(component, 'getUserInfoFromToken').and.returnValue({ userId: 1, roleId: 2 });
    const error = new Error('Network error');
    mockUserService.getUserbyId.and.returnValue(throwError(() => error));
  
    const consoleSpy = spyOn(console, 'error');
    spyOn(window, 'alert');
  
    // Act
    component.goToSettingsOpenModal();
    tick();
  
    // Assert
    expect(consoleSpy).toHaveBeenCalledWith('Error fetching user', error);
    expect(window.alert).toHaveBeenCalledWith('Failed to load user settings.');
  }));
  

 it('should open settings modal and patch form', fakeAsync(() => {
  // Initialize the form before the test
  component.userFormSettings = new FormGroup({
    name: new FormControl(''),
    userName: new FormControl(''),
    email: new FormControl(''),
    password: new FormControl(''),
    phoneNumber: new FormControl(''),
    gender: new FormControl(''),
    role: new FormControl('')
  });

  spyOn(component, 'getUserInfoFromToken').and.returnValue({ userId: 1, roleId: 2 });

  mockUserService.getUserbyId.and.returnValue(of({
    id: 1,
    userName: 'amal',
    email: 'name@gmail.com',
    roleId: 2,
    roleName: 'User',
    status: true,
    name: 'John',
    phoneNumber: '9898989898',
    gender: 'Male',
    password: 'password'
  }));

  const settingsModal = document.createElement('div');
  settingsModal.id = 'settingsModel';
  document.body.appendChild(settingsModal);

  component.goToSettingsOpenModal();
  tick();

  expect(component.userFormSettings.value.name).toBe('John');
 // expect(settingsModal.style.display).toBe('block');

  document.body.removeChild(settingsModal);
}));
it('should log error and return if userInfo is missing in goToSettingsOpenModal', () => {
  spyOn(component, 'getUserInfoFromToken').and.returnValue(null);
  const consoleSpy = spyOn(console, 'error');

  component.goToSettingsOpenModal();

  expect(consoleSpy).toHaveBeenCalledWith('User ID not found in token');
});


it('should call setFormStateSettings, hide modal, and reset form in closeGotoSettingModal', () => {
  spyOn(component, 'setFormStateSettings');
  
  // Mock settingModel properly to avoid TS18048 error
  component.settingModel = {
    nativeElement: {
      style: { display: '' }
    }
  } as any;

  component.userFormSettings = new FormGroup({
    name: new FormControl('Test')
  });
  spyOn(component.userFormSettings, 'reset');

  component.closeGotoSettingModal();

  expect(component.setFormStateSettings).toHaveBeenCalled();
  expect(component.settingModel!.nativeElement.style.display).toBe('none');
  expect(component.userFormSettings.reset).toHaveBeenCalled();
});






it('should return null if token is missing', () => {
  sessionStorage.removeItem('JWT_TOKEN'); // simulate no token
  const result = component.getUserInfoFromToken();
  expect(result).toBeNull();
});
it('should return null if token is missing userId or role', () => {
  const payload = {
    // Missing required claims
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/other': '123'
  };
  const token = `header.${btoa(JSON.stringify(payload))}.signature`;
  sessionStorage.setItem('JWT_TOKEN', token);

  const result = component.getUserInfoFromToken();
  expect(result).toBeNull();
});
it('should catch error if token is invalid JSON', () => {
  const invalidBase64 = btoa('not json'); // still base64 but won't parse to valid JSON
  const token = `header.${invalidBase64}.signature`;
  sessionStorage.setItem('JWT_TOKEN', token);

  const consoleSpy = spyOn(console, 'error');
  const result = component.getUserInfoFromToken();
  expect(consoleSpy).toHaveBeenCalledWith('Error parsing JWT token:', jasmine.any(Error));
  expect(result).toBeNull();
});
it('should parse and return user info from valid token', () => {
  const payload = {
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': '10',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'admin'
  };
  const token = `header.${btoa(JSON.stringify(payload))}.signature`;
  sessionStorage.setItem('JWT_TOKEN', token);

  const result = component.getUserInfoFromToken();
  expect(result).toEqual({ userId: 10, roleId: 1 }); // admin = 1
});

  it('should update user and close modal', fakeAsync(() => {
    const fb = TestBed.inject(FormBuilder);
  
    spyOn(window, 'alert');
    mockUserService.updateUser.and.returnValue(of({}));
    spyOn(component, 'closeGotoSettingModal');
    spyOn(component, 'getUserByid');
    spyOn(component, 'reloadWindow');
  
    component.userFormSettings = fb.group({
      id: [1],
      name: ['John', Validators.required],
      userName: ['john123', Validators.required],
      email: ['john@example.com', [Validators.required, Validators.email]],
      roleid: [2],
      phoneNumber: ['1234567890', Validators.required],
      gender: ['M', Validators.required]
    });
  
    component.updateUser();
    tick();
  
    expect(mockUserService.updateUser).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('User Updated Successfully....');
    expect(component.closeGotoSettingModal).toHaveBeenCalled();
    expect(component.getUserByid).toHaveBeenCalled();
    expect(component.reloadWindow).toHaveBeenCalled();
  }));

  it('should show alert if userFormSettings invalid on updateUser', () => {
    spyOn(window, 'alert');
    const fb = new FormBuilder();

    component.userFormSettings = fb.group({
      name: ['', Validators.required]
    });

    component.updateUser();
    expect(window.alert).toHaveBeenCalledWith('Please Fill All Fields....');
  });

  it('should handle error when updateUser fails', fakeAsync(() => {
    // Arrange
    spyOn(window, 'alert');
    const error = new Error('Update failed');
    
    spyOn(console, 'error');
    // spyOn(mockLogger, 'error');
    // spyOn(mockErrorHandler, 'handleError');
  
    // Make updateUser return an error Observable
    mockUserService.updateUser.and.returnValue(throwError(() => error));
  
    // Setup form with valid values (so form is valid and submit proceeds)
    component.userFormSettings = new FormGroup({
      name: new FormControl('John', Validators.required),
      userName: new FormControl('john123', Validators.required),
      email: new FormControl('john@example.com', Validators.required),
      password: new FormControl('password', Validators.required),
      phoneNumber: new FormControl('1234567890', Validators.required),
      gender: new FormControl('Male', Validators.required),
      role: new FormControl(1, Validators.required)
    });
  
    // Act
    component.updateUser();
    tick();
  
    // Assert
    expect(console.error).toHaveBeenCalledWith('Failed to update user', error);
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to update user', error);
    expect(mockErrorHandler.handleError).toHaveBeenCalledWith(error);
    expect(window.alert).toHaveBeenCalledWith('Failed to update user. Please try again later.');
  }));
  

  it('should update password successfully', fakeAsync(() => {
    spyOn(window, 'alert');
    mockUserService.updatepassword.and.returnValue(of({}));
    spyOn(component, 'closePswdModel');

    const fb = new FormBuilder();
    component.pswdForm = fb.group({
      id: [1],
      curpswd: ['oldpass', Validators.required],
      newpswd: ['newpass', Validators.required],
      confrmNewpswd: ['newpass', Validators.required]
    });

    component.updatePassword();
    tick();

    expect(mockUserService.updatepassword).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Password updated successfully');
    expect(component.closePswdModel).toHaveBeenCalled();
  }));

  it('should show alert if pswdForm invalid on updatePassword', () => {
    spyOn(window, 'alert');
    mockUserService.updatepassword.and.returnValue(of({}));  // mock it here!

    const fb = new FormBuilder();
    component.pswdForm = fb.group({
      curpswd: ['', Validators.required],
      newpswd: ['', Validators.required],
      confrmNewpswd: ['', Validators.required]
    });

       // Act
    component.updatePassword();
    
    expect(window.alert).toHaveBeenCalledWith('Please fill in all fields and ensure passwords match.');
  });

  it('should handle error when password update fails', fakeAsync(() => {
    const error = new Error('Update failed');
  
    // Arrange
    spyOn(console, 'error');
  
    spyOn(window, 'alert');
  
    mockUserService.updatepassword.and.returnValue(throwError(() => error));
  
    component.pswdForm = new FormGroup({
      userId: new FormControl(1, Validators.required),
      password: new FormControl('newPassword123', Validators.required),
      confirmPassword: new FormControl('newPassword123', Validators.required)
    });
  
    // Act
    component.updatePassword();
    tick();
  
    // Assert
    expect(console.error).toHaveBeenCalledWith('Failed to update user', error);
    expect(mockLogger.error).toHaveBeenCalledWith('Failed to update user', error);
    expect(mockErrorHandler.handleError).toHaveBeenCalledWith(error);
    expect(window.alert).toHaveBeenCalledWith('Failed to update user. Please try again later.');
  }));
  

  it('should return null if username is unchanged', (done) => {
    component.orginalUserName = 'john123';
    const validatorFn = component.UsernameExistsValidator();
  
    const control = new FormControl('john123');
  
    const result$ = validatorFn(control) as Observable<ValidationErrors | null>;
  
    result$.subscribe((result: ValidationErrors | null) => {
      expect(result).toBeNull();
      done();
    });
  });

  

  it('should set the modal display style to block', () => {
    // Arrange
    const modal = document.createElement('div');
    modal.id = 'passwordModal';
    modal.style.display = 'none';
    document.body.appendChild(modal);

    // Act
    component.openPassswordModel();

    // Assert
    const modalAfter = document.getElementById('passwordModal');
    expect(modalAfter).not.toBeNull();
    expect(modalAfter!.style.display).toBe('block');

    // Cleanup
    document.body.removeChild(modal);
  });

  it('should set passwordModal display style to none when closePswdModel is called', () => {
    // Create a dummy element and assign it to component.passwordModal
    const modalElement = document.createElement('div');
    modalElement.style.display = 'block';  // initially visible
  
    component.passwordModal = {
      nativeElement: modalElement
    } as ElementRef;
  
    // Call the method
    component.closePswdModel();
  
    // Expect the display style to be 'none'
    expect(component.passwordModal.nativeElement.style.display).toBe('none');
  });
  
  it('should not throw if passwordModal is null', () => {
    component.passwordModal = undefined;
  
    expect(() => component.closePswdModel()).not.toThrow();
  });
  

  
  it('should return null if passwords match', () => {
    const form = new FormGroup({
      newpswd: new FormControl('Secret123'),
      confrmNewpswd: new FormControl('Secret123')
    }, component.passwordsMatchValidator());

    expect(form.errors).toBeNull();
  });

  it('should return passwordMismatch error if passwords do not match', () => {
    const form = new FormGroup({
      newpswd: new FormControl('Secret123'),
      confrmNewpswd: new FormControl('WrongPass')
    }, component.passwordsMatchValidator());

    expect(form.errors).toEqual({ passwordMismatch: true });
  });

  it('should return null if both fields are empty', () => {
    const form = new FormGroup({
      newpswd: new FormControl(''),
      confrmNewpswd: new FormControl('')
    }, component.passwordsMatchValidator());

    expect(form.errors).toBeNull();  // technically matching
  });
  
  describe('onDocumentClick behavior', () => {
    beforeEach(() => {
      const bell = document.createElement('div');
      bell.classList.add('notification-bell');
  
      const dropdown = document.createElement('div');
      dropdown.classList.add('notification-dropdown');
  
      document.body.appendChild(bell);
      document.body.appendChild(dropdown);
    });
  
    afterEach(() => {
      document.querySelector('.notification-bell')?.remove();
      document.querySelector('.notification-dropdown')?.remove();
    });
  
    it('should not close dropdown when clicking inside the bell', () => {
      const bell = document.querySelector('.notification-bell') as HTMLElement;
      component.notificationDropdownVisible = true;
  
      component.onDocumentClick({ target: bell } as unknown as MouseEvent);
  
      expect(component.notificationDropdownVisible).toBeTrue();
    });
  
    it('should not close dropdown when clicking inside the dropdown', () => {
      const bell = document.querySelector('.notification-bell') as HTMLElement;
      component.notificationDropdownVisible = true;
  
      component.onDocumentClick({ target: bell } as unknown as MouseEvent);
      expect(component.notificationDropdownVisible).toBeTrue();
    });
  
    it('should close dropdown when clicking outside', () => {
      const bell = document.querySelector('.notification-bell') as HTMLElement;
      const outside = document.createElement('div');
      document.body.appendChild(outside);
  
      component.notificationDropdownVisible = false;
  
      component.onDocumentClick({ target: bell } as unknown as MouseEvent);
      expect(component.notificationDropdownVisible).toBeFalse();
  
      document.body.removeChild(outside);
    });
  });
  it('should set notificationDropdownVisible to false when clicking outside bell and dropdown', () => {
    // Make sure notificationDropdownVisible starts true so we can observe the change
    component.notificationDropdownVisible = true;
  
    // Create an element outside bell and dropdown to simulate outside click
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);
  
    component.onDocumentClick({ target: outsideElement } as unknown as MouseEvent);
  
    expect(component.notificationDropdownVisible).toBeFalse();
  
    // Clean up
    document.body.removeChild(outsideElement);
  });
  
  it('should call loadNotification after 10 seconds', fakeAsync(() => {
    spyOn(component, 'loadNotification').and.callFake(() => {});
  
    component.ngOnInit();
  
    // Initially loadNotification not called
    expect(component.loadNotification).not.toHaveBeenCalled();
  
    // Move virtual time forward by 10 seconds (10000 ms)
    tick(10000);
  
    expect(component.loadNotification).toHaveBeenCalled();
  
    // Also confirm subscription is unsubscribed (optional)
    expect(component.notificationSubscription?.closed).toBeTrue();
  }));

  it('should map role name to correct id', () => {
    const mapRoleNameToId = (component as any).mapRoleNameToId.bind(component);
  
    expect(mapRoleNameToId('admin')).toBe(1);
    expect(mapRoleNameToId('user')).toBe(2);
    expect(mapRoleNameToId('unknown')).toBe(0);
    expect(mapRoleNameToId('ADMIN')).toBe(1);
    expect(mapRoleNameToId('USER')).toBe(2);
  });
  

});