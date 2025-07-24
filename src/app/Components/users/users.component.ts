import { Component, ElementRef, OnInit, ViewChild, inject ,ErrorHandler} from '@angular/core';
import { AbstractControl,FormsModule,ValidationErrors,AsyncValidatorFn, FormBuilder, FormGroup, ReactiveFormsModule, Validators,ValidatorFn  } from '@angular/forms';
import { Users } from '../../Models/users';
import { UsersService } from '../../Services/users.service';
import { CommonModule } from '@angular/common';
import { combineLatest, debounceTime, first, map, switchMap,of } from 'rxjs';
import { RouterLink} from '@angular/router';
import { LoggerServiceService } from '../../Services/logger-service.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,RouterLink,FormsModule,MatSelectModule,MatFormFieldModule, MatSlideToggleModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
@ViewChild('myModal') model : ElementRef | undefined;
@ViewChild('passwordModal') passwordModal : ElementRef | undefined;

userList: Users[] = [];
userService = inject(UsersService);
orginalUserName:string='';
userForm : FormGroup = new FormGroup({});
pswdForm: FormGroup = new FormGroup({});
private readonly JWT_TOKEN = 'JWT_TOKEN';
constructor(private fb: FormBuilder,private logger:LoggerServiceService,private errorHandler:ErrorHandler){}

// onStatusToggle(event: any): void {
//   const isActive = event.checked; // true or false
//   this.userForm.get('userStatus')?.setValue(isActive ? 1 : 0);
// }

onStatusToggle(event: any): void {
  const isActive = event.checked; // already true or false
  this.userForm.get('isActive')?.setValue(isActive); // ✅ set as boolean
}


formValue: any;

filters = {
  username: '',
  role:'',
  name:''
};
role: string[] = ['Admin', 'User']; 
allUsers: Users[] = []; // original data
currentPage: number = 1;
pageSize: number = 5;
paginatedUser: Users[] = [];
filteredUser: Users[] = [];
totalPages: number = 1;
pageSizeOptions: number[] = [5, 10, 20, 50, 100];
sortColumn: string = '';
sortDirection: 'asc' | 'desc' = 'asc';

sortData(column: string): void {
  if (this.sortColumn === column) {
    // Toggle sort direction
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }

  this.applyFilters(); // Reapply filters and sorting
}

ngOnInit(): void {
  this.setFormState();
  this.getUser();
  this.setPswdFormState();
}

applyFilters(): void {
  const { username, role,name} = this.filters;

  this.filteredUser  = this.allUsers.filter(user => {
    const matchesUserName = username ? user.userName.toLowerCase().includes(username.toLowerCase()) : true;
    const matchesName = name ? user.name.toLowerCase().includes(name.toLowerCase()) : true;
    const matchesRole = role ? user.roleName === role : true;
    return matchesUserName&& matchesName && matchesRole;
  });
  if (this.sortColumn) {
    this.filteredUser.sort((a: any, b: any) => {
      const valueA = a[this.sortColumn];
      const valueB = b[this.sortColumn];

      // Handle string or number comparison
      const comparison = typeof valueA === 'string'
        ? valueA.localeCompare(valueB)
        : valueA > valueB ? 1 : valueA < valueB ? -1 : 0;

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  this.totalPages = Math.ceil(this.filteredUser.length / this.pageSize);
  this.currentPage = 1; // reset to first page
  this.updatePaginatedTasks();
}
getStartIndex(): number {
  return (this.currentPage - 1) * this.pageSize;
}
getEndIndex(): number {
  const end = this.getStartIndex() + this.paginatedUser.length;
  return end > this.filteredUser.length ? this.filteredUser.length : end;
}
onPageSizeChange(event: Event): void {
  const selected = (event.target as HTMLSelectElement).value;
  this.pageSize = parseInt(selected, 10);
  this.currentPage = 1; // Reset page to 1 when size changes
  this.totalPages = Math.ceil(this.filteredUser.length / this.pageSize);
  this.updatePaginatedUsers();
}
updatePaginatedUsers(): void {
  const start = (this.currentPage - 1) * this.pageSize;
  const end = start + this.pageSize;
  this.paginatedUser = this.filteredUser.slice(start, end);
}
updatePaginatedTasks(): void {
  const start = (this.currentPage - 1) * this.pageSize;
  const end = start + this.pageSize;
  this.paginatedUser = this.filteredUser.slice(start, end);
}
goToPage(page: number): void {
  this.currentPage = page;
  this.updatePaginatedTasks();
}

// onStatusToggle(event: MatSlideToggleChange): void {
//   this.userForm.get('userStatus')?.setValue(event.checked ? 1 : 2);
// }


  openModal()
  {
    const userModel = document.getElementById('myModal');
    if(userModel != null)
    {
      userModel.style.display = 'block';
    }
  }

  closeModal()
  {
    this.setFormState();
    if(this.model != null)
    {
      this.model.nativeElement.style.display = 'none';
    }
    // this.userForm.reset();
    // this.closeModal();
  }

getUser()
{
  this.userService.getAllUsers().subscribe({
    next: (res) => {
      this.userList = res;
      this.allUsers = res; // ✅ Needed for filtering
      this.applyFilters();
    },
    error: (err) => {
      this.logger.error("Failed to fetch User", err);         
      this.errorHandler.handleError(err);                     
      alert("Unable to load User. Please try again later.");  
    }
  });
}

get userNameControl()
{
  return this.userForm.get('userName');
}

 get emailControl() {
  return this.userForm.get('email');  // Access the email control
}

  get phoneNumberControl(){
    return this.userForm.get('phoneNumber');
  }

  setFormState()
  {
    this.userForm = this.fb.group({
      id: 0,
      name: ['',[Validators.required]],
      userName: ['',[Validators.required,], [this.UsernameExistsValidator()]],
      email: ['',[Validators.required, Validators.email,
        // Validators.pattern('^[a-zA-Z0-9._%+-]+@example\\.com$')
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$') 
        ]],
      //password: ['',[Validators.required]],
      roleid: ['',[Validators.required]],
      phoneNumber: ['',[Validators.required, Validators.maxLength(10), Validators.minLength(10),Validators.pattern(/^[0-9]{10}$/)]],
      gender: ['',Validators.required],
      isActive:[true]
    });
  }

  UsernameExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if(control.value===this.orginalUserName){
        return of(null);
      }
      return control.valueChanges.pipe(
        debounceTime(300),
        switchMap(username => this.userService.checkUsernameExists(username)),
        map(exists => (exists ? { usernameTaken: true } : null)),
        first()
      );
    };
  }


  onSubmit() {
    console.log(this.userForm.value);
    if (this.userForm.invalid) {
      alert('Please Fill All Fields....');
      return;
    }
  
    this.formValue = this.userForm.value;
  
    if (this.userForm.value.id == 0) {
      this.userService.addUser(this.formValue).subscribe({
        next: () => {
          alert('User Added Successfully....');
          this.getUser();
          this.userForm.reset();
          this.closeModal();
        },
        error: (error) => {
          console.log('Error status:', error.status);
          console.log('Error response:', error.error);
          console.error("User add failed:", error);
          this.logger.error("User add failed:", error);
  
          // ✅ Alert backend error message
          const errorMessage = error.error?.message || error.error?.error || error.message || 'Something went wrong.';
          alert(`Error: ${errorMessage}`);
  
          if (error.status === 400 && error.error?.error === "Email already exists.") {
            const emailCtrl = this.emailControl;
            if (emailCtrl) {
              emailCtrl.setErrors({ emailExists: true });
            }
          }
        }
      });
    } else {
      this.userService.updateUser(this.formValue).subscribe({
        next: (res) => {
          alert('User Updated Successfully....');
          this.logger.info('User updated successfully');
          this.getUser();
          this.userForm.reset();
          this.closeModal();
        },
        error: (err) => {
          console.error('Failed to update user', err);
          this.logger.error('Failed to update user', err);
          this.errorHandler.handleError(err);
  
          // ✅ Alert backend error message
          const errorMessage = err.error?.message || err.error?.error || err.message || 'Failed to update user.';
          alert(`Error: ${errorMessage}`);
        }
      });
    }
  }
  

  onEdit(user:Users)
  {  
    this.openModal();
    this.orginalUserName=user.userName;
    this.userForm.patchValue(
      //User
      {
        ...user,
        roleid: Number(user.roleId),
        isActive: Number(user.status)
      });
  }

  

  onDelete(id: number) {
    const isConfirm = confirm("Are you sure you want to delete this User?");
    if (isConfirm) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          alert("User deleted successfully.");
          this.logger.info(`User with ID ${id} deleted.`);
          this.getUser();
        },
        error: (err) => {
          debugger
          console.error("Failed to delete user", err);
          this.logger.error("Failed to delete user", err);
          this.errorHandler.handleError(err);

          if(err.status===400 && err.error?.detail){
            alert(err.error.detail);
          }else{
          alert("Failed to delete user. Please try again later.");
          }
        }
      });
    }
  }

  
  setPswdFormState() {
    this.pswdForm = this.fb.group({
      id: 0,
      curpswd: ['', [Validators.required]],
      newpswd: ['', [Validators.required]],
      confrmNewpswd: ['', [Validators.required]]
    }, { validators: this.passwordsMatchValidator() }); 

    this.pswdForm.get('newpswd')?.valueChanges.subscribe(() => {
      this.pswdForm.get('confrmNewpswd')?.updateValueAndValidity();
    });
  }

  openPassswordModel(user:Users)
  {
    this.setPswdFormState()
    this.pswdForm.patchValue({id:user.id})
    const pswdModel = document.getElementById('passwordModal');
    if(pswdModel != null)
    {
      pswdModel.style.display = 'block';
    }
  }
  closePswdModel(){
   // this.setFormState();
    if(this.passwordModal != null)
    {
      this.passwordModal.nativeElement.style.display = 'none';
    }
  }

  passwordsMatchValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const newPassword = group.get('newpswd')?.value;
      const confirmPassword = group.get('confrmNewpswd')?.value;
      console.log('Validating passwords:', newPassword, confirmPassword);

      if (!newPassword || !confirmPassword) return null;
      return newPassword === confirmPassword ? null : { passwordMismatch: true };
    };
  }

  updatePassword(){
    if(this.pswdForm.invalid){
      this.pswdForm.markAllAsTouched();
      alert('Please fill in all fields and ensure passwords match.')
      return;
    }
     this.formValue=this.pswdForm.value;

    this.userService.updatepassword(this.formValue).subscribe({
      next:()=>{
        alert('Password updated successfully');
        this.pswdForm.reset();
        this.closePswdModel();
      },
      error:(err)=>{
        console.error('Failed to update user', err);
        this.logger.error('Failed to update user', err);
        this.errorHandler.handleError(err);
        alert('Failed to update user. Please try again later.');
      }
    });
  }

}
