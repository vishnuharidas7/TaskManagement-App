import { Component, ElementRef, OnInit, ViewChild, inject ,ErrorHandler} from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ReactiveFormsModule, Validators,ValidatorFn  } from '@angular/forms';
import { Users } from '../../Models/users';
import { UsersService } from '../../Services/users.service';
import { CommonModule } from '@angular/common';
import { debounceTime, first, map, switchMap } from 'rxjs';
import { RouterLink} from '@angular/router';
import { LoggerServiceService } from '../../Services/logger-service.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,RouterLink],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
@ViewChild('myModal') model : ElementRef | undefined;
@ViewChild('passwordModal') passwordModal : ElementRef | undefined;


UsernameExistsValidator(): AsyncValidatorFn {
  return (control: AbstractControl) => {
    return control.valueChanges.pipe(
      debounceTime(300),
      switchMap(username => this.userService.checkUsernameExists(username)),
      map(exists => (exists ? { usernameTaken: true } : null)),
      first()
    );
  };
}


userList: Users[] = [];
userService = inject(UsersService);

userForm : FormGroup = new FormGroup({});
pswdForm: FormGroup = new FormGroup({});
private readonly JWT_TOKEN = 'JWT_TOKEN';
constructor(private fb: FormBuilder,private logger:LoggerServiceService,private errorHandler:ErrorHandler){}
formValue: any;

ngOnInit(): void {
  this.setFormState();
  this.setPswdFormState();
  this.getUser();
}

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
  this.userService.getAllUsers().subscribe((res) => {
    this.userList = res;
  })
}

// getUserInformationFromToken(): {userId:number,role:string} | null {
//   const token = sessionStorage.getItem(this.JWT_TOKEN);
//   //const token = localStorage.getItem('token');  // or wherever you store it

//   if (!token) return null;

//   try {
//     // JWT format: header.payload.signature
//     const payloadBase64 = token.split('.')[1];
//     const payloadJson = atob(payloadBase64);
//     const payload = JSON.parse(payloadJson);

//     // Extract the userId from the specific claim
//     const userIdString = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
//     const roleString = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    
//     if (!userIdString || !roleString) return null;

//     return{
//       userId:parseInt(userIdString,10),
//       role:roleString
//     }

//   } catch (error) {
//     console.error('Error parsing JWT token:', error);
//     return null;
//   }
// }

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
      gender: ['',Validators.required]
    });
  }

  
  onSubmit(){
    console.log(this.userForm.value);
    if(this.userForm.invalid)
    {
      alert('Please Fill All Fields....');
      return;
    }
    this.formValue = this.userForm.value;

    if(this.userForm.value.id == 0)
    {
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
          console.error("User added faild:", error);
          this.logger.error("User added faild:", error)
          if (error.status === 400 && error.error?.error === "Email already exists.") {
            const emailCtrl = this.emailControl;
            if(emailCtrl){
            emailCtrl.setErrors({ emailExists: true });
            }
          }
        }
      });
    }
    else{
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
          alert('Failed to update user. Please try again later.');
        }
      });
    }
  }

  onEdit(user:Users)
  { debugger
    this.openModal();
    this.userForm.patchValue(
      //User
      {
        ...user,
        roleid: Number(user.roleId)
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
          console.error("Failed to delete user", err);
          this.logger.error("Failed to delete user", err);
          this.errorHandler.handleError(err);
          alert("Failed to delete user. Please try again later.");
        }
      });
    }
  }

  openPassswordModel(user:Users)
  {
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
    return (group: AbstractControl): {[key: string]: any} | null => {
      const newPassword = group.get('newpswd')?.value;
      const confirmPassword = group.get('confrmNewpswd')?.value;
      return newPassword === confirmPassword ? null : { passwordMismatch: true };
    };
  }

  setPswdFormState()
  {
    this.pswdForm = this.fb.group({
      id: 0,
      curpswd: ['',[Validators.required]],
      newpswd: ['',[Validators.required]],
      confrmNewpswd: ['',[Validators.required]]

    },{Validators:this.passwordsMatchValidator()} );
  }


  updatePassword(){
    if(this.pswdForm.invalid){
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
