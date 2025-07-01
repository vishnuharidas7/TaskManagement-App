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
import { AbstractControl, FormsModule,ReactiveFormsModule, FormBuilder, FormGroup, ValidationErrors, Validators,AsyncValidatorFn,ValidatorFn } from '@angular/forms';
import { debounceTime, first, map, switchMap,of } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterOutlet, RouterLink,FormsModule,ReactiveFormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  @ViewChild('settingsModel') settingModel : ElementRef | undefined;
  @ViewChild('passwordModal') passwordModal : ElementRef | undefined;

  private notificationSubscription?: Subscription;
  notificationDropdownVisible=false;
  notifications:NotificationTask[]=[];
  private readonly JWT_TOKEN = 'JWT_TOKEN';
  userFormSettings : FormGroup = new FormGroup({});
  pswdForm: FormGroup = new FormGroup({});
  userByid:Users|null=null;
  formValue: any;
  orginalUserName:string='';

  userList:Users[]=[];
  taskLists:Tasks[]=[];
  userCount:number=0;
  taskCount:number=0;

//Pagination 
// currentPage: number = 1;
// pageSize: number = 5;
// get paginatedTasks() {
//   const start = (this.currentPage - 1) * this.pageSize;
//   return this.taskLists.slice(start, start + this.pageSize);
// }

// get totalPages(): number {
//   return Math.ceil(this.taskLists.length / this.pageSize);
// }
pageSizeOptions: number[] = [5, 10, 20, 50, 100];
pageSize: number = 5;
currentPage: number = 1;

get paginatedTasks() {
  const start = (this.currentPage - 1) * this.pageSize;
  return this.taskLists.slice(start, start + this.pageSize);
}

get totalPages(): number {
  return Math.ceil(this.taskLists.length / this.pageSize);
}

onPageSizeChange(event: Event) {
  const selectedValue = (event.target as HTMLSelectElement).value;
  this.pageSize = parseInt(selectedValue, 10);
  this.currentPage = 1; // Reset to first page when page size changes
}


//Ends here

  
  stats = [
    { title: 'Total Tasks', count: 0 },
    { title: 'Completed Tasks', count: 0 },
    { title: 'Pending Tasks', count: 0 },
    //{ title: 'Total Users', count:0}
    {title: 'New Tasks', count:0}
  ];



  
  
  constructor(private authService: UserAuthService,private userService:UsersService,private fb:FormBuilder,private taskService:TasksService,
    private logger:LoggerServiceService,private errorHandler:ErrorHandler) {  }

  ngOnInit() {
   
    this.getUser();
    this.getTask();
    this.setFormStateSettings();
    this.setPswdFormState();

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
        // const totalUsersStat = this.stats.find(stat => stat.title === 'Total Users');
        // if (totalUsersStat) {
        //   totalUsersStat.count = this.userCount;
        // }
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

  const completedCount = res.filter(task => task.taskStatus === 'Completed').length;
  const completedTaskStat = this.stats.find(stat => stat.title === 'Completed Tasks');
  if (completedTaskStat) {
    completedTaskStat.count = completedCount;
  }

  
  const dueCount = res.filter(task => task.taskStatus === 'OnDue').length;
  const dueTaskStat = this.stats.find(stat => stat.title === 'Pending Tasks');
  if (dueTaskStat) {
    dueTaskStat.count = dueCount;
  }
  
  const newTask = res.filter(task => task.taskStatus === 'New').length;
  const newTaskStat = this.stats.find(stat => stat.title === 'New Tasks');
  if (newTaskStat) {
    newTaskStat.count = newTask;
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
       // debugger
        this.userByid=data;
        this.orginalUserName=this.userByid.userName;
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
    //debugger
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

  openPassswordModel()
  {
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
      id: this.getUserInfoFromToken()?.userId,
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