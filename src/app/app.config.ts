import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import{provideRouter} from '@angular/router'

import { routes } from './app.routes';
import { authInterceptor } from './Interceptor/auth.interceptor';
import { provideHttpClient, withFetch,withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';


export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes),provideAnimations(),
  provideHttpClient(withFetch()),provideHttpClient(withInterceptors([authInterceptor]))]
};
