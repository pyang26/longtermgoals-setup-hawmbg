import { LongTermGoal, LongTerm } from '../../../core/store/long-term-goal/long-term-goal.model';

export interface LongTermData extends LongTerm {
  longTermGoals: LongTermGoal[];
}

export interface LongTermGoalInForm {
  __id: string;
  text: string;
  year: string;
}
