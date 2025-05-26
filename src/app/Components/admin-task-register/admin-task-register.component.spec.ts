import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminTaskRegisterComponent } from './admin-task-register.component';

describe('AdminTaskRegisterComponent', () => {
  let component: AdminTaskRegisterComponent;
  let fixture: ComponentFixture<AdminTaskRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTaskRegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminTaskRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
