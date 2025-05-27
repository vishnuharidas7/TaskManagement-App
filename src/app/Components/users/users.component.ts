import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Users } from '../../Models/users';
import { UsersService } from '../../Services/users.service';
import { CommonModule } from '@angular/common';
import { debounceTime, first, map, switchMap } from 'rxjs';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterOutlet, RouterLink],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
@ViewChild('myModal') model : ElementRef | undefined;


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

constructor(private fb: FormBuilder){}

ngOnInit(): void {
  this.setFormState();
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
      password: ['',[Validators.required]],
      roleid: ['',[Validators.required]],
      phoneNumber: ['',[Validators.required, Validators.maxLength(10), Validators.minLength(10),Validators.pattern(/^[0-9]{10}$/)]],
      gender: ['',Validators.required]
    });
  }

  formValue: any;
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
         this.userService.updateUser(this.formValue).subscribe((res) => {
        alert('User Updated Successfully....');
        this.getUser();
        this.userForm.reset();
        this.closeModal();
      })
    }
  }

  onEdit(user:Users)
  {
    this.openModal();
    this.userForm.patchValue(
      //User
      {
        ...user,
        roleid: Number(user.roleId)
      });
  }

  onDelete(id : number)
  {
    const isconfirm = confirm("Are you sure you want to delete this User?");
    if(isconfirm)
    {
      this.userService.deleteUser(id).subscribe((res) => {
        alert("User deleted successfully....");
        this.getUser();
      });
    }
  }

}
