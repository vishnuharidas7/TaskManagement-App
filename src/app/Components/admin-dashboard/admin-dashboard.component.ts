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

//Pagination 
currentPage: number = 1;
pageSize: number = 5;
get paginatedTasks() {
  const start = (this.currentPage - 1) * this.pageSize;
  return this.taskLists.slice(start, start + this.pageSize);
}

get totalPages(): number {
  return Math.ceil(this.taskLists.length / this.pageSize);
}


//Ends here

  
  stats = [
    { title: 'Total Tasks', count: 0 },
    { title: 'Completed Tasks', count: 0 },
    { title: 'Pending Tasks', count: 0 },
    //{ title: 'Total Users', count:0}
    {title: 'New Tasks', count:0}
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