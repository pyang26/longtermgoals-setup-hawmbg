export interface LongTermGoal {
  __id: string;
  __userId: string;
  __quarterId: string;
  text: string;
  year: string;
  completed: boolean;
  order: number;
  oneYear: string;
  fiveYear: string;
}

export interface LongTerm {
  __id: string; // string representation of startTime
  startTime: number; // start of quarter in GMT time in milliseconds since 1/1/1970
  endTime: number; // end of quarter in GMT time in milliseconds since 1/1/1970

}
