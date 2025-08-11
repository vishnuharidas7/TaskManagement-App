import { Component,OnInit,ErrorHandler,ViewChild,ElementRef } from '@angular/core';
import { UserAuthService } from '../../Services/user-auth.service';
import { RouterLink} from '@angular/router';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormsModule,ReactiveFormsModule, FormBuilder, FormGroup, ValidationErrors, Validators,AsyncValidatorFn,ValidatorFn } from '@angular/forms';
import { UsersService } from '../../Services/users.service';
import { debounceTime, first, map, switchMap,of } from 'rxjs';
import { Users } from '../../Models/users';
import { LoggerServiceService } from '../../Services/logger-service.service';

@Component({
  selector: 'app-user-settings',
  imports: [RouterLink,CommonModule,ReactiveFormsModule],
  templateUrl: './user-settings.component.html',
  styleUrl: './user-settings.component.css'
})
export class UserSettingsComponent implements OnInit {
  @ViewChild('passwordModal') passwordModal : ElementRef | undefined;

  userFormSettings : FormGroup = new FormGroup({});
  public readonly JWT_TOKEN = 'JWT_TOKEN';
  orginalUserName:string='';
  userByid:Users|null=null;
  formValue: any;
  pswdForm:FormGroup=new FormGroup({});
  pswdSubmitted: boolean = false;

  constructor(private authService: UserAuthService, private fb:FormBuilder,private userService:UsersService,
    private errorHandler:ErrorHandler,private logger:LoggerServiceService) {}

  ngOnInit() {
    this.setFormStateSettings();  
    this.getUserByid();
    this.setPswdFormState();
  }

  logout(){
    this.authService.logout();
  }

  get userNameControl()
 {
  return this.userFormSettings.get('userName');
 } 

 get emailControl() {
  return this.userFormSettings.get('email');  // Access the email control
 }

  get phoneNumberControl(){
    return this.userFormSettings.get('phoneNumber');
  }

  getUserInfoFromToken(): {userId:number;roleId:number}|null {
    const token = sessionStorage.getItem(this.JWT_TOKEN);
    //const token = localStorage.getItem('token');  // or wherever you store it
  
    if (!token) return null;
  
    try {
      // JWT format: header.payload.signature
      const payloadBase64 = token.split('.')[1];
      const payloadJson = atob(payloadBase64);
      const payload = JSON.parse(payloadJson);
  
      // Extract the userId from the specific claim
      const userIdString = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
      const roleName= payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      
      if (!userIdString||!roleName) return null;
      const userId=parseInt(userIdString,10)
      const roleId=this.mapRoleNameToId(roleName)
  
      return{userId,roleId};
  
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  }

  private mapRoleNameToId(roleName:string):number{
    switch(roleName.toLowerCase()){
      case 'admin':return 1;
      case 'user':return 2;
      default:return 0;
    }
  
  }


  setFormStateSettings()
  { 
    this.userFormSettings = this.fb.group({
      id: this.getUserInfoFromToken()?.userId,
      name: ['',[Validators.required]],
      userName: ['',[Validators.required,], [this.UsernameExistsValidator()]],
      email: ['',[Validators.required, Validators.email,
        // Validators.pattern('^[a-zA-Z0-9._%+-]+@example\\.com$')
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$') 
        ]],
      //password: ['',[Validators.required]],
      roleid: this.getUserInfoFromToken()?.roleId,
      phoneNumber: ['',[Validators.required, Validators.maxLength(10), Validators.minLength(10),Validators.pattern(/^[0-9]{10}$/)]],
      gender: ['',Validators.required]
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

  getUserByid() {
    const userInfo = this.getUserInfoFromToken();
    if (!userInfo || userInfo === undefined) {
      console.warn('User ID not found in token');
      return;
    }
  
    this.userService.getUserbyId(userInfo.userId).subscribe((res) => {
      console.log('Fetched user:', res);
      this.userByid = res;
      this.orginalUserName = res.userName;  // useful for async validator
  
      this.userFormSettings.patchValue({
        //id: res.id,
        name: res.name,
        userName: res.userName,
        email: res.email,
        roleid: this.getUserInfoFromToken()?.roleId,
        phoneNumber: res.phoneNumber,
        gender: res.gender
      });
    });
  }

  reloadPage() {
    window.location.reload();
  }
  

  updateUser(){ 
    console.log(this.userFormSettings.value);
    if(this.userFormSettings.invalid)
    {
      alert('Please Fill All Fields....');
      return;
    }
    this.formValue = this.userFormSettings.value;
      this.userService.updateUser(this.formValue).subscribe({
        next: (res) => {
          alert('User Updated Successfully....');
          this.logger.info('User updated successfully');
          this.getUserByid();
          this.userFormSettings.reset();
          this.reloadPage();
        },
        error: (err) => {
          console.error('Failed to update user', err);
          this.logger.error('Failed to update user', err);
          this.errorHandler.handleError(err);
          alert('Failed to update user. Please try again later.');
        }
      });
  }

  setPswdFormState()
{
  this.pswdForm = this.fb.group({
    id: this.getUserInfoFromToken()?.userId,
    curpswd: ['',[Validators.required]],
    newpswd: ['',[Validators.required]],
    confrmNewpswd: ['',[Validators.required]]

  },{Validators:this.passwordsMatchValidator()} );
}


// passwordsMatchValidator(): ValidatorFn {
//   return (group: AbstractControl): {[key: string]: any} | null => {
//     const newPassword = group.get('newpswd')?.value;
//     const confirmPassword = group.get('confrmNewpswd')?.value;
//     return newPassword === confirmPassword ? null : { passwordMismatch: true };
//   };
// }
passwordsMatchValidator(): ValidatorFn {
  return (group: AbstractControl): { [key: string]: any } | null => {
    const newPasswordControl = group.get('newpswd');
    const confirmPasswordControl = group.get('confrmNewpswd');

    if (!newPasswordControl || !confirmPasswordControl) {
      // If either control is missing, skip validation (return null)
      return null;
    }

    const newPassword = newPasswordControl.value;
    const confirmPassword = confirmPasswordControl.value;

    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  };
}


  openPassswordModel(){
    //this.pswdForm.patchValue({id:user.id})
    this.pswdSubmitted = false;
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
        this.pswdSubmitted = true;
        this.closePswdModel();
        this.reloadPage();
      },
      error:(err)=>{
        this.pswdSubmitted = true;
        console.error('Failed to update user', err);
        this.logger.error('Failed to update user', err);
        this.errorHandler.handleError(err);
        alert('Failed to update user. Please try again later.');
      }
    });
  }


}
