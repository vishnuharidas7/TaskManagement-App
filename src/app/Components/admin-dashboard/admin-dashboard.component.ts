import { Component,ErrorHandler,ViewChild,ElementRef, OnInit,HostListener} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { UserAuthService } from '../../Services/user-auth.service';
import { UsersService } from '../../Services/users.service';
import { Users } from '../../Models/users';
import { TasksService } from '../../Services/tasks.service';
import { Tasks } from '../../Models/tasks';
import { LoggerServiceService } from '../../Services/logger-service.service';
import { interval,Subscription } from 'rxjs';
import { timer } from 'rxjs';
import { NotificationTask } from '../../Models/notificationTask';
import { AbstractControl, FormsModule,ReactiveFormsModule, FormBuilder, FormGroup, ValidationErrors, Validators,AsyncValidatorFn } from '@angular/forms';
import { debounceTime, first, map, switchMap } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterOutlet, RouterLink,FormsModule,ReactiveFormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  @ViewChild('settingsModel') settingModel : ElementRef | undefined;

  private notificationSubscription?: Subscription;
  notificationDropdownVisible=false;
  notifications:NotificationTask[]=[];
  private readonly JWT_TOKEN = 'JWT_TOKEN';
  userFormSettings : FormGroup = new FormGroup({});
  userByid:Users|null=null;
  formValue: any;

  userList:Users[]=[];
  taskLists:Tasks[]=[];
  userCount:number=0;
  taskCount:number=0;


  
  stats = [
    { title: 'Total Tasks', count: 0 },
    { title: 'Completed Tasks', count: 80 },
    { title: 'Pending Tasks', count: 40 },
    { title: 'Total Users', count:0}
  ];

  taskList = [
    { title: 'Design Homepage', status: 'In Progress', assignedTo: 'John', dueDate: new Date() },
    { title: 'Database Backup', status: 'Completed', assignedTo: 'Alice', dueDate: new Date() },
    { title: 'Bug Fixes', status: 'Pending', assignedTo: 'Mike', dueDate: new Date() }
  ];

  
  
  constructor(private authService: UserAuthService,private userService:UsersService,private fb:FormBuilder,private taskService:TasksService,
    private logger:LoggerServiceService,private errorHandler:ErrorHandler) {  }

  ngOnInit() {
   
    this.getUser();
    this.getTask();
    this.setFormStateSettings();

    this.notificationSubscription=timer(5000).subscribe(()=>{this.loadNotification();this.notificationSubscription?.unsubscribe()})
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

  getUser() {
    this.userService.getAllUsers().subscribe({
      next: (res) => {
        this.userList = res;
        this.userCount = res.length;
        const totalUsersStat = this.stats.find(stat => stat.title === 'Total Users');
        if (totalUsersStat) {
          totalUsersStat.count = this.userCount;
        }
      },
      error: (err) => {
        this.logger.error("Failed to load user list", err); 
        this.errorHandler.handleError(err); 
        alert("Failed to load users.");
      }
    });
  }


//  getTask(){
//   this.taskService.getAllTasks().subscribe((res)=>{
//     this.taskLists=res;
//     this.taskCount=res.length;
//     const totalTaskStat=this.stats.find(stat=>stat.title=='Total Tasks');
//     if(totalTaskStat)
//     {
//       totalTaskStat.count=this.taskCount;
//     }
//   });
//  }
 
getTask(){
  this.taskService.getAllTasks().subscribe({next:(res)=>{this.taskLists=res;this.taskCount=res.length;
  const totalTaskStat=this.stats.find(stat=>stat.title==='Total Tasks');
  if(totalTaskStat)
  {
   totalTaskStat.count=this.taskCount;
  }
  },
  error:(err)=>{
    this.logger.error("Failed to load task list",err);
    this.errorHandler.handleError(err);
    alert("Faild to load tasks.")
  }       
})
}

  logout(){
    this.authService.logout();
  }

  getUserInformationFromToken(): {userId:number,role:string} | null {
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
      const roleString = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      
      if (!userIdString || !roleString) return null;
  
      return{
        userId:parseInt(userIdString,10),
        role:roleString
      }
  
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  }

  loadNotification(){
    this.taskService.getTaskNotificationAdmin().subscribe({
      next: (data) => {
        this.notifications = data;
      },
      error: (err) => console.error('Failed to load notifications:', err)
    });

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
      password: ['',[Validators.required]],
      roleid: this.getUserInfoFromToken()?.roleId,
      phoneNumber: ['',[Validators.required, Validators.maxLength(10), Validators.minLength(10),Validators.pattern(/^[0-9]{10}$/)]],
      gender: ['',Validators.required]
    });


  }

  goToSettingsOpenModal() {
    //debugger
    const userInfo = this.getUserInfoFromToken();
    if(!userInfo || userInfo==undefined)
    {
      console.error('User ID not found in token');
      return;
    }
  
    this.userService.getUserbyId(userInfo.userId).subscribe({
      next: (data) => {
        debugger
        this.userByid=data;
        this.userFormSettings.patchValue({
          name: this.userByid.name,
          userName: this.userByid.userName,
          email: this.userByid.email,
          password: this.userByid.password, // don't show real password
          phoneNumber: this.userByid.phoneNumber,
          gender: this.userByid.gender,
          role:this.userByid.roleId
        });
  
        const updateUser = document.getElementById('settingsModel');
        if (updateUser != null) {
          updateUser.style.display = 'block';
        }
      },
      error: (err) => {
        console.error('Error fetching user', err);
        alert('Failed to load user settings.');
      }
    });
  }


   closeGotoSettingModal(){
    this.setFormStateSettings();
     if(this.settingModel!=null)
     {
       this.settingModel.nativeElement.style.display='none';
     }
     this.userFormSettings.reset();
   }

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

  updateUser(){
    debugger
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
          this.closeGotoSettingModal();
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

  getUserByid()
  {
    const userInfo = this.getUserInfoFromToken();
    if (!userInfo || userInfo== undefined) {
      console.warn('User ID not found in token');
      return;
    }
    this.userService.getUserbyId(userInfo.userId).subscribe((res) => {
    this.userByid = res;
  })
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

 

}