import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Users } from '../Models/users';
import { Tasks } from '../Models/tasks';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TasksService {

  private assignUserApiUrl = 'https://localhost:7192/api/Users/viewusers';

  private addTaskAPIURL = 'https://localhost:7192/api/Tasks/AddTask';

  private getTasKAPIURL = 'https://localhost:7192/api/Tasks/ViewAllTasks';

  private uploadTaskAPIUrl = 'https://localhost:7192/api/Tasks/upload';

  private deleteTaskAPIURL = 'https://localhost:7192/api/Tasks/deleteTask';

  private updateTaskAPIURL = 'https://localhost:7192/api/Tasks/UpdateTask';

  private userTaskAPIURL = 'https://localhost:7192/api/Tasks/task';

  constructor() { }

  http = inject(HttpClient)

  getAllUsers()
  {
    return this.http.get<Users[]>(this.assignUserApiUrl);
  }

  getAllTasks()
  {
    return this.http.get<Tasks[]>(this.getTasKAPIURL);
  }

  addTask(data: any)
  {
    return this.http.post(this.addTaskAPIURL, data);
  }

  deleteTask(id: number)
  {
    return this.http.delete(`${this.deleteTaskAPIURL}/${id}`);
  }

  updateTask(task: Tasks)
  {
    return this.http.put(`${this.updateTaskAPIURL }/${task.taskId}`, task);
  }
  

  uploadTask(fileData: FormData): Observable<string> {
    debugger
    return this.http.post(this.uploadTaskAPIUrl, fileData, {
      responseType: 'text' as const  
    });
  }

  getUserTask(id: number)
  {
    return this.http.get<Tasks[]>(`${this.userTaskAPIURL}/${id}`);
  }

}
