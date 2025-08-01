import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, tap} from 'rxjs';
import {SetupData} from '@fnf-data';
import {SetupPersistentService} from './setup-persistent.service';

@Injectable({
  providedIn: 'root'
})
export class SetupDataService {
  private setupData$ = new BehaviorSubject<SetupData>(SetupData.getDefaults());
  private initialized = false;

  constructor(private setupPersistentService: SetupPersistentService) {
  }

  /**
   * Initialize the service by loading data from the backend
   * This should be called during app initialization
   */
  init(): Observable<SetupData> {
    if (this.initialized) {
      return this.setupData$.asObservable();
    }

    return this.setupPersistentService.getSetupData().pipe(
      tap((setupData: SetupData) => {
        // Convert plain object to SetupData instance if needed
        const setupDataInstance = setupData instanceof SetupData
          ? setupData
          : SetupData.fromJSON(setupData);

        this.setupData$.next(setupDataInstance);
        this.initialized = true;
      })
    );
  }

  /**
   * Get the current setup data as an observable
   */
  getCurrentData(): Observable<SetupData> {
    return this.setupData$.asObservable();
  }

  /**
   * Get the current setup data value (synchronous)
   */
  getCurrentValue(): SetupData {
    return this.setupData$.value;
  }

  /**
   * Update the local setup data
   * This should be called after successful save operations
   */
  updateData(setupData: SetupData): void {
    this.setupData$.next(setupData);
  }

  /**
   * Reset to defaults and update local state
   */
  resetToDefaults(): Observable<SetupData> {
    return this.setupPersistentService.resetToDefaults().pipe(
      tap((setupData: SetupData) => {
        // Convert plain object to SetupData instance if needed
        const setupDataInstance = setupData instanceof SetupData
          ? setupData
          : SetupData.fromJSON(setupData);

        this.setupData$.next(setupDataInstance);
      })
    );
  }

  /**
   * Reload data from the backend
   */
  reload(): Observable<SetupData> {
    return this.setupPersistentService.getSetupData().pipe(
      tap((setupData: SetupData) => {
        // Convert plain object to SetupData instance if needed
        const setupDataInstance = setupData instanceof SetupData
          ? setupData
          : SetupData.fromJSON(setupData);

        this.setupData$.next(setupDataInstance);
      })
    );
  }

  /**
   * Check if the service has been initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}