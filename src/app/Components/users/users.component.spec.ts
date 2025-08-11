import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { UsersComponent } from './users.component';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AbstractControl, FormBuilder, FormControl, FormsModule, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UsersService } from '../../Services/users.service';
import { LoggerServiceService } from '../../Services/logger-service.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Observable, of, throwError } from 'rxjs';
import { ElementRef, ErrorHandler } from '@angular/core';
import { Users } from '../../Models/users';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;

  //services

  let mockUserService:jasmine.SpyObj<UsersService>;//create mock
  let mockLoggerServiceService:jasmine.SpyObj<LoggerServiceService>;
  let mockErrorHandler: jasmine.SpyObj<ErrorHandler>;
  


  //getAllUsers,checkUsernameExists,addUser,updateUser,deleteUser,updatepassword
  beforeEach(async () => {
  
    mockUserService=jasmine.createSpyObj('UsersService',['getAllUsers','checkUsernameExists','addUser','updateUser','deleteUser','updatepassword'])
    mockUserService.getAllUsers.and.returnValue(of([])); // return empty array for getUser()
    mockUserService.addUser.and.returnValue(of({}));
    mockUserService.updateUser.and.returnValue(of({}));
    mockUserService.deleteUser.and.returnValue(of({}));
    mockUserService.checkUsernameExists.and.returnValue(of(false));
    mockUserService.updatepassword.and.returnValue(of({}));
    mockUserService.getAllUsers.and.returnValue(of([]));
    
   
    mockLoggerServiceService = jasmine.createSpyObj('LoggerServiceService', ['info', 'warn', 'error']);
    mockErrorHandler = jasmine.createSpyObj('ErrorHandler', ['handleError']);

    await TestBed.configureTestingModule({
      imports: [UsersComponent,HttpClientTestingModule  ,CommonModule, ReactiveFormsModule,RouterLink,FormsModule,MatSelectModule,MatFormFieldModule, MatSlideToggleModule],
      providers:[
        {provide:UsersService,useValue:mockUserService},
        {provide: LoggerServiceService, useValue: mockLoggerServiceService },
        {provide:ActivatedRoute,useValue:{}},
        {provide:ErrorHandler,useValue:mockErrorHandler}
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('Should update isActive from control when the onStatusToggle called.',()=>{
    component.setFormState();
    const mockEvent={checked:true};

    component.onStatusToggle(mockEvent);
    expect(component.userForm.get('isActive')?.value).toBeTrue();

    component.onStatusToggle({checked:false});
    expect(component.userForm.get('isActive')?.value).toBeFalse();
  });


  it('Should set sortColumn and sortDirection to asc on first call',()=>{
  spyOn(component,'applyFilters')

  component.sortData('name');

  expect(component.sortColumn).toBe('name');
  expect(component.sortDirection).toBe('asc');
  expect(component.applyFilters).toHaveBeenCalled();

  })

  it('should toggle sortDirection if the same column is sorted again',()=>{
    spyOn(component,'applyFilters')

    component.sortColumn='name';
    component.sortDirection='asc';

    component.sortData('name');

    expect(component.sortDirection).toBe('desc');
    expect(component.applyFilters).toHaveBeenCalled();
  
    })

    it('should toggle sortDirection from desc to asc when sorting same column again', () => {
      spyOn(component, 'applyFilters');
    
      component.sortColumn = 'name';
      component.sortDirection = 'desc';
    
      component.sortData('name'); // same column
    
      expect(component.sortDirection).toBe('asc'); 
      expect(component.applyFilters).toHaveBeenCalled();
    });

    it('should apply all filters together', () => {
 

  component.allUsers = [
    { id:1,
      userName:'amal',
      email:'amal@gmail.com',
      roleId:2,
      roleName:'User',
      status:true,
      name:'Amal',
      phoneNumber:'9898987678',
      gender:'Male',
      password:'amalamal' },
    { id:2,
      userName:'amala',
      email:'amala@gmail.com',
      roleId:2,
      roleName:'User',
      status:true,
      name:'Amala',
      phoneNumber:'9898977678',
      gender:'Male',
      password:'amalamala' },
  ];

  component.filters = { username: 'amala', name: 'Amala', role: 'User' };
  component.applyFilters();

  expect(component.filteredUser.length).toBe(1);
  expect(component.filteredUser[0].userName).toBe('amala');
});

it('should sort filteredUser by string column in ascending order', () => {
  
  component.allUsers  = [
    {id:3,userName:'vimal',email:'',roleId:2,roleName:'',status:true,name:'AA',phoneNumber:'',gender:'',password:'' },
    {id:6,userName:'dijo',email:'',roleId:2,roleName:'',status:true,name:'FF',phoneNumber:'',gender:'',password:'' },
    {id:4,userName:'fijo',email:'',roleId:2,roleName:'',status:true,name:'CC',phoneNumber:'',gender:'',password:'' },
  ];

  component.sortColumn = 'name';
  component.sortDirection = 'asc';

  component.applyFilters();

  expect(component.filteredUser.map(u => u.name)).toEqual(['AA', 'CC', 'FF']);
});

it('should sort filteredUser by numeric column in ascending order', () => {
  component.allUsers = [
    {id:3,userName:'vimal',email:'',roleId:2,roleName:'',status:true,name:'AA',phoneNumber:'',gender:'',password:'' },
    {id:6,userName:'dijo',email:'',roleId:2,roleName:'',status:true,name:'FF',phoneNumber:'',gender:'',password:'' },
    {id:4,userName:'fijo',email:'',roleId:2,roleName:'',status:true,name:'CC',phoneNumber:'',gender:'',password:'' },
  ];

  component.sortColumn = 'id';
  component.sortDirection = 'asc';

  component.applyFilters();

  expect(component.filteredUser.map(u => u.id)).toEqual([3, 4, 6]);
});
it('should sort filteredUser by string column in descending order', () => {
  component.allUsers = [
    {id:3,userName:'vimal',email:'',roleId:2,roleName:'',status:true,name:'AA',phoneNumber:'',gender:'',password:'' },
    {id:6,userName:'dijo',email:'',roleId:2,roleName:'',status:true,name:'FF',phoneNumber:'',gender:'',password:'' },
    {id:4,userName:'fijo',email:'',roleId:2,roleName:'',status:true,name:'CC',phoneNumber:'',gender:'',password:'' },
  ];

  component.sortColumn = 'name';
  component.sortDirection = 'desc';

  component.applyFilters();

  expect(component.filteredUser.map(u => u.name)).toEqual(['FF', 'CC', 'AA']);
});

it('should handle equal numeric values and return 0 for comparison', () => {
  component.allUsers = [
    {id:3,userName:'vimal',email:'',roleId:2,roleName:'',status:true,name:'AA',phoneNumber:'',gender:'',password:'' },
    {id:6,userName:'dijo',email:'',roleId:2,roleName:'',status:true,name:'FF',phoneNumber:'',gender:'',password:'' },
    {id:6,userName:'fijo',email:'',roleId:2,roleName:'',status:true,name:'CC',phoneNumber:'',gender:'',password:'' },// duplicate id
  ];

  component.sortColumn = 'id';
  component.sortDirection = 'asc';

  component.applyFilters();

  // Expect the users with equal IDs to retain relative order (stable sort)
  expect(component.filteredUser.map(u => u.name)).toEqual(['AA', 'FF', 'CC']);
});
it('should return end index when it is less than or equal to filteredUser.length', () => {
  

  // Mock getStartIndex()
  spyOn(component, 'getStartIndex').and.returnValue(0);

  component.filteredUser = [
    {id:1,userName:'vimal',email:'',roleId:2,roleName:'',status:true,name:'AA',phoneNumber:'',gender:'',password:'' },
    {id:2,userName:'dijo',email:'',roleId:2,roleName:'',status:true,name:'FF',phoneNumber:'',gender:'',password:'' },
    {id:3,userName:'fijo',email:'',roleId:2,roleName:'',status:true,name:'CC',phoneNumber:'',gender:'',password:'' }
  ];

  component.paginatedUser = [
    {id:3,userName:'vimal',email:'',roleId:2,roleName:'',status:true,name:'AA',phoneNumber:'',gender:'',password:'' },
    {id:4,userName:'dijo',email:'',roleId:2,roleName:'',status:true,name:'FF',phoneNumber:'',gender:'',password:'' },
    {id:5,userName:'dijo',email:'',roleId:2,roleName:'',status:true,name:'FF',phoneNumber:'',gender:'',password:'' },
    {id:6,userName:'fijo',email:'',roleId:2,roleName:'',status:true,name:'CC',phoneNumber:'',gender:'',password:'' }
  ];

  const result = component.getEndIndex(); // end = 0 + 2 = 2

  // filteredUser.length = 4, so end (2) <= length => returns 2
  expect(result).toBe(3); // Covers the ELSE path
});

it('should update pageSize, reset currentPage, calculate totalPages, and call updatePaginatedUsers()', () => {
 // const component = new UserComponent();

  // Setup initial data
  component.filteredUser = new Array(25).fill({}).map((_, i) => ({ id: i + 1,userName:'vimal',email:'',roleId:2,roleName:'',status:true,name:'AA',phoneNumber:'',gender:'',password:'' }));
  component.updatePaginatedUsers = jasmine.createSpy('updatePaginatedUsers');

 // Create a real <select> element with an option
 const mockSelect = document.createElement('select');
 const option = document.createElement('option');
 option.value = '10';
 mockSelect.appendChild(option);
  const mockEvent = { target: mockSelect } as unknown as Event;

  // Act
  component.onPageSizeChange(mockEvent);

  // Assert
  expect(component.pageSize).toBe(10);
  expect(component.currentPage).toBe(1);
  expect(component.totalPages).toBe(Math.ceil(25 / 10)); // Should be 3
  expect(component.updatePaginatedUsers).toHaveBeenCalled();
});

it('should update paginatedUser based on currentPage and pageSize',()=>{
  //arrange
component.filteredUser=Array.from({length:10},(_,i)=>({ id: i + 1,
  userName: `user${i + 1}`,
  email: '',
  roleId: 2,
  roleName: '',
  status: true,
  name: 'Name',
  phoneNumber: '',
  gender: '',
  password: ''}))

  component.currentPage=2;
  component.pageSize=3;
   //act
  component.updatePaginatedUsers();
  //assert
  expect(component.paginatedUser.length).toBe(3);
  expect(component.paginatedUser[0].id).toBe(4);
  expect(component.paginatedUser[1].id).toBe(5);
  expect(component.paginatedUser[2].id).toBe(6);

})

it('should update currentPage and call updatePaginatedUsers when goToPage is called',()=>{
//arrange
const page=3;
spyOn(component,'updatePaginatedUsers');
//act
component.goToPage(page);
//assert
expect(component.currentPage).toBe(page); // currentPage updated
expect(component.updatePaginatedUsers).toHaveBeenCalled();// updatePaginatedUsers called
});

it('should set display to block on element with id "myModal"', () => {
  // Make sure the component is initialized and rendered
  fixture.detectChanges();

  // Grab the modal from the component's template, not from document.body
  const modal: HTMLElement = fixture.nativeElement.querySelector('#myModal');

  // Initial display might be '' or 'none'
  modal.style.display = 'none';

  component.openModal();

  expect(modal.style.display).toBe('block');
});

it('should call setFormState and set display to none on model element', () => {
  // Arrange: mock model as ElementRef with nativeElement and style
  component.model = {
    nativeElement: document.createElement('div')
  } as ElementRef;

  component.model.nativeElement.style.display = 'block';

  spyOn(component, 'setFormState');

  // Act
  component.closeModal();

  // Assert
  expect(component.setFormState).toHaveBeenCalled();
  expect(component.model.nativeElement.style.display).toBe('none');
});

it('should call setFormState and not throw if model is null', () => {
  // Arrange
  component.model = undefined;
  spyOn(component, 'setFormState');

  // Act & Assert
  expect(() => component.closeModal()).not.toThrow();
  expect(component.setFormState).toHaveBeenCalled();
});



it('should call openModal, set originalUserName and patch userForm on onEdit', () => {
  // Arrange
  const user = {
    userName: 'testuser',
    roleId: '3',
    status: true,
    email: 'test@example.com',
    id: 123,
    // add other properties as needed
  };

  spyOn(component, 'openModal'); // spy on openModal

  // Initialize the form with controls similar to component's userForm setup
  const fb = TestBed.inject(FormBuilder);
  component.userForm = fb.group({
    userName: [''],
    roleid: [''],
    isActive: [''],
    email: [''],
    id: [''],
    // add all form controls your form uses
  });

  // Act
  component.onEdit(user as any);

  // Assert
  expect(component.openModal).toHaveBeenCalled();
  expect(component.orginalUserName).toBe(user.userName);

  // Check that form is patched with correct values
  expect(component.userForm.value.userName).toBe(user.userName);
  expect(component.userForm.value.roleid).toBe(Number(user.roleId));
  expect(component.userForm.value.isActive).toBe(Number(user.status));
  expect(component.userForm.value.email).toBe(user.email);
  expect(component.userForm.value.id).toBe(user.id);
});

describe('onDelete', () => {
  let confirmSpy: jasmine.Spy;
  let alertSpy: jasmine.Spy;
  let consoleErrorSpy: jasmine.Spy;

  beforeEach(() => {
    confirmSpy = spyOn(window, 'confirm');
    alertSpy = spyOn(window, 'alert');
    consoleErrorSpy = spyOn(console, 'error');

    spyOn(component, 'getUser'); // spy on getUser method
  });

  it('should delete user if confirm returns true', () => {
    confirmSpy.and.returnValue(true);

    mockUserService.deleteUser.and.returnValue(of({})); // mock successful delete
    //spyOn(component.logger, 'info');

    const userId = 123;
    component.onDelete(userId);

    expect(confirmSpy).toHaveBeenCalledWith("Are you sure you want to delete this User?");
    expect(mockUserService.deleteUser).toHaveBeenCalledWith(userId);
    expect(alertSpy).toHaveBeenCalledWith("User deleted successfully.");
    expect(mockLoggerServiceService.info).toHaveBeenCalledWith(`User with ID ${userId} deleted.`);
    expect(component.getUser).toHaveBeenCalled();
  });

  it('should not call deleteUser if confirm returns false', () => {
    confirmSpy.and.returnValue(false);

    component.onDelete(123);

    expect(mockUserService.deleteUser).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(component.getUser).not.toHaveBeenCalled();
  });

  it('should handle error with status 400 and show err.error.detail alert', () => {
    confirmSpy.and.returnValue(true);

    const errorResponse = {
      status: 400,
      error: { detail: 'Bad request detail' }
    };

    mockUserService.deleteUser.and.returnValue(throwError(() => errorResponse));
   
    component.onDelete(123);

    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to delete user", errorResponse);
    expect(mockLoggerServiceService.error).toHaveBeenCalledWith("Failed to delete user", errorResponse);
    expect(mockErrorHandler.handleError).toHaveBeenCalledWith(errorResponse);
    expect(alertSpy).toHaveBeenCalledWith('Bad request detail');
  });

  it('should handle error with other status and show generic alert', () => {
    confirmSpy.and.returnValue(true);

    const errorResponse = {
      status: 500,
      error: {}
    };

    mockUserService.deleteUser.and.returnValue(throwError(() => errorResponse));
   
    component.onDelete(123);

    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to delete user", errorResponse);
    expect(mockLoggerServiceService.error).toHaveBeenCalledWith("Failed to delete user", errorResponse);
    expect(mockErrorHandler.handleError).toHaveBeenCalledWith(errorResponse);
    expect(alertSpy).toHaveBeenCalledWith("Failed to delete user. Please try again later.");
  });
});

// it('should initialize pswdForm with controls and validators', () => {
//   // Spy on the custom validator method
//   spyOn(component, 'passwordsMatchValidator').and.callThrough();

//   // Call the method to initialize the form
//   component.setPswdFormState();

//   const form = component.pswdForm;

//   expect(form).toBeDefined();
//   expect(form.get('id')).toBeDefined();
//   expect(form.get('curpswd')).toBeDefined();
//   expect(form.get('newpswd')).toBeDefined();
//   expect(form.get('confrmNewpswd')).toBeDefined();

//   // Check validators on controls
//   expect(form.get('curpswd')?.validator).toBeTruthy();
//   expect(form.get('newpswd')?.validator).toBeTruthy();
//   expect(form.get('confrmNewpswd')?.validator).toBeTruthy();

//   // Check form group validators include the custom one
//   expect(component.passwordsMatchValidator).toHaveBeenCalled();

//   // Spy on updateValueAndValidity of 'confrmNewpswd'
//   const updateSpy = spyOn(form.get('confrmNewpswd')!, 'updateValueAndValidity');

//   // Trigger value change on newpswd to test subscription
//   form.get('newpswd')?.setValue('newPassword123');

//   expect(updateSpy).toHaveBeenCalled();
// });
describe('passwordsMatchValidator', () => {
  it('should return error object when passwords do not match', () => {
    const validatorFn = component.passwordsMatchValidator();
    const formGroupMock = {
      get: (controlName: string) => {
        const values: Record<string, string> = {
          newpswd: 'password1',
          confrmNewpswd: 'password2', // different to trigger error
        };
        return { value: values[controlName] };
      },
    } as AbstractControl;

    const result = validatorFn(formGroupMock);
    expect(result).toEqual({ passwordMismatch: true });
  });

  it('should return null when passwords match', () => {
    const validatorFn = component.passwordsMatchValidator();
    const formGroupMock = {
      get: (controlName: string) => {
        const values: Record<string, string> = {
          newpswd: 'samePassword',
          confrmNewpswd: 'samePassword',
        };
        return { value: values[controlName] };
      },
    } as AbstractControl;

    const result = validatorFn(formGroupMock);
    expect(result).toBeNull();
  });

  it('should return null when one or both passwords are missing', () => {
    const validatorFn = component.passwordsMatchValidator();
    const formGroupMock = {
      get: (controlName: string) => {
        const values: Record<string, string> = {
          newpswd: '',
          confrmNewpswd: '',
        };
        return { value: values[controlName] };
      },
    } as AbstractControl;

    const result = validatorFn(formGroupMock);
    expect(result).toBeNull();
  });
});


describe('openPassswordModel', () => {
  it('should initialize form, patch user id, and display passwordModal', () => {
    spyOn(component, 'setPswdFormState').and.callFake(() => {
      // mock form creation
      const fb = new FormBuilder();
      component.pswdForm = fb.group({ id: 0 });
      component.pswdForm.patchValue = jasmine.createSpy('patchValue');
    });

    // Create a dummy div with id 'passwordModal' in document body
    const dummyModal = document.createElement('div');
    dummyModal.id = 'passwordModal';
    dummyModal.style.display = 'block';
    document.body.appendChild(dummyModal);

    const user = { id: 42 } as Users;

    component.openPassswordModel(user);

    expect(component.setPswdFormState).toHaveBeenCalled();
    expect(component.pswdForm.patchValue).toHaveBeenCalledWith({ id: user.id });
    expect(dummyModal.style.display).toBe('block');

    // Clean up
    document.body.removeChild(dummyModal);
  });

  it('should not throw if passwordModal element is not found', () => {
    spyOn(component, 'setPswdFormState').and.callFake(() => {
      const fb = new FormBuilder();
      component.pswdForm = fb.group({ id: 0 });
      component.pswdForm.patchValue = jasmine.createSpy('patchValue');
    });

    // Make sure there is no element with id 'passwordModal'
    const existing = document.getElementById('passwordModal');
    if (existing) existing.remove();

    const user = { id: 1 } as Users;

    expect(() => component.openPassswordModel(user)).not.toThrow();
  });
});

describe('closePswdModel', () => {
  it('should set passwordModal.nativeElement.style.display to none if passwordModal exists', () => {
    // Mock passwordModal as ElementRef with nativeElement and style
    const nativeElement = document.createElement('div');
    nativeElement.style.display = 'block';

    component.passwordModal = {
      nativeElement
    } as ElementRef;

    component.closePswdModel();

    expect(component.passwordModal.nativeElement.style.display).toBe('none');
  });

  it('should not throw if passwordModal is null', () => {
    component.passwordModal = undefined;

    expect(() => component.closePswdModel()).not.toThrow();
  });
});


describe('getUser', () => {
  it('should populate userList and allUsers on successful fetch, and apply filters', () => {
    const mockUsers = [
      { id:1,
        userName:'amal',
        email:'',
        roleId:1,
        roleName:'',
        status:true,
        name:'',
        phoneNumber:'',
        gender:'',
        password:'' }
    ];

    // Arrange: Set up the service to return mock data
    mockUserService.getAllUsers.and.returnValue(of(mockUsers));
    spyOn(component, 'applyFilters');

    // Act
    component.getUser();

    // Assert
    expect(mockUserService.getAllUsers).toHaveBeenCalled();
    expect(component.userList).toEqual(mockUsers);
    expect(component.allUsers).toEqual(mockUsers);
    expect(component.applyFilters).toHaveBeenCalled();
  });

  it('should handle error correctly when fetching users fails', () => {
    const errorResponse = { status: 500, message: 'Internal Server Error' };

    mockUserService.getAllUsers.and.returnValue(throwError(() => errorResponse));
    spyOn(window, 'alert');

    component.getUser();

    expect(mockUserService.getAllUsers).toHaveBeenCalled();
    expect(mockLoggerServiceService.error).toHaveBeenCalledWith('Failed to fetch User', errorResponse);
    expect(mockErrorHandler.handleError).toHaveBeenCalledWith(errorResponse);
    expect(window.alert).toHaveBeenCalledWith('Unable to load User. Please try again later.');
  });
});

describe('UsernameExistsValidator', () => {

  beforeEach(() => {
    component.orginalUserName = 'existingUser';
  });

  it('should return null immediately if value equals orginalUserName', fakeAsync(() => {
    const control = new FormControl('existingUser');
    const validator = component.UsernameExistsValidator();

    let result: any;
   // validator(control).subscribe(res => result = res);
   (validator(control) as Observable<ValidationErrors|null>).subscribe(res=>result=res);

    tick(300); // simulate debounce
    expect(result).toBeNull();
  }));

  it('should return null if username is available', fakeAsync(() => {
    const control = new FormControl('newUser');
    const validator = component.UsernameExistsValidator();

    mockUserService.checkUsernameExists.and.returnValue(of(false));

    let result: any;
    (validator(control) as Observable<ValidationErrors|null>).subscribe(res => result = res);

    control.setValue('newUser');
    tick(300); // simulate debounce

    expect(mockUserService.checkUsernameExists).toHaveBeenCalledWith('newUser');
    expect(result).toBeNull();
  }));

  it('should return error object if username is taken', fakeAsync(() => {
    const control = new FormControl('takenUser');
    const validator = component.UsernameExistsValidator();

    mockUserService.checkUsernameExists.and.returnValue(of(true));

    let result: any;
    (validator(control) as Observable<ValidationErrors|null>).subscribe(res => result = res);

    control.setValue('takenUser');
    tick(300); // simulate debounce

    expect(mockUserService.checkUsernameExists).toHaveBeenCalledWith('takenUser');
    expect(result).toEqual({ usernameTaken: true });
  }));
});


describe('onSubmit', () => {

it('should alert and return if form is invalid', () => {
  component.userForm.markAsTouched();
  component.userForm.setErrors({ invalid: true });

  spyOn(window, 'alert');

  component.onSubmit();

  expect(window.alert).toHaveBeenCalledWith('Please Fill All Fields....');
});

it('should add a new user when form is valid and id is 0', () => {
  const mockUser = {
    id: 0,
    name: 'John',
    userName: 'john',
    email: 'john@example.com',
    roleid: 1,
    phoneNumber: '55454',
    gender: 'Male',
    isActive: true
  };

  component.userForm.setValue(mockUser); // Simulate valid form input

  spyOn(component, 'getUser');
  spyOn(component, 'closeModal');
  spyOn(window, 'alert');

  component.onSubmit();

  expect(mockUserService.addUser).toHaveBeenCalledWith(mockUser);
  expect(component.getUser).toHaveBeenCalled();
  expect(component.closeModal).toHaveBeenCalled();
  expect(window.alert).toHaveBeenCalledWith('User Added Successfully....');
});



it('should update user when id != 0 and form is valid', () => {
  component.userForm.setValue({
    id: 5,
    userName: 'john',
    email: 'john@example.com',
    roleid: 1,
    isActive: 1,
    name: 'John',
    phoneNumber: '1234567890',
    gender: 'Male',
    //password: 'abc123'
  });

  mockUserService.updateUser.and.returnValue(of({}));

  spyOn(window, 'alert');
  spyOn(component, 'getUser');
  spyOn(component.userForm, 'reset');
  spyOn(component, 'closeModal');

  component.onSubmit();

  expect(mockUserService.updateUser).toHaveBeenCalledWith(component.formValue);
  expect(window.alert).toHaveBeenCalledWith('User Updated Successfully....');
  expect(mockLoggerServiceService.info).toHaveBeenCalledWith('User updated successfully');
  expect(component.getUser).toHaveBeenCalled();
  expect(component.userForm.reset).toHaveBeenCalled();
  expect(component.closeModal).toHaveBeenCalled();
});

it('should handle error during addUser and set emailExists error', () => {
  const error = {
    status: 400,
    error: { error: 'Email already exists.' }
  };

  component.userForm.setValue({
    id: 0,
    userName: 'john',
    email: 'existing@example.com',
    roleid: 1,
    isActive: 1,
    name: 'John',
    phoneNumber: '1234567890',
    gender: 'Male',
   //password: 'abc123'
  });

  // Setup mock to throw error
  mockUserService.addUser.and.returnValue(throwError(() => error));
  spyOn(window, 'alert');
  // const emailControl = new FormControl();
  // component.emailControl = emailControl;
  const emailCtrl = component.userForm.get('email');

  component.onSubmit();

  expect(window.alert).toHaveBeenCalledWith('Error: Email already exists.');
  expect(mockLoggerServiceService.error).toHaveBeenCalled();
  expect(emailCtrl?.hasError('emailExists')).toBeTrue();
});

it('should handle error during updateUser and alert error', () => {
  const error = {
    status: 500,
    error: { message: 'Server Error' }
  };

  component.userForm.setValue({
    id: 2,
    userName: 'john',
    email: 'john@example.com',
    roleid: 1,
    isActive: 1,
    name: 'John',
    phoneNumber: '1234567890',
    gender: 'Male',
   // password: 'abc123'
  });

  mockUserService.updateUser.and.returnValue(throwError(() => error));

  spyOn(window, 'alert');

  component.onSubmit();

  expect(window.alert).toHaveBeenCalledWith('Error: Server Error');
  expect(mockLoggerServiceService.error).toHaveBeenCalledWith('Failed to update user', error);
  expect(mockErrorHandler.handleError).toHaveBeenCalledWith(error);
});
it('should show message for error.error.message', () => {
  component.userForm.setValue({
    id: 0,
    name: 'John',
    userName: 'john',
    email: 'john@example.com',
    roleid: 1,
    phoneNumber: '1234567890',
    gender: 'Male',
    isActive: true
  });

  mockUserService.addUser.and.returnValue(
    throwError(() => ({ status: 500, error: { message: 'Bad Request' } }))
  );
  spyOn(window, 'alert');

  component.onSubmit();

  expect(window.alert).toHaveBeenCalledWith('Error: Bad Request');
});

// Case B: error.error.error exists
it('should show message for error.error.error and set emailExists', () => {
  component.userForm.setValue({id: 0,
    name: 'John',
    userName: 'john',
    email: 'john@example.com',
    roleid: 1,
    phoneNumber: '1234567890',
    gender: 'Male',
    isActive: true });
  mockUserService.addUser.and.returnValue(throwError(() => ({ status: 400, error: { error: 'Email already exists.' } })));
  spyOn(window, 'alert');

  component.onSubmit();

  expect(window.alert).toHaveBeenCalledWith('Error: Email already exists.');
  expect(component.userForm.get('email')?.hasError('emailExists')).toBeTrue();
});
// Case C: top-level error.message only
it('should show message for top-level error.message', () => {
  component.userForm.setValue({
    id: 2,
    name: 'Jane Doe',
    userName: 'jane.doe',
    email: 'jane@example.com',
    roleid: 1,
    phoneNumber: '9876543210',
    gender: 'Female',
    isActive: true
  });

  mockUserService.updateUser.and.returnValue(
    throwError(() => ({ status: 500, message: 'Server Error' }))
  );
  spyOn(window, 'alert');

  component.onSubmit();

  expect(window.alert).toHaveBeenCalledWith('Error: Server Error');
});

// Case D: fallback default when no message present
it('should fallback to default error message', () => {
  component.userForm.setValue({
    id: 0,
    name: 'John Doe',
    userName: 'john.doe',
    email: 'john@example.com',
    roleid: 1,
    phoneNumber: '1234567890',
    gender: 'Male',
    isActive: true
  });

  mockUserService.addUser.and.returnValue(
    throwError(() => ({ status: 500 }))
  );
  spyOn(window, 'alert');

  component.onSubmit();

  expect(window.alert).toHaveBeenCalledWith('Error: Something went wrong.');
});
it('should show default fallback message if no error details', () => {
  component.userForm.setValue({
    id: 2,
    name: 'John Doe',
    userName: 'johndoe',
    email: 'john@example.com',
    roleid: 1,
    phoneNumber: '9876543210',
    gender: 'Male',
    isActive: true
  });

  mockUserService.updateUser.and.returnValue(
    throwError(() => ({ status: 500 }))
  );
  spyOn(window, 'alert');

  component.onSubmit();

  expect(window.alert).toHaveBeenCalledWith('Error: Failed to update user.');
});


})


describe('UsersComponent updatePassword', () => { 


  it('should alert and return if form is invalid', () => {
    spyOn(window, 'alert');
    component.pswdForm.markAllAsTouched();
    component.pswdForm.setErrors({ invalid: true });

    component.updatePassword();

    expect(window.alert).toHaveBeenCalledWith('Please fill in all fields and ensure passwords match.');
  });

  it('should call updatepassword on valid form and handle success', () => {
    spyOn(window, 'alert');
    spyOn(component, 'closePswdModel');

    // Make form valid
    component.pswdForm.setValue({ id: 1, curpswd: 'a', newpswd: 'b', confrmNewpswd: 'b' });

    mockUserService.updatepassword.and.returnValue(of({}));

    component.updatePassword();

    expect(mockUserService.updatepassword).toHaveBeenCalledWith({id: 1,
       curpswd: 'a',
       newpswd: 'b',
       confrmNewpswd: 'b'});
    expect(window.alert).toHaveBeenCalledWith('Password updated successfully');
    expect(component.pswdForm.value).toEqual({ id: null, curpswd: null, newpswd: null, confrmNewpswd: null }); // after reset
    expect(component.closePswdModel).toHaveBeenCalled();
  });

 it('should handle error when updatepassword fails', () => {
    spyOn(window, 'alert');

    component.pswdForm.setValue({ id: 1, curpswd: 'a', newpswd: 'b', confrmNewpswd: 'b' });

    const mockError = { status: 500 };
    mockUserService.updatepassword.and.returnValue(throwError(mockError));

    component.updatePassword();

    expect(mockLoggerServiceService.error).toHaveBeenCalledWith('Failed to update user', mockError);
    expect(mockErrorHandler.handleError).toHaveBeenCalledWith(mockError);
    expect(window.alert).toHaveBeenCalledWith('Failed to update user. Please try again later.');
  });
});

});
