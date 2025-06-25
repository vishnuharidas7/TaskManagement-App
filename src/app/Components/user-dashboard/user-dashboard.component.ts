import { Component, ElementRef, ViewChild, inject,ErrorHandler,HostListener} from '@angular/core';
import { Tasks } from '../../Models/tasks';
import { CommonModule } from '@angular/common';
import { UserAuthService } from '../../Services/user-auth.service';
import { AbstractControl, FormsModule,ReactiveFormsModule, FormBuilder, FormGroup, ValidationErrors, Validators,AsyncValidatorFn } from '@angular/forms';
import { TasksService } from '../../Services/tasks.service';
import { jwtDecode } from 'jwt-decode';
import { LoggerServiceService } from '../../Services/logger-service.service';
import { NotificationTask } from '../../Models/notificationTask';
import { interval,Subscription } from 'rxjs';
import { timer } from 'rxjs';
import { UsersService } from '../../Services/users.service';
import { Users } from '../../Models/users';
import { debounceTime, first, map, switchMap } from 'rxjs';

@Component({
  selector: 'app-user-dashboard',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.css'
})
export class UserDashboardComponent {
@ViewChild('myModal') model : ElementRef | undefined;
@ViewChild('settingsModel') settingModel : ElementRef | undefined;

private readonly JWT_TOKEN = 'JWT_TOKEN';
private notificationSubscription?: Subscription;
notificationDropdownVisible=false;


//Task Filter
  tasks: Tasks[] = [];
  assignedTasksCount: number = 0;
  inProgressTasksCount: number = 0;
  completedTasksCount: number = 0;
  notifications:NotificationTask[]=[];
  userList: Users[] = [];
  userByid:Users|null=null;

  taskService = inject(TasksService);

  taskForm : FormGroup = new FormGroup({});
  userFormSettings : FormGroup = new FormGroup({});

  filters = {
    date: '',
    status: '',
    priority: ''
  };
  
  statuses: string[] = ['New', 'OnDue', 'Completed']; // customize as needed
  priorities: string[] = ['Low', 'Medium', 'High']; // customize as needed
  
  allTasks: Tasks[] = []; // original data
  filteredTasks: Tasks[] = [];
  paginatedTasks: Tasks[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  
  applyFilters(): void {
    const { date, status, priority } = this.filters;
  
    this.filteredTasks = this.allTasks.filter(task => {
      //const matchesName = name ? task.userName.toLowerCase().includes(name.toLowerCase()) : true;
      const matchesDate = date ? new Date(task.dueDate).toDateString() === new Date(date).toDateString() : true;
      const matchesStatus = status ? task.taskStatus === status : true;
      const matchesPriority = priority ? task.priority === priority : true;
  
      return matchesDate && matchesStatus && matchesPriority;
    });
  
    this.totalPages = Math.ceil(this.filteredTasks.length / this.pageSize);
    this.currentPage = 1; // reset to first page
    this.updatePaginatedTasks();
  }
  
  updatePaginatedTasks(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedTasks = this.filteredTasks.slice(start, end);
  }
  
  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePaginatedTasks();
  }

  //Ends here

  constructor(private authService: UserAuthService, private fb:FormBuilder,private logger:LoggerServiceService,private errorHandler:ErrorHandler,private userService:UsersService) {}

  ngOnInit(): void {
    //this.loadUserTasks();
    this.setFormState();
    this.getTasks();
    this.countTaskStatuses(); 
    this.setFormStateSettings();

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
    const userId = this.getUserInfoFromToken()?.userId; 

    this.taskForm = this.fb.group({
      taskId: 0,
      taskName: ['',[Validators.required]],
      userId: [this.getUserInfoFromToken()?.userId  ,Validators.required],
      dueDate: ['',[Validators.required, this.noPastDateValidator]],
      taskDescription:['',Validators.required] ,
      priority:['',Validators.required],
      userName: [''],
      taskStatus: ['', Validators.required],
      createdBy: userId 
    }); 
  }


  countTaskStatuses(): void {
    this.assignedTasksCount = this.tasks.filter(t => t.taskStatus === 'New').length;
    this.inProgressTasksCount = this.tasks.filter(t => t.taskStatus === 'OnDue').length;
    this.completedTasksCount = this.tasks.filter(t => t.taskStatus === 'Completed').length;
  }


  openAddTaskModal(): void {
    // Hook into modal logic (can be implemented with Bootstrap modal, Angular Material dialog, etc.)
    alert("Open task creation modal (to be implemented)");
  }

  logout(){
    this.authService.logout();
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
    const userInfo = this.getUserInfoFromToken();
    if(!userInfo || userInfo.userId==undefined){
      console.error('User ID not found in token');
      return;
    }

    this.taskService.getUserTask(userInfo.userId).subscribe({
      // next: (res) => {
      //   this.tasks = res;
      //   this.countTaskStatuses();
        next: (res) => {
          this.tasks = res;
          this.allTasks = res; // ✅ Needed for filtering
          this.applyFilters();
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
    const userInfo = this.getUserInfoFromToken();
    if(!userInfo || userInfo==undefined)
    {
      console.error('User ID not found in token');
      return;
    }
    this.taskService.getTaskNotification(userInfo.userId).subscribe({
      next: (data) => {
        this.notifications = data;
      },
      error: (err) => console.error('Failed to load notifications:', err)
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


}
