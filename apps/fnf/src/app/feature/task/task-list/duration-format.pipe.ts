import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'durationFormat', standalone: true})
export class DurationFormatPipe implements PipeTransform {

  transform(milliseconds: number | null | undefined): string {
    if (milliseconds == null || milliseconds < 0) {
      return '';
    }

    // Convert milliseconds to seconds
    const totalSeconds = Math.floor(milliseconds / 1000);

    // Calculate hours, minutes, and seconds
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Format based on whether hours are present
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }
}