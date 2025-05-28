import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { UserAuthService } from '../../Services/user-auth.service';
import { UsersService } from '../../Services/users.service';
import { Users } from '../../Models/users';
import { TasksService } from '../../Services/tasks.service';
import { Tasks } from '../../Models/tasks';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {

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

  
  
  constructor(private authService: UserAuthService,private userService:UsersService,private taskService:TasksService) {  }

  ngOnInit() {
   
    this.getUser();
    this.getTask();
  }
  
  getUser()
 {
  this.userService.getAllUsers().subscribe((res) => {
    this.userList = res;
    this.userCount=res.length;
    const totalUsersStat=this.stats.find(stat=>stat.title==='Total Users');
    if(totalUsersStat)
    {
      totalUsersStat.count=this.userCount;
    }
  });
 }

 getTask(){
  this.taskService.getAllTasks().subscribe((res)=>{
    this.taskLists=res;
    this.taskCount=res.length;
    const totalTaskStat=this.stats.find(stat=>stat.title=='Total Tasks');
    if(totalTaskStat)
    {
      totalTaskStat.count=this.taskCount;
    }
  });
 }

  logout(){
    this.authService.logout();
  }
}