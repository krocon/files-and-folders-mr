import {Component, Input} from "@angular/core";

@Component({
  standalone: true,
  selector: "fnf-shortcut",
  templateUrl: "./shortcut.component.html",

  styleUrls: ["./shortcut.component.css"]
})
export class ShortcutComponent {

  @Input() keys: string[] = [];

  isMetaKey(s: string) {
    const k = s.toLowerCase();
    return k === 'alt' || k === 'ctrl' || k === 'shift' || k === 'meta' || k === 'cmd'
      || k === '⌘' || k === '⇧' || k === '^';
  }
}
