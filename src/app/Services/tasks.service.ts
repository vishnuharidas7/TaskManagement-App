import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Users } from '../Models/users';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TasksService {

  private assignUserApiUrl = 'https://localhost:7192/api/Users/viewusers';

  private addTaskAPIURL = 'https://localhost:7192/api/Tasks/AddTask';

  private uploadTaskAPIUrl = 'https://localhost:7192/api/Tasks/upload';

  constructor() { }

  http = inject(HttpClient)

  getAllUsers()
  {
    return this.http.get<Users[]>(this.assignUserApiUrl);
  }

  addTask(data: any)
  {
    return this.http.post(this.addTaskAPIURL, data);
  }

  

  uploadTask(fileData: FormData): Observable<string> {
    return this.http.post(this.uploadTaskAPIUrl, fileData, {
      responseType: 'text' as const  
    });
  }

}
