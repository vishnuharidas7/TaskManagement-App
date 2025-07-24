import { CommonModule } from '@angular/common';
import { Component, ElementRef, NgModule, ViewChild, inject, viewChild,ErrorHandler } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TasksService } from '../../Services/tasks.service';
import { FormGroup, FormsModule,FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Tasks } from '../../Models/tasks';
import { LoggerServiceService } from '../../Services/logger-service.service';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
interface User {
  id: number;
  name: string;
}




@Component({
  selector: 'app-admin-task-register',
  imports: [CommonModule,ReactiveFormsModule, RouterOutlet, RouterLink, FormsModule,MatProgressSpinnerModule, MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule],
  templateUrl: './admin-task-register.component.html',
  styleUrl: './admin-task-register.component.css'
})
export class AdminTaskRegisterComponent {
  @ViewChild('myModal') model : ElementRef | undefined;
  @ViewChild('myModal1') model1 : ElementRef | undefined;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  users: User[] = [];
  tasks: Tasks[] = [];
  selectedUserId: number | null = null;
  taskService = inject(TasksService);

  taskForm : FormGroup = new FormGroup({});
  fileUploadForm: FormGroup = new FormGroup({});
  //fileUploadForm: FormGroup;
  selectedFile: File | null = null;
  fileUploadError: string = '';
  private readonly JWT_TOKEN = 'JWT_TOKEN';
  isUploading: boolean = false; // Spinner flag
  showFileInput = true;
  

// //Pagination 
// currentPage: number = 1;
// pageSize: number = 10;
// get paginatedTasks() {
//   const start = (this.currentPage - 1) * this.pageSize;
//   return this.tasks.slice(start, start + this.pageSize);
// }

// get totalPages(): number {
//   return Math.ceil(this.tasks.length / this.pageSize);
// }
// //Ends here

filters = {
  name: '',
  type:'',
  date: '',
  status: '',
  priority: '',
  taskId :'',
  taskNames:''
};

status: string[] = ['New', 'Due', 'OverDue', 'Completed']; 
priorities: string[] = ['Low', 'Medium', 'High']; 
types : string[] = ['Feature', 'User Story', 'Bug', 'Testing'];

allTasks: Tasks[] = []; // original data
filteredTasks: Tasks[] = [];
paginatedTasks: Tasks[] = [];
currentPage: number = 1;
pageSize: number = 5;
totalPages: number = 1;
pageSizeOptions: number[] = [5, 10, 20, 50, 100];

sortColumn: string = '';
sortDirection: 'asc' | 'desc' = 'asc';

sortData(column: string): void {
  if (this.sortColumn === column) {
    // Toggle sort direction
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }

  this.applyFilters(); // Reapply filters and sorting
}


applyFilters(): void {
  const { name, type, date, status, priority ,taskId,taskNames } = this.filters;

  this.filteredTasks = this.allTasks.filter(task => {
    const matchesName = name ? task.userName.toLowerCase().includes(name.toLowerCase()) : true;
    const matchesType = type ? task.taskType === type : true;
    const matchesDate = date ? new Date(task.dueDate).toDateString() === new Date(date).toDateString() : true;
    const matchesStatus = status ? task.taskState === status : true;
    const matchesPriority = priority ? task.priority === priority : true;
    const matchesReferenceId = taskId ? task.referenceId?.toLowerCase().includes(taskId.toLowerCase()) : true;
    const matchesTaskName=taskNames? task.taskName?.toLocaleLowerCase().includes(taskNames.toLocaleLowerCase()):true;

    return matchesName && matchesType && matchesDate && matchesStatus && matchesPriority&&matchesReferenceId&&matchesTaskName;
  });

  if (this.sortColumn) {
    this.filteredTasks.sort((a: any, b: any) => {
      const valueA = a[this.sortColumn];
      const valueB = b[this.sortColumn];

      // Handle string or number comparison
      const comparison = typeof valueA === 'string'
        ? valueA.localeCompare(valueB)
        : valueA > valueB ? 1 : valueA < valueB ? -1 : 0;

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  this.totalPages = Math.ceil(this.filteredTasks.length / this.pageSize);
  this.currentPage = 1; // reset to first page
  this.updatePaginatedTasks();
}

getStartIndex(): number {
  return (this.currentPage - 1) * this.pageSize;
}

getEndIndex(): number {
  const end = this.getStartIndex() + this.paginatedTasks.length;
  return end > this.filteredTasks.length ? this.filteredTasks.length : end;
}

onPageSizeChange(event: Event): void {
  const selected = (event.target as HTMLSelectElement).value;
  this.pageSize = parseInt(selected, 10);
  this.currentPage = 1; // Reset page to 1 when size changes
  this.totalPages = Math.ceil(this.filteredTasks.length / this.pageSize);
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

  constructor(private fb:FormBuilder,private logger:LoggerServiceService,private errorHandler:ErrorHandler) {}

  
  

  ngOnInit(): void {
    this.setFormState();
    this.getUsers();
    this.getTasks();
  }

  // Addded to fetch created by userid

  getUserIdFromToken(): {userId:number} | null {
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
  
      return{
        userId:parseInt(userIdString,10)
      }
  
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  }

  // getUserIdFromToken(): number {
  //   const token = localStorage.getItem('access_token'); // Adjust based on where you store it
  //   if (!token) return 0;
  
  //   try {
  //     const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT
  //     return payload.userId || 0; // Adjust based on token structure
  //   } catch (e) {
  //     console.error('Invalid token', e);
  //     return 0;
  //   }
  // }
  //Ends here

  openModal(){
    const createTask = document.getElementById('myModal');
    if(createTask != null)
    {
      createTask.style.display= 'block';
    }
  }

  openModal1(){
    const uploadTask = document.getElementById('myModal1');
    if(uploadTask != null)
    {
      uploadTask.style.display = 'block';
    }
  }

  closeModal()
  {
    this.setFormState();
    if(this.model != null)
    {
      this.model.nativeElement.style.display = 'none';
    }

    // if(this.model1 != null)
    // {
    //   this.model1.nativeElement.style.display = 'none';
    // }
    // if(this.fileInput)
    // {
    //   this.fileInput.nativeElement.value = '';
    // }
    // this.fileUploadForm.reset();
    // this.selectedFile = null;
    // this.fileUploadError = '';

    if (this.model1 != null) {
      this.model1.nativeElement.style.display = 'none';
    }
  
    // Force re-render of file input
    this.showFileInput = false;
    setTimeout(() => {
      this.showFileInput = true;
    }, 0); // Short delay to re-insert element
  
    this.fileUploadForm.reset();
    this.selectedFile = null;
    this.fileUploadError = '';
  }



  getUsers(): void {
    this.taskService.getAllUsers().subscribe({
      next: (res) => {
        this.users = res;
      },
      error: (err) => {
        this.logger.error("Failed to fetch users", err);         
        this.errorHandler.handleError(err);                     
        alert("Unable to load users. Please try again later."); 
      }
    });
  }

  getTasks() {
    debugger
    // this.taskService.getAllTasks().subscribe({
    //   next: (res) => {
    //     this.tasks = res;
    this.taskService.getAllTasks().subscribe({
      next: (res) => {
        this.tasks = res;
        this.allTasks = res; // ✅ Needed for filtering
        this.applyFilters();
      },
      error: (err) => {
        this.logger.error("Failed to fetch tasks", err);         
        this.errorHandler.handleError(err);                     
        alert("Unable to load tasks. Please try again later.");  
      }
    });
  }
  

  onDelete(id: number) {
    const isConfirm = confirm("Are you sure you want to delete this Task?");
    if (isConfirm) {
      this.taskService.deleteTask(id).subscribe({
        next: (res) => {
          alert("Task deleted successfully.");
          this.getTasks(); 
        },
        error: (err) => {
          this.logger.error("Failed to delete task", err);        
          this.errorHandler.handleError(err);                     
          alert("Failed to delete the task. Please try again later."); 
        }
      });
    }
  }
  

  toDateInputFormat(date: any): string {
    debugger
    return date.split('T')[0];
  }
  

  onEdit(Task:Tasks)
  {
    debugger
    console.log("Task object:", Task);
    this.openModal();
    this.taskForm.patchValue({ ...Task,
      dueDate: this.toDateInputFormat(Task.dueDate)});
      this.getTasks();

  }

  get dueDateControl()
{
  return this.taskForm.get('dueDate');
}

get fileuploadControl()
{
  return this.taskForm.get('fileInput');
}

  setFormState()
  {

    const createdbyID = this.getUserIdFromToken();

    this.taskForm = this.fb.group({
      taskId: 0,
      taskName: ['',[Validators.required]],
      userId: ['',Validators.required],
      dueDate: ['',[Validators.required, this.noPastDateValidator]],
      taskDescription:['',Validators.required] ,
      taskType:['',Validators.required],
      priority:['',Validators.required],
      userName: ['Ram'],
      taskStatus:[''],
      createdBy:createdbyID?.userId 
    });

    this.fileUploadForm = this.fb.group({
      fileInput: ['',Validators.required]
    });
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
        }, error: (err) => {
          this.logger.error("Failed to add task", err);
          this.errorHandler.handleError(err);
          alert("Failed to add task. Please try again.");
        }
      });
      }
     else{
      debugger
      this.taskService.updateTask(this.formValue).subscribe({
        next: () => {
          alert('Task Updated Successfully....');
          //this.getUser();
          this.taskForm.reset();
          this.closeModal();
          this.getTasks();
        },
        error: (err) => {
          this.logger.error("Failed to update task", err);
          this.errorHandler.handleError(err);
          alert("Failed to update task. Please try again.");
        }
      });
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

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
  
    if (file) {
      this.selectedFile = file;
      this.fileUploadError = '';
    } else {
      this.selectedFile = null;
      this.fileUploadError = 'Please select a file.';
    }
  }


onFileUpload() {
  if (this.selectedFile) {
    this.isUploading = true; // Start spinner
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    const currentUserId = this.taskForm.get('createdBy')?.value;
    formData.append('userId',currentUserId);
    this.taskService.uploadTask(formData, currentUserId).subscribe({
      next: (response: string) => {
        this.isUploading = false; // Stop spinner
        if (response.trim().toLowerCase() === 'file processed and tasks saved.') {
          alert('✅ File uploaded and data saved successfully!');
          this.taskForm.reset();
          this.fileUploadError = '';
          this.closeModal();
          this.getTasks();
        } else {
          alert('❌ Upload failed: ' + response);
          this.fileUploadError = response;
          this.taskForm.reset();
          this.closeModal();
          this.getTasks();
        }
      },
      error: (err) => {
        this.isUploading = false; // Stop spinner
        this.logger.error('❌ File upload error', err);
        this.errorHandler.handleError(err);
        alert('❌ File upload failed. Please try again.');
        this.fileUploadError = 'File upload failed. Please try again.';
      }
    });
  } else {
    alert('⚠️ Please select a file before uploading.');
    this.logger.warn('File upload attempted without selecting a file');
    this.fileUploadError = 'Please select a file before uploading.';
  }
}


}
