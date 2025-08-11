import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { AdminTaskRegisterComponent } from './admin-task-register.component';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TasksService } from '../../Services/tasks.service';
import { LoggerServiceService } from '../../Services/logger-service.service';
import { ErrorHandler, NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Users } from '../../Models/users';
import { Tasks } from '../../Models/tasks';

describe('AdminTaskRegisterComponent', () => {
  let component: AdminTaskRegisterComponent;
  let fixture: ComponentFixture<AdminTaskRegisterComponent>;
  let taskService: jasmine.SpyObj<TasksService>;
  let loggerService: jasmine.SpyObj<LoggerServiceService>;
  let errorHandler: jasmine.SpyObj<ErrorHandler>;
  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TasksService', [
      'getAllUsers',
      'getAllTasks',
      'addTask',
      'updateTask',
      'deleteTask',
      'uploadTask'
    ]);

    taskServiceSpy.getAllUsers.and.returnValue(of([]));
    taskServiceSpy.getAllTasks.and.returnValue(of([]));
    
    const loggerSpy = jasmine.createSpyObj('LoggerServiceService', ['error', 'warn']);
    const errorHandlerSpy = jasmine.createSpyObj('ErrorHandler', ['handleError']);

    await TestBed.configureTestingModule({
      //declarations: [],
      imports: [AdminTaskRegisterComponent, ReactiveFormsModule, FormsModule, HttpClientTestingModule],
      providers: [
        { provide: TasksService, useValue: taskServiceSpy },
        { provide: LoggerServiceService, useValue: loggerSpy },
        { provide: ErrorHandler, useValue: errorHandlerSpy },
        { provide: ActivatedRoute, useValue: {} } 
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTaskRegisterComponent);
    component = fixture.componentInstance;
    taskService = TestBed.inject(TasksService) as jasmine.SpyObj<TasksService>;
    loggerService = TestBed.inject(LoggerServiceService) as jasmine.SpyObj<LoggerServiceService>;
    errorHandler = TestBed.inject(ErrorHandler) as jasmine.SpyObj<ErrorHandler>;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });


  describe('ngOnInit()', () => {
    it('should call getUsers and getTasks', () => {
      spyOn(component, 'getUsers');
      spyOn(component, 'getTasks');
      component.ngOnInit();
      expect(component.getUsers).toHaveBeenCalled();
      expect(component.getTasks).toHaveBeenCalled();
    });
  });

  describe('sortData()', () => {
    beforeEach(() => {
      // Setup mock task data
      component.allTasks = [
        { taskId: 1, taskName: 'Alpha', userName: 'John', taskType: 'Bug', priority: 'High', taskState: 'New', dueDate: new Date(), createdBy: 1, userId: 1, taskStatus: 'New', referenceId: 'R001' },
        { taskId: 2, taskName: 'Beta', userName: 'Alice', taskType: 'Feature', priority: 'Low', taskState: 'Completed', dueDate: new Date(), createdBy: 1, userId: 2, taskStatus: 'Done', referenceId: 'R002' }
      ] as any;
      component.filteredTasks = [...component.allTasks];
    });
  
    it('should set sortColumn and default direction to asc if different column clicked', () => {
      spyOn(component, 'applyFilters');
      component.sortColumn = '';
      component.sortData('taskName');
      expect(component.sortColumn).toBe('taskName');
      expect(component.sortDirection).toBe('asc');
      expect(component.applyFilters).toHaveBeenCalled();
    });

    it('should toggle sortDirection if the same column is clicked again', () => {
      spyOn(component, 'applyFilters');
      component.sortColumn = 'taskName';
      component.sortDirection = 'asc';
  
      component.sortData('taskName');
      expect(component.sortDirection).toBe('desc');
      expect(component.applyFilters).toHaveBeenCalled();
    });

    it('should toggle sortDirection if the same column is clicked again', () => {
      spyOn(component, 'applyFilters');
      component.sortColumn = 'taskName';
      component.sortDirection = 'desc';
  
      component.sortData('taskName');
      expect(component.sortDirection).toBe('asc');
      expect(component.applyFilters).toHaveBeenCalled();
    });
    it('should return end index correctly based on paginatedTasks length and filteredTasks length', () => {
      // Mock getStartIndex to return a fixed start index
      spyOn(component, 'getStartIndex').and.returnValue(5);
    
      // Case 1: end is less than filteredTasks.length
      component.paginatedTasks = new Array(3); // length 3
      component.filteredTasks = new Array(10); // length 10
    
      let result = component.getEndIndex();
      expect(result).toBe(5 + 3); // 8, since 8 < 10
    
      // Case 2: end is greater than filteredTasks.length
      component.paginatedTasks = new Array(10); // length 10
      component.filteredTasks = new Array(12); // length 12
    
      result = component.getEndIndex();
      expect(result).toBe(12); // since 5 + 10 = 15 > 12, returns 12
    });
  });

  describe('applyFilters()', () => {
    it('should filter tasks correctly with lowercase filter values', () => {
      // Sample mock tasks
      component.allTasks = [
        {
          taskId: 1,
          taskName: 'FixLoginBug',
          userName: 'JohnDoe',
          taskType: 'Bug',
          priority: 'High',
          taskState: 'New',
          dueDate: new Date('2025-08-07'),
          createdBy: 1,
          userId: 1,
          taskStatus: 'New',
          referenceId: 'Ref123'
        },
        {
          taskId: 2,
          taskName: 'DeployFeature',
          userName: 'JaneSmith',
          taskType: 'Feature',
          priority: 'Low',
          taskState: 'Completed',
          dueDate: new Date('2025-08-08'),
          createdBy: 2,
          userId: 2,
          taskStatus: 'Done',
          referenceId: 'Ref456'
        }
      ] as any;
  
      // All filter values are lowercase intentionally
      component.filters = {
        name: 'johndoe',
        type: 'Bug',
        date: '2025-08-07',
        status: 'New',
        priority: 'High',
        taskId: 'ref123',
        taskNames: 'fixloginbug'
      };
  
      component.applyFilters();
  
      expect(component.filteredTasks.length).toBe(1);
      expect(component.filteredTasks[0].taskName).toBe('FixLoginBug');
    });
  });

  describe('applyFilters() sorting logic', () => {
    beforeEach(() => {
      component.allTasks = [
        { taskName: 'Zebra', taskId: 2 },
        { taskName: 'Apple', taskId: 1 },
        { taskName: 'Monkey', taskId: 3 }
      ] as any;
    });
  
    it('should sort tasks by taskName in ascending order', () => {
      component.filteredTasks = [...component.allTasks];
      component.sortColumn = 'taskName';
      component.sortDirection = 'asc';
  
      component.applyFilters();
  
      expect(component.filteredTasks.map(t => t.taskName)).toEqual(['Apple', 'Monkey', 'Zebra']);
    });
  
    it('should sort tasks by taskName in descending order', () => {
      component.filteredTasks = [...component.allTasks];
      component.sortColumn = 'taskName';
      component.sortDirection = 'desc';
  
      component.applyFilters();
  
      expect(component.filteredTasks.map(t => t.taskName)).toEqual(['Zebra', 'Monkey', 'Apple']);
    });
  });

  describe('Numeric sort comparison', () => {
    beforeEach(() => {
      component.sortColumn = 'taskId';
      (component as  any).filters = {}; // No filtering
    });
  
    it('should return 1 when valueA > valueB', () => {
      component.allTasks = [
        { taskId: 2 },
        { taskId: 1 }
      ] as any;
  
      component.sortDirection = 'asc';
      component.applyFilters();
  
      expect(component.filteredTasks.map(t => t.taskId)).toEqual([1, 2]);
    });
  
    it('should return -1 when valueA < valueB', () => {
      component.allTasks = [
        { taskId: 1 },
        { taskId: 2 }
      ] as any;
  
      component.sortDirection = 'asc';
      component.applyFilters();
  
      expect(component.filteredTasks.map(t => t.taskId)).toEqual([1, 2]);
    });
  
    it('should return 0 when valueA === valueB', () => {
      component.allTasks = [
        { taskId: 1 },
        { taskId: 1 }
      ] as any;
  
      component.sortDirection = 'asc';
      component.applyFilters();
  
      // When both values are equal, original order should be preserved
      expect(component.filteredTasks.map(t => t.taskId)).toEqual([1, 1]);
    });
  });
  

  describe('onPageSizeChange()', () => {
    it('should update pageSize, reset currentPage, recalculate totalPages, and call updatePaginatedTasks', () => {
      component.filteredTasks = new Array(25).fill({}); // simulate 25 filtered tasks
      component.pageSize = 10;
      component.currentPage = 3; // pretend we were on page 3
  
      const mockEvent = {
        target: {
          value: '5'
        }
      } as unknown as Event;
  
      spyOn(component, 'updatePaginatedTasks');
  
      component.onPageSizeChange(mockEvent);
  
      expect(component.pageSize).toBe(5);
      expect(component.currentPage).toBe(1);
      expect(component.totalPages).toBe(Math.ceil(25 / 5)); // 5
      expect(component.updatePaginatedTasks).toHaveBeenCalled();
    });
  });

  describe('goToPage()', () => {
    it('should set currentPage and call updatePaginatedTasks', () => {
      spyOn(component, 'updatePaginatedTasks');
      
      component.currentPage = 1;
      component.goToPage(3);
      
      expect(component.currentPage).toBe(3);
      expect(component.updatePaginatedTasks).toHaveBeenCalled();
    });
  });

  describe('getUsers()', () => {
    it('should populate users on success', () => {
      const mockUsers : Users[] = [{  
        id: 1,
        name:'John Jr',
        userName: 'John',
        email: 'john@example.com',
        roleId: 2,
        roleName: 'Admin',  
        phoneNumber: '1234567890',
        status:true,
        gender:'Male',
        password:''
      }];
      taskService.getAllUsers.and.returnValue(of(mockUsers));
      component.getUsers();
      expect(component.users).toEqual(mockUsers);
    }); 

  it('should handle error while fetching users', () => {
    const err = new Error('Failed to fetch');
    taskService.getAllUsers.and.returnValue(throwError(() => err));
    component.getUsers();
    expect(loggerService.error).toHaveBeenCalled();
    expect(errorHandler.handleError).toHaveBeenCalledWith(err);
  });
});

describe('getUserIdFromToken', () => {
  const validPayload = {
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": "123"
  };
  const encodedPayload = btoa(JSON.stringify(validPayload));
  const validToken = `header.${encodedPayload}.signature`;

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should return userId when token is valid and contains userId', () => {
    sessionStorage.setItem((component as any)['JWT_TOKEN'], validToken);
    const result = component.getUserIdFromToken();
    expect(result).toEqual({ userId: 123 });
  });
  it('should return null if token is not in sessionStorage', () => {
    const result = component.getUserIdFromToken();
    expect(result).toBeNull();
  });

  it('should return null if token does not contain userId claim', () => {
    const payload = {};
    const encoded = btoa(JSON.stringify(payload));
    const tokenWithoutUserId = `header.${encoded}.signature`;
    sessionStorage.setItem((component as any)['JWT_TOKEN'], tokenWithoutUserId);
    const result = component.getUserIdFromToken();
    expect(result).toBeNull();
  });

  it('should return null if token is malformed', () => {
    sessionStorage.setItem((component as any)['JWT_TOKEN'], 'invalid.token');
    const result = component.getUserIdFromToken();
    expect(result).toBeNull();
  });
});

describe('openModal', () => {
  beforeEach(() => {
    const modal = document.createElement('div');
    modal.id = 'myModal';
    document.body.appendChild(modal);
  });

  afterEach(() => {
    document.getElementById('myModal')?.remove();
  });

  it('should set display to "block" for #myModal', () => {
    component.openModal();
    const modal = document.getElementById('myModal');
    expect(modal?.style.display).toBe('block');
  });
});

describe('openModal1', () => {
  beforeEach(() => {
    const modal1 = document.createElement('div');
    modal1.id = 'myModal1';
    document.body.appendChild(modal1);
  });

  afterEach(() => {
    document.getElementById('myModal1')?.remove();
  });

  it('should set display to "block" for #myModal1', () => {
    component.openModal1();
    const modal1 = document.getElementById('myModal1');
    expect(modal1?.style.display).toBe('block');
  });
});

describe('closeModal', () => {
  it('should set display to "none" and call setFormState', () => {
    const mockNativeElement = {
      style: { display: 'block' }
    };

    component.model = {
      nativeElement: mockNativeElement
    } as any;

    spyOn(component, 'setFormState');

    component.closeModal();

    expect(component.setFormState).toHaveBeenCalled();
    expect(component.model?.nativeElement.style.display).toBe('none');
  });
});


describe('getTasks()', () => {
  it('should populate tasks and filteredTasks on success', () => {
    const mockTasks : Tasks[] = [{ taskId: 1, taskName:'Feature', taskDescription:'',
    userId:1, taskStatus:'New', taskState:'New', priority:'High', userName: 'Ram', 
    dueDate: new Date(), taskType: 'Bug', createdBy:1, referenceId:'5001' }];
    taskService.getAllTasks.and.returnValue(of(mockTasks));
    component.getTasks();
    expect(component.tasks).toEqual(mockTasks as any);
    expect(component.allTasks).toEqual(mockTasks as any);
  });
  it('should handle error while fetching tasks', () => {
    const err = new Error('Error');
    taskService.getAllTasks.and.returnValue(throwError(() => err));
    component.getTasks();
    expect(loggerService.error).toHaveBeenCalled();
    expect(errorHandler.handleError).toHaveBeenCalledWith(err);
  });
});

describe('onSubmit()', () => {
  beforeEach(() => {
    component.setFormState();
  });

  it('should not submit if form is invalid', () => {
    component.taskForm.patchValue({ taskName: '' });
    component.onSubmit();
    expect(taskService.addTask).not.toHaveBeenCalled();
  });

  it('should add a new task', () => {
    const formValue = {
      ...component.taskForm.value,
      taskId: 0,
      taskName: 'Task 1',
      userId: 1,
      dueDate: new Date(),
      taskDescription: 'desc',
      taskType: 'Bug',
      priority: 'Low',
      createdBy: 1
    };
    component.taskForm.setValue(formValue);
    taskService.addTask.and.returnValue(of({}));
    spyOn(component, 'getTasks');
    spyOn(component, 'closeModal');

    component.onSubmit();
    expect(taskService.addTask).toHaveBeenCalledWith(formValue);
    expect(component.getTasks).toHaveBeenCalled();
    expect(component.closeModal).toHaveBeenCalled();
  });

  it('should handle error when adding task fails', () => {
    const formValue = {
      ...component.taskForm.getRawValue(),
      taskId: 0,
      taskName: 'Task 1',
      userId: 1,
      dueDate: new Date(),
      taskDescription: 'desc',
      taskType: 'Bug',
      priority: 'Low',
      createdBy: 1
    };
    component.taskForm.setValue(formValue);
    
    const error = new Error('Add task failed');
    taskService.addTask.and.returnValue(throwError(() => error));

    spyOn(window, 'alert');
    spyOn(component, 'getTasks');
    spyOn(component, 'closeModal');

    component.onSubmit();

    expect(taskService.addTask).toHaveBeenCalledWith(formValue);
    expect(loggerService.error).toHaveBeenCalledWith('Failed to add task', error);
    expect(errorHandler.handleError).toHaveBeenCalledWith(error);
    expect(window.alert).toHaveBeenCalledWith('Failed to add task. Please try again.');
    expect(component.getTasks).not.toHaveBeenCalled();
    expect(component.closeModal).not.toHaveBeenCalled();
  });

  it('should be invalid if required fields are missing', () => {
    component.taskForm.patchValue({
      taskName: '',
      userId: '',
      dueDate: '',
      taskDescription: '',
      taskType: '',
      priority: ''
    });

    expect(component.taskForm.valid).toBeFalse();
    expect(component.taskForm.get('taskName')?.hasError('required')).toBeTrue();
    expect(component.taskForm.get('userId')?.hasError('required')).toBeTrue();
    expect(component.taskForm.get('dueDate')?.hasError('required')).toBeTrue();
    expect(component.taskForm.get('taskDescription')?.hasError('required')).toBeTrue();
    expect(component.taskForm.get('taskType')?.hasError('required')).toBeTrue();
    expect(component.taskForm.get('priority')?.hasError('required')).toBeTrue();
  });

  it('should validate that dueDate is not in the past', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // yesterday

    component.taskForm.get('dueDate')?.setValue(pastDate.toISOString().split('T')[0]);
    const errors = component.taskForm.get('dueDate')?.errors;

    expect(errors).toBeTruthy();
    expect(errors?.['pastDate']).toBeTrue();
  });

  it('should allow valid future dueDate', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // tomorrow

    component.taskForm.get('dueDate')?.setValue(futureDate.toISOString().split('T')[0]);
    const errors = component.taskForm.get('dueDate')?.errors;

    expect(errors).toBeNull();
  });

  it('should be valid when all required fields are provided and valid', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    component.taskForm.patchValue({
      taskName: 'New Task',
      userId: 1,
      dueDate: tomorrow.toISOString().split('T')[0],
      taskDescription: 'Test Desc',
      taskType: 'Bug',
      priority: 'High'
    });
    expect(component.taskForm.valid).toBeTrue();
  });

});

describe('onDelete()', () => {
  it('should call deleteTask if confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    taskService.deleteTask.and.returnValue(of({}));
    spyOn(component, 'getTasks');
    component.onDelete(1);
    expect(taskService.deleteTask).toHaveBeenCalledWith(1);
    expect(component.getTasks).toHaveBeenCalled();
  });

  it('should not call deleteTask if not confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.onDelete(1);
    expect(taskService.deleteTask).not.toHaveBeenCalled();
  });

  it('should handle error when deleteTask fails', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const error = new Error('Delete failed');
  
    taskService.deleteTask.and.returnValue(throwError(() => error));
    spyOn(window, 'alert');
    spyOn(component, 'getTasks');
  
    component.onDelete(1);
  
    expect(taskService.deleteTask).toHaveBeenCalledWith(1);
    expect(loggerService.error).toHaveBeenCalledWith("Failed to delete task", error);
    expect(errorHandler.handleError).toHaveBeenCalledWith(error);
    expect(window.alert).toHaveBeenCalledWith("Failed to delete the task. Please try again later.");
    expect(component.getTasks).not.toHaveBeenCalled();
  });
});


describe('onFileSelected()', () => {
  it('should set selectedFile and clear error', () => {
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    const event = { target: { files: [file] } };
    component.onFileSelected(event);
    expect(component.selectedFile).toBe(file);
    expect(component.fileUploadError).toBe('');
  });

  it('should set error if no file selected', () => {
    const event = { target: { files: [] } };
    component.onFileSelected(event);
    expect(component.selectedFile).toBeNull();
    expect(component.fileUploadError).toBe('Please select a file.');
  });
});

describe('onFileUpload()', () => {
  beforeEach(() => {
    component.setFormState();
    const file = new File(['test'], 'file.xlsx', { type: 'xlsx/csv' });
    component.selectedFile = file;
  });

  it('should upload file and call getTasks on success', fakeAsync(() => {
    const formData = new FormData();
    const response = 'File processed and tasks saved.';
    taskService.uploadTask.and.returnValue(of(response));

    spyOn(component, 'getTasks');
    spyOn(component, 'closeModal');

    component.onFileUpload();
    tick();

    expect(taskService.uploadTask).toHaveBeenCalled();
    expect(component.getTasks).toHaveBeenCalled();
    expect(component.closeModal).toHaveBeenCalled();
  }));

  it('should handle upload error', fakeAsync(() => {
    taskService.uploadTask.and.returnValue(throwError(() => new Error('Upload error')));
    component.onFileUpload();
    tick();
    expect(component.fileUploadError).toContain('failed');
  }));
  it('should handle upload failure correctly', fakeAsync(() => {
    const failureResponse = 'File format not supported';
  
    spyOn(window, 'alert');
    spyOn(component, 'closeModal');
    spyOn(component, 'getTasks');
    spyOn(component.taskForm, 'reset');
  
    // Mock uploadTask to return failure response (not 'Success')
    taskService.uploadTask.and.returnValue(of(failureResponse));
  
    component.onFileUpload();
    tick();
  
    expect(window.alert).toHaveBeenCalledWith('❌ Upload failed: ' + failureResponse);
    expect(component.fileUploadError).toBe(failureResponse);
    expect(component.taskForm.reset).toHaveBeenCalled();
    expect(component.closeModal).toHaveBeenCalled();
    expect(component.getTasks).toHaveBeenCalled();
  }));

  it('should warn and alert if no file selected before upload', () => {
    spyOn(window, 'alert'); 
  
    // Simulate no file selected
    component.selectedFile = null;
  
    component.onFileUpload();
  
    expect(window.alert).toHaveBeenCalledWith('⚠️ Please select a file before uploading.'); 
    expect(component.fileUploadError).toBe('Please select a file before uploading.');
  });
});

describe('onEdit()', () =>{
  it('should open modal, patch form with task values, format dueDate, and call getTasks', () => {
    const mockTask: Tasks = {
      taskId: 1,
      taskName: 'Test Task',
      taskDescription: 'Sample',
      userId: 5,
      taskStatus: 'New',
      taskState: 'Open',
      priority: 'High',
      userName: 'Alice',
      dueDate: new Date('2025-08-10'),
      taskType: 'Bug',
      createdBy: 1,
      referenceId: 'ABC123'
    };
  
    spyOn(component, 'openModal');
    spyOn(component, 'getTasks');
    spyOn(component.taskForm, 'patchValue');
    spyOn(component, 'toDateInputFormat').and.returnValue('2025-08-10');
  
    component.onEdit(mockTask);
  
    expect(component.openModal).toHaveBeenCalled();
    expect(component.toDateInputFormat).toHaveBeenCalledWith(mockTask.dueDate);
    expect(component.taskForm.patchValue).toHaveBeenCalledWith({
      ...mockTask,
      dueDate: '2025-08-10'
    });
    expect(component.getTasks).toHaveBeenCalled();
  });
});

describe('fileuploadControl', ()=> {
  it('should return the fileInput form control', () => {
    // Arrange: Add the 'fileInput' control to the form
    const fileControl = new FormControl(null);
    component.taskForm.addControl('fileInput', fileControl);
  
    // Act: Call the getter
    const control = component.fileuploadControl;
  
    // Assert: Expect the getter to return the correct control
    expect(control).toBe(fileControl);
  });
});

describe('toDateInputFormat()', ()=>{
  it('should return only the date part in YYYY-MM-DD format from ISO string', () => {
    const isoDate = '2025-08-07T12:34:56.789Z';
    const result = component.toDateInputFormat(isoDate);
    expect(result).toBe('2025-08-07');
  });
});


describe('updateTask()', () => {
  it('should update task if taskId is not 0', () => {
    const formValue : Tasks = {
      taskId: 5, // not 0 → update flow
      taskName: 'Updated Task',
      userId: 1,
      dueDate: new Date(),
      taskDescription: 'Updated desc',
      taskType: 'Bug',
      priority: 'High',
      userName: 'Ram',
      taskStatus: 'Due',
      createdBy: 1,  
      referenceId:'abc',
      taskState:'New'
    };

    component.taskForm.setValue(formValue);

    // Spy on needed methods
    taskService.updateTask.and.returnValue(of({}));
    spyOn(component, 'getTasks');
    spyOn(component, 'closeModal');

    component.onSubmit();

    expect(taskService.updateTask).toHaveBeenCalledWith(formValue);
    expect(component.getTasks).toHaveBeenCalled();
    expect(component.closeModal).toHaveBeenCalled();
  });

  it('should handle error if updateTask fails', () => {
    const formValue : Tasks = {
      taskId: 5,
      taskName: 'Update Fail',
      userId: 1,
      dueDate: new Date(),
      taskDescription: 'Will fail',
      taskType: 'Feature',
      priority: 'Medium',
      userName: 'Ram',
      taskStatus: 'OverDue',
      createdBy: 1,
      referenceId: 'abc',
      taskState: 'New'
    };

    component.taskForm.setValue(formValue);

    const error = new Error('Update failed');
    taskService.updateTask.and.returnValue(throwError(() => error));

    spyOn(window, 'alert'); // mock alert so it doesn't actually pop up

    component.onSubmit();

    expect(taskService.updateTask).toHaveBeenCalledWith(formValue);
    expect(loggerService.error).toHaveBeenCalledWith('Failed to update task', error);
    expect(errorHandler.handleError).toHaveBeenCalledWith(error);
    expect(window.alert).toHaveBeenCalledWith('Failed to update task. Please try again.');
  });

  it('should be invalid if required fields are missing', () => {
    component.taskForm.patchValue({
      taskName: '',
      userId: '',
      dueDate: '',
      taskDescription: '',
      taskType: '',
      priority: ''
    });

    expect(component.taskForm.valid).toBeFalse();
    expect(component.taskForm.get('taskName')?.hasError('required')).toBeTrue();
    expect(component.taskForm.get('userId')?.hasError('required')).toBeTrue();
    expect(component.taskForm.get('dueDate')?.hasError('required')).toBeTrue();
    expect(component.taskForm.get('taskDescription')?.hasError('required')).toBeTrue();
    expect(component.taskForm.get('taskType')?.hasError('required')).toBeTrue();
    expect(component.taskForm.get('priority')?.hasError('required')).toBeTrue();
  });

  it('should validate that dueDate is not in the past', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // yesterday

    component.taskForm.get('dueDate')?.setValue(pastDate.toISOString().split('T')[0]);
    const errors = component.taskForm.get('dueDate')?.errors;

    expect(errors).toBeTruthy();
    expect(errors?.['pastDate']).toBeTrue();
  });

  it('should allow valid future dueDate', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // tomorrow

    component.taskForm.get('dueDate')?.setValue(futureDate.toISOString().split('T')[0]);
    const errors = component.taskForm.get('dueDate')?.errors;

    expect(errors).toBeNull();
  });

  it('should be valid when all required fields are provided and valid', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    component.taskForm.patchValue({
      taskName: 'New Task',
      userId: 1,
      dueDate: tomorrow.toISOString().split('T')[0],
      taskDescription: 'Test Desc',
      taskType: 'Bug',
      priority: 'High'
    });
    expect(component.taskForm.valid).toBeTrue();
  });

});




});