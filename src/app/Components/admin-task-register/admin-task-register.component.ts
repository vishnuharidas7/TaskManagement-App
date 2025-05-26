import { CommonModule } from '@angular/common';
import { Component, ElementRef, NgModule, ViewChild, inject, viewChild } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TasksService } from '../../Services/tasks.service';
import { FormGroup, FormsModule,FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

interface User {
  id: number;
  name: string;
}




@Component({
  selector: 'app-admin-task-register',
  imports: [CommonModule,ReactiveFormsModule, RouterOutlet, RouterLink, FormsModule],
  templateUrl: './admin-task-register.component.html',
  styleUrl: './admin-task-register.component.css'
})
export class AdminTaskRegisterComponent {
  @ViewChild('myModal') model : ElementRef | undefined;
  @ViewChild('myModal1') model1 : ElementRef | undefined;
  
  users: User[] = [];
  selectedUserId: number | null = null;
  taskService = inject(TasksService);

  taskForm : FormGroup = new FormGroup({});
  fileUploadForm: FormGroup = new FormGroup({});
  //fileUploadForm: FormGroup;
  selectedFile: File | null = null;
  fileUploadError: string = '';
  

  //hardcoded values
  stats = [
    { title: 'Total Tasks', count: 120 },
    { title: 'Completed Tasks', count: 80 },
    { title: 'Pending Tasks', count: 40 },
    { title: 'Total Users', count: 25 }
  ];

  taskList = [
    { title: 'Design Homepage', status: 'In Progress', assignedTo: 'John', dueDate: new Date() },
    { title: 'Database Backup', status: 'Completed', assignedTo: 'Alice', dueDate: new Date() },
    { title: 'Bug Fixes', status: 'Pending', assignedTo: 'Mike', dueDate: new Date() }
  ];
  //ends here

  constructor(private fb:FormBuilder) {}

  
  

  ngOnInit(): void {
    this.setFormState();
    this.getUsers();
  }

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
    if(this.model != null)
    {
      this.model.nativeElement.style.display = 'none';
    }

    if(this.model1 != null)
    {
      this.model1.nativeElement.style.display = 'none';
    }
  }



  getUsers(): void {
    this.taskService.getAllUsers().subscribe((res) => {
      this.users = res;
    })
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
    this.taskForm = this.fb.group({
      id: 0,
      taskName: ['',[Validators.required]],
      userId: ['',Validators.required],
      dueDate: ['',[Validators.required, this.noPastDateValidator]],
      description:['',Validators.required]      
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
    

    
      this.taskService.addTask(this.formValue).subscribe({
        next: () => {
          alert('Task Added Successfully....');
          //this.getUser();
          this.taskForm.reset();
          this.closeModal();
        }});
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
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.taskService.uploadTask(formData).subscribe({
      next: (response: string) => {
        if (response.trim().toLowerCase() === 'file processed and tasks saved.') {
          alert('✅ File uploaded and data saved successfully!');
          this.fileUploadError = '';
          this.closeModal();
        } else {
          alert('❌ Upload failed: ' + response);
          this.fileUploadError = response;
          this.closeModal();
        }
      },
      error: (err) => {
        alert('❌ File upload failed. Please try again.');
        this.fileUploadError = 'File upload failed. Please try again.';
      }
    });
  } else {
    alert('⚠️ Please select a file before uploading.');
    this.fileUploadError = 'Please select a file before uploading.';
  }
}


}
