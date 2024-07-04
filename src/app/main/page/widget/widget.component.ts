import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { WidgetAnimations } from './widget.animations';
import { LongTermData } from '../+state/page.model';
import { LongTermGoal } from '../../../core/store/long-term-goal/long-term-goal.model';

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: WidgetAnimations,
})
export class WidgetComponent implements OnInit {
  // --------------- INPUTS AND OUTPUTS ------------------

  /** 1 year and 5 year and associated goals. */
  @Input() longTermData: LongTermData;

  /** Initiate edit of goals. */
  @Output() editGoals: EventEmitter<void> = new EventEmitter<void>();

  // --------------- LOCAL AND GLOBAL STATE --------------

  // --------------- DATA BINDING ------------------------

  /** LongTermGoal trackBy function. */
  trackByFn(index: number, goal: LongTermGoal): string {
    return goal.__id;
  }

  // --------------- EVENT BINDING -----------------------

  /** Function for emitting an edit goals event */
  onEdit() {
    this.editGoals.emit();
  }

  // --------------- HELPER FUNCTIONS AND OTHER ----------

  constructor() {}

  ngOnInit(): void {
  }
}
