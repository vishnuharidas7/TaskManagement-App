import { Component,ErrorHandler, OnInit,HostListener} from '@angular/core';
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

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {

  private notificationSubscription?: Subscription;
  notificationDropdownVisible=false;
  notifications:NotificationTask[]=[];
  private readonly JWT_TOKEN = 'JWT_TOKEN';

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

  
  
  constructor(private authService: UserAuthService,private userService:UsersService,private taskService:TasksService,
    private logger:LoggerServiceService,private errorHandler:ErrorHandler) {  }

  ngOnInit() {
   
    this.getUser();
    this.getTask();

    this.notificationSubscription=timer(10000).subscribe(()=>{this.loadNotification();this.notificationSubscription?.unsubscribe()})
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
}