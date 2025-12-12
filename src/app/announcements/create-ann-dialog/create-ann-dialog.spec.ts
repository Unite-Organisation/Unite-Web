import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAnnDialog } from './create-ann-dialog';

describe('CreateAnnDialog', () => {
  let component: CreateAnnDialog;
  let fixture: ComponentFixture<CreateAnnDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAnnDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateAnnDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
