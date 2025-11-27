import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddButton } from './add-button';

describe('CreateButton', () => {
  let component: AddButton;
  let fixture: ComponentFixture<AddButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
