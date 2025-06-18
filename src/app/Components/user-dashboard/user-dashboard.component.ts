import { Component, ElementRef, ViewChild, inject,ErrorHandler,HostListener} from '@angular/core';
import { Tasks } from '../../Models/tasks';
import { CommonModule } from '@angular/common';
import { UserAuthService } from '../../Services/user-auth.service';
import { AbstractControl, FormsModule,ReactiveFormsModule, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { TasksService } from '../../Services/tasks.service';
import { jwtDecode } from 'jwt-decode';
import { LoggerServiceService } from '../../Services/logger-service.service';
import { NotificationTask } from '../../Models/notificationTask';
import { interval,Subscription } from 'rxjs';
import { timer } from 'rxjs';
@Component({
  selector: 'app-user-dashboard',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent {
@ViewChild('myModal') model : ElementRef | undefined;
private readonly JWT_TOKEN = 'JWT_TOKEN';
private notificationSubscription?: Subscription;
notificationDropdownVisible=false;

  tasks: Tasks[] = [];
  assignedTasksCount: number = 0;
  inProgressTasksCount: number = 0;
  completedTasksCount: number = 0;
  notifications:NotificationTask[]=[];

  taskService = inject(TasksService);

  taskForm : FormGroup = new FormGroup({});

  constructor(private authService: UserAuthService, private fb:FormBuilder,private logger:LoggerServiceService,private errorHandler:ErrorHandler) {}

  ngOnInit(): void {
    //this.loadUserTasks();
    this.setFormState();
    this.getTasks();

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
        },  error: (err) => {
         
          this.logger.error('Task Added Faild', err); 
          this.errorHandler.handleError(err);               
          alert(`Faild task added. Please try again.`);
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
        },error: (err) => {
         
          this.logger.error('Task Updation Faild', err); 
          this.errorHandler.handleError(err);               
          alert(`Faild task added. Please try again.`);
        }});
     } 
  }

  getTasks() {
    const userId = this.getUserIdFromToken();

    if(userId === null){
      console.error('User ID not found in token');
      return;
    }
    this.taskService.getUserTask(userId).subscribe({
      next: (res) => {
        this.tasks = res;
        this.countTaskStatuses();
      },
      error: (err) => {
        const message = 'Failed to load user tasks';
        console.error(message, err);
  
        this.logger.error(message, err);     
        this.errorHandler.handleError(err);   
        alert("Could not fetch tasks. Please try again later.");
      }
    });
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
    if (!isconfirm) return;

  this.taskService.deleteTask(id).subscribe({
    next: () => {
      alert("Task deleted successfully.");
      this.logger.info(`Task with ID ${id} deleted successfully`);
      this.getTasks();
    },
    error: (err) => {
      const message = `Failed to delete task with ID ${id}`;
      console.error(message, err);

      this.logger.error(message, err);
      this.errorHandler.handleError(err);

      alert("Failed to delete the task. Please try again later.");
    }
  });
  }

  loadNotification(){
    const userId = this.getUserIdFromToken();
    if(userId===null)
    {
      console.error('User ID not found in token');
      return;
    }
    this.taskService.getTaskNotification(userId).subscribe({
      next: (data) => {
        this.notifications = data;
      },
      error: (err) => console.error('Failed to load notifications:', err)
    });

  }

}
