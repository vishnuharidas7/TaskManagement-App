import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideRouter } from '@angular/router';
import { provideHttpClient,withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/Interceptor/auth.interceptor';
import { loggingInterceptor } from './app/Interceptor/logging.interceptor';
import { ErrorHandler } from '@angular/core';
import { GlobalErrorHandlerService } from './app/Services/global-error-handler.service';

bootstrapApplication(AppComponent,{
  providers:[
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor,loggingInterceptor])),{provide:ErrorHandler,useClass:GlobalErrorHandlerService}
  ]
});