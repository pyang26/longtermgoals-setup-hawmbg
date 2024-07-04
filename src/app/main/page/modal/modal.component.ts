import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter, Inject } from '@angular/core';
import { ModalAnimations } from './modal.animations';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LongTermData, LongTermGoalInForm } from '../+state/page.model';
import { BehaviorSubject } from 'rxjs';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';


@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: ModalAnimations,
})
export class ModalComponent implements OnInit {
  // --------------- INPUTS AND OUTPUTS ------------------

  // --------------- LOCAL AND GLOBAL STATE --------------

  /** A loading indicator. */
  loading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  /** Local state for form info. */
  LongTermGoalsForm: [LongTermGoalInForm, LongTermGoalInForm];

  // --------------- DATA BINDING ------------------------

  // --------------- EVENT BINDING -----------------------

  /** Drop event for drag-and-drop functionality */
  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.LongTermGoalsForm, event.previousIndex, event.currentIndex);
  }

  /** Close the modal. */
  close() {
    this.dialogRef.close();
  }

  /** Submit the project data. */
  submit() {
    this.data.updateGoals(this.LongTermGoalsForm, this.loading$);
  }

  // --------------- HELPER FUNCTIONS AND OTHER ----------

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      longTermData: LongTermData,
      updateGoals: (goals: [LongTermGoalInForm, LongTermGoalInForm], loading$: BehaviorSubject<boolean>) => void,
    },
    private dialogRef: MatDialogRef<ModalComponent>,
  ) { }

  ngOnInit(): void {
    this.LongTermGoalsForm = [
      {
        __id: this.data.longTermData.longTermGoals[0].__id,
        text: this.data.longTermData.longTermGoals[0].text,
        year: this.data.longTermData.longTermGoals[0].year,
      },
      {
        __id: this.data.longTermData.longTermGoals[1].__id,
        text: this.data.longTermData.longTermGoals[1].text,
        year: this.data.longTermData.longTermGoals[1].year,
      },
    ];
  }
}
