import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { Tasks } from '../../Models/tasks';
import { CommonModule } from '@angular/common';
import { UserAuthService } from '../../Services/user-auth.service';
import { AbstractControl, FormsModule,ReactiveFormsModule, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { TasksService } from '../../Services/tasks.service';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-user-dashboard',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent {
@ViewChild('myModal') model : ElementRef | undefined;
private readonly JWT_TOKEN = 'JWT_TOKEN';

  tasks: Tasks[] = [];
  assignedTasksCount: number = 0;
  inProgressTasksCount: number = 0;
  completedTasksCount: number = 0;

  taskService = inject(TasksService);

  taskForm : FormGroup = new FormGroup({});

  constructor(private authService: UserAuthService, private fb:FormBuilder) {}

  ngOnInit(): void {
    //this.loadUserTasks();
    this.setFormState();
    this.getTasks();
  }

  openModal(){
    const createTask = document.getElementById('myModal');
    if(createTask != null)
    {
      createTask.style.display= 'block';
    }
  }

  closeModal()
  {
    this.setFormState();
    if(this.model != null)
    {
      this.model.nativeElement.style.display = 'none';
    }
  }

  toDateInputFormat(date: any): string {
    return new Date(date).toISOString().split('T')[0];
  }

  get dueDateControl()
  {
    return this.taskForm.get('dueDate');
  }

  setFormState()
  {
    this.taskForm = this.fb.group({
      taskId: 0,
      taskName: ['',[Validators.required]],
      userId: [this.getUserIdFromToken()  ,Validators.required],
      dueDate: ['',[Validators.required, this.noPastDateValidator]],
      taskDescription:['',Validators.required] ,
      priority:['',Validators.required],
      userName: ['Ram'],
      taskStatus: ['', Validators.required]
    }); 
  }

  // loadUserTasks(): void {
  //   // Ideally, replace this with a call to a backend service
  //   this.tasks = [
  //     {
  //       taskName: 'Fix UI bug on task page',
  //       taskStatus: 'Assigned',
  //       dueDate: new Date('2025-06-01'),
  //       userName: 'SAam'
  //       ,userId: 1,
  //       taskDescription:'',
  //       taskId:1,
  //       priority: 'High'
  //     },
  //     {
  //       taskName: 'Write user guide documentation',
  //       taskStatus: 'In Progress',
  //       dueDate: new Date('2025-06-03'),
  //       userName: 'SAM'
  //       ,userId: 1,
  //       taskDescription: '',
  //       taskId:1,
  //       priority: 'Medium'
  //     },
  //     {
  //       taskName: 'Code review for sprint 5',
  //       taskStatus: 'Completed',
  //       dueDate: new Date('2025-05-20'),
  //       userName: 'Sam',
  //       userId: 1,
  //       taskDescription:'',
  //       taskId:1
  //      , priority: 'Low'
  //     }
  //   ];

  //   this.countTaskStatuses();
  // }

  countTaskStatuses(): void {
    this.assignedTasksCount = this.tasks.filter(t => t.taskStatus === 'New').length;
    this.inProgressTasksCount = this.tasks.filter(t => t.taskStatus === 'InProgress').length;
    this.completedTasksCount = this.tasks.filter(t => t.taskStatus === 'Completed').length;
  }


  openAddTaskModal(): void {
    // Hook into modal logic (can be implemented with Bootstrap modal, Angular Material dialog, etc.)
    alert("Open task creation modal (to be implemented)");
  }

  logout(){
    this.authService.logout();
  }

  goToSettings(): void {
    // Navigate to settings route
    //this.router.navigate(['/settings']);
  }

 

  getUserIdFromToken(): number | null {
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
      
      if (!userIdString) return null;
  
      return parseInt(userIdString, 10);
  
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  }

  noPastDateValidator(control: AbstractControl): ValidationErrors | null {
    const today = new Date();
    const inputDate = new Date(control.value);
  
    // Remove time portion for accurate comparison
    today.setHours(0, 0, 0, 0);
    inputDate.setHours(0, 0, 0, 0);
  
    return inputDate < today ? { pastDate: true } : null;
  }

  formValue: any;
  onSubmit(){
    console.log(this.taskForm.value);
    if(this.taskForm.invalid)
    {
      alert('Please Fill All Fields....');
      return;
    }
    this.formValue = this.taskForm.value;
    
    console.log(this.taskForm.value.taskid);
    console.log(this.taskForm.value.id);
    if(this.taskForm.value.taskId == 0){
     
      this.taskService.addTask(this.formValue).subscribe({
        next: () => {
          alert('Task Added Successfully....');
          //this.getUser();
          this.taskForm.reset();
          this.closeModal();
          this.getTasks();
        }});
      }
     else{
      this.taskService.updateTask(this.formValue).subscribe({
        next: () => {
          alert('Task Updated Successfully....');
          //this.getUser();
          this.taskForm.reset();
          this.closeModal();
          this.getTasks();
        }});
     } 
  }

  getTasks() {
    const userId = this.getUserIdFromToken();

    if(userId === null){
      console.error('User ID not found in token');
      return;
    }
    this.taskService.getUserTask(userId).subscribe((res) => {
      this.tasks = res;
      this.countTaskStatuses(); 
    })
  }

  onEdit(Task:Tasks)
  {
    this.openModal();
    this.taskForm.patchValue({ ...Task,
      dueDate: this.toDateInputFormat(Task.dueDate),
      userName: Task.userName
    });
      this.getTasks();
  }

  onDelete(id : number)
  {
    const isconfirm = confirm("Are you sure you want to delete this Task?");
    if(isconfirm)
    {
      this.taskService.deleteTask(id).subscribe((res) => {
        alert("Task deleted successfully....");
        this.getTasks();
      });
    }
  }

}
