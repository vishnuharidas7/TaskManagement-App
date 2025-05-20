import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Users } from '../../Models/users';
import { UsersService } from '../../Services/users.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
@ViewChild('myModal') model : ElementRef | undefined;

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

 get emailControl() {
  return this.userForm.get('email');  // Access the email control
}

  setFormState()
  {
    this.userForm = this.fb.group({
      id: 0,
      userName: ['',[Validators.required]],
      email: ['',[Validators.required, Validators.email,
        // Validators.pattern('^[a-zA-Z0-9._%+-]+@example\\.com$')
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$') 
        ]],
      password: ['',[Validators.required]],
      roleid: ['',[Validators.required]]
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
    // this.userService.addUser(this.formValue).subscribe((res) => {
    //   alert('User Added Successfully....');
    //   this.getUser();
    //   this.userForm.reset();
    //   this.closeModal();
    // })

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

  onEdit(Users:Users)
  {
    this.openModal();
    this.userForm.patchValue(Users);
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
