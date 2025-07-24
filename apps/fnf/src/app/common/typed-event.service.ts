import {Subject} from "rxjs";


export class TypedEventService<T> {

  private valueChanges$: Subject<T> = new Subject();

  public valueChanges(): Subject<T> {
    return this.valueChanges$;
  }

  public next(o: T): void {
    this.valueChanges$.next(o);
  }

}
