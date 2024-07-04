import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import * as fromStore from '../../../core/store/app.reducer';
import { EntitySelectorService } from '../../../core/store/app.selectors';

import { Observable, of, combineLatest } from 'rxjs';
import { bufferTime, distinctUntilChanged, shareReplay, mergeMap, filter, switchMap, map } from 'rxjs/operators';
import { User } from '../../../core/store/user/user.model';
import { LongTermData } from './page.model';

@Injectable({
  providedIn: 'root',
})
export class PageSelectors {
  constructor(private slRx: EntitySelectorService) {}


  /** Select the quarter data. */
  selectLongTermData(longTermStartTime$: Observable<number>, currentUser$: Observable<User>, cId: string): Observable<LongTermData> {
    return combineLatest(longTermStartTime$, currentUser$).pipe(
      switchMap(([longTermStartTime, currentUser]) => {
        return this.slRx.selectQuarter<LongTermData>(`${longTermStartTime}`, cId, (q) => ({
          longTermGoals: this.slRx.selectQuarterGoals([
            ['__userId', '==', currentUser.__id],
            ['__quarterId', '==', q.__id],
          ], cId).pipe(
            map((goals) => {
              goals.sort((a, b) => a.order - b.order);
              return goals;
            }),
          ),
        }));
      }),
    );
  }

  /** Release memoized selectors. */
  cleanup(cId: string) {
    this.slRx.release(cId);
  }
}
