import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ParamMap, ActivatedRoute } from '@angular/router';
import { Store, select } from '@ngrx/store';
import * as fromStore from '../../core/store/app.reducer';
import * as fromAuth from '../../core/store/auth/auth.reducer';
import { PageAnimations } from './page.animations';
import { FirebaseService } from '../../core/firebase/firebase.service';
import { tap, filter, withLatestFrom, take, takeUntil, map, subscribeOn } from 'rxjs/operators';
import { of, distinctUntilChanged, interval, Observable, Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { User } from '../../core/store/user/user.model';
import { PageSelectors } from './+state/page.selectors';
import { LongTermData, LongTermGoalInForm } from './+state/page.model';
import { LoadData, Cleanup } from './+state/page.actions';
import { ActionFlow, RouterNavigate } from '../../core/store/app.actions';
import { UpdateUser } from '../../core/store/user/user.actions';
import { QuarterGoalActionTypes, UpdateQuarterGoal } from '../../core/store/quarter-goal/quarter-goal.actions';
import { LongTermGoalActionTypes, UpdateLongTermGoal } from '../../core/store/long-term-goal/long-term-goal.actions';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ModalComponent } from './modal/modal.component';
import { ShowSnackbar } from '../../core/snackbar/snackbar.actions';

@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: PageAnimations,
})
export class PageComponent implements OnInit, OnDestroy {
  // --------------- ROUTE PARAMS & CURRENT USER ---------

  /** The currently signed in user. */
  currentUser$: Observable<User> = this.store.pipe(
    select(fromAuth.selectUser),
    filter((user) => user !== null),
  );

  // --------------- LOCAL AND GLOBAL STATE --------------

  /** For storing the dialogRef in the opened modal. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dialogRef: MatDialogRef<any>;

  // --------------- DB ENTITY DATA ----------------------

  /** Container id for selectors and loading. */
  containerId: string = this.db.createId();

  // --------------- DATA BINDING ------------------------

  /** Raw time in milliseconds from 1970/01/01 00:00:00:000 **/
  currentDateTime$: Observable<number> = interval(1000).pipe(
    map(() => Date.now()),
  );

  /** Current quarter needed to select the right quarter from DB. */
  currentLongTermStartTime$: Observable<number> = this.currentDateTime$.pipe(
    map((now) => this.dateToLongTermStartTime(now)),
    distinctUntilChanged(),
  );

  /** Get the LongTerm data. */
  longTermData$: Observable<LongTermData> = this.selectors.selectLongTermData(
    this.currentLongTermStartTime$,
    this.currentUser$,
    this.containerId,
  );

  // --------------- EVENT BINDING -----------------------

  /** Event for opening the edit modal. */
  openEditModal$: Subject<void> = new Subject();

  /** Event for saving goal edits. */
  saveGoals$: Subject<{ goals: [LongTermGoalInForm, LongTermGoalInForm], loading$: BehaviorSubject<boolean> }> = new Subject();

  // --------------- HELPER FUNCTIONS AND OTHER ----------

  /** Helper function for converting timestamp to quarter start time. */
  dateToLongTermStartTime(dateTime: number): number {
    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = date.getMonth();
    const startingMonthOfQuarter = Math.floor(month / 3) * 3;
    const startingDateOfQuarter = new Date(year, startingMonthOfQuarter, 1);

    return startingDateOfQuarter.getTime();
  }

  /** Unsubscribe observable for subscriptions. */
  unsubscribe$: Subject<void> = new Subject();

  constructor(
    private route: ActivatedRoute,
    private selectors: PageSelectors,
    private store: Store<fromStore.State>,
    private db: FirebaseService,
    private dialog: MatDialog,
  ) {
  }

  ngOnInit() {
    // --------------- EVENT HANDLING ----------------------

    /** Handle openEditModal events. */
    this.openEditModal$.pipe(
      withLatestFrom(this.longTermData$),
      takeUntil(this.unsubscribe$),
    ).subscribe(([_, longTermData]) => {
      this.dialogRef = this.dialog.open(ModalComponent, {
        height: '366px',
        width: '100%',
        maxWidth: '500px',
        data: {
          longTermData: longTermData,
          updateGoals: (goals: [LongTermGoalInForm, LongTermGoalInForm], loading$: BehaviorSubject<boolean>) => {
            this.saveGoals$.next({ goals, loading$ });
          },
        },
        panelClass: 'dialog-container',
      });
    });

    /** Handle save goals events. */
    this.saveGoals$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(({ goals, loading$ }) => {
      // Define the action sets we'd like to dispatch
      const actionSets = goals.map((g, i) => {
        return {
          action: new UpdateQuarterGoal(g.__id, {
            text: g.text,
            order: i + 1,
          }, this.containerId),
          responseActionTypes: {
            success: QuarterGoalActionTypes.UPDATE_SUCCESS,
            failure: QuarterGoalActionTypes.UPDATE_FAIL,
          },
        };
      });

      // Dispatch an Action Flow with those actionSets
      // as well as the loading$, successActionFn, and failActionFn
      this.store.dispatch(
        new ActionFlow({
          actionSets,
          loading$,
          successActionFn: () => {
            this.dialogRef.close();
            return [
              new ShowSnackbar({
                message: 'Updated Long Term Goals',
                config: { duration: 2000 },
              }),
            ];
            
          },
          failActionFn: (actionSetResponses) => {
            this.dialogRef.close();
            return [
              new ShowSnackbar({
              message: 'Could not update Long Term Goals',
              config: { duration: 2000 },
              }),
            ];
            },
        }),
      );
    });

    // --------------- LOAD DATA ---------------------------
    // Once everything is set up, load the data for the role.
    combineLatest(this.currentLongTermStartTime$, this.currentUser$).pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(([longTermStartTime, currentUser]) => {
      this.store.dispatch(
        new LoadData({
          longTermStartTime,
          currentUser,
        }, this.containerId),
      );
    });
  }

  ngOnDestroy() {
    // Unsubscribe subscriptions.
    this.unsubscribe$.next();
    this.unsubscribe$.complete();

    // Unsubscribe from firebase connection from load and free up memoized selector values.
    this.store.dispatch(new Cleanup(this.containerId));
    this.selectors.cleanup(this.containerId);
  }
}
