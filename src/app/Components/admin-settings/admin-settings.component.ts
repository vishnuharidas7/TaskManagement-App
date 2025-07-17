import { Component, OnInit,HostListener,ErrorHandler,ElementRef, ViewChild } from '@angular/core';
import { timer,Subscription } from 'rxjs';
import { NotificationTask } from '../../Models/notificationTask';
import { TasksService } from '../../Services/tasks.service';
import { RouterLink} from '@angular/router';
import { UserAuthService } from '../../Services/user-auth.service';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormsModule,ReactiveFormsModule, FormBuilder, FormGroup, ValidationErrors, Validators,AsyncValidatorFn,ValidatorFn } from '@angular/forms';
import { debounceTime, first, map, switchMap,of } from 'rxjs';
import { Users } from '../../Models/users';
import { UsersService } from '../../Services/users.service';
import { LoggerServiceService } from '../../Services/logger-service.service';

@Component({
  selector: 'app-admin-settings',
  imports: [RouterLink,CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css'
})
export class AdminSettingsComponent implements OnInit {
  @ViewChild('passwordModal') passwordModal : ElementRef | undefined;
  private notificationSubscription?: Subscription;
  notificationDropdownVisible=false;
  notifications:NotificationTask[]=[];
  adminFormSettings : FormGroup = new FormGroup({});
  formValue: any;
  private readonly JWT_TOKEN = 'JWT_TOKEN';
  userByid:Users|null=null;
  orginalUserName:string='';
  pswdForm:FormGroup=new FormGroup({});


  
  constructor(private authService: UserAuthService, private fb:FormBuilder,private logger:LoggerServiceService,
    private errorHandler:ErrorHandler,private userService:UsersService,private TaskService:TasksService) {}

  ngOnInit() {
    this.notificationSubscription=timer(5000).subscribe(()=>{this.loadNotification();this.notificationSubscription?.unsubscribe()})
    this.setFormStateSettings();
    this.getUserByid();
    this.setPswdFormState();

  }

  ngOnDestroy():void{
    this.notificationSubscription?.unsubscribe();
  }

  toggleNotificationDropdown(){
    this.notificationDropdownVisible=!this.notificationDropdownVisible;
  }

  @HostListener('document:click',['$event'])
  onDocumentClick(event:MouseEvent){
    const targets=event.target as HTMLElement;
    const bell=document.querySelector('.notification-bell');
    const dropdown=document.querySelector('.notification-dropdown');
    if(bell?.contains(targets)||dropdown?.contains(targets)){
      return;
    }
    this.notificationDropdownVisible=false;
  }

  loadNotification(){
    this.TaskService.getTaskNotificationAdmin().subscribe({
      next: (data) => {
        this.notifications = data;
      },
      error: (err) => console.error('Failed to load notifications:', err)
    });
  }
  logout(){
    this.authService.logout();
  }

//Common


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
get userNameControl()
 {
  return this.adminFormSettings.get('userName');
 } 

 get emailControl() {
  return this.adminFormSettings.get('email');  // Access the email control
 }

  get phoneNumberControl(){
    return this.adminFormSettings.get('phoneNumber');
  }

  setFormStateSettings()
  { 
    this.adminFormSettings = this.fb.group({
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

updateUser(){ 
  console.log(this.adminFormSettings.value);
  if(this.adminFormSettings.invalid)
  {
    alert('Please Fill All Fields....');
    return;
  }
  this.formValue = this.adminFormSettings.value;
    this.userService.updateUser(this.formValue).subscribe({
      next: (res) => {
        alert('User Updated Successfully....');
        this.logger.info('User updated successfully');
        this.getUserByid();
        this.adminFormSettings.reset();
        window.location.reload();
      },
      error: (err) => {
        console.error('Failed to update user', err);
        this.logger.error('Failed to update user', err);
        this.errorHandler.handleError(err);
        alert('Failed to update user. Please try again later.');
      }
    });
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

    this.adminFormSettings.patchValue({
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

setPswdFormState()
{
  this.pswdForm = this.fb.group({
    id: this.getUserInfoFromToken()?.userId,
    curpswd: ['',[Validators.required]],
    newpswd: ['',[Validators.required]],
    confrmNewpswd: ['',[Validators.required]]

  },{Validators:this.passwordsMatchValidator()} );
}
passwordsMatchValidator(): ValidatorFn {
  return (group: AbstractControl): {[key: string]: any} | null => {
    const newPassword = group.get('newpswd')?.value;
    const confirmPassword = group.get('confrmNewpswd')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  };
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

openPassswordModel(){
  //this.pswdForm.patchValue({id:user.id})
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
 


}
