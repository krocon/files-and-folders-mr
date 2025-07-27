import {Component, EventEmitter, Output} from "@angular/core";
import {CommonModule} from "@angular/common";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatDividerModule} from "@angular/material/divider";
import {MatTooltip} from "@angular/material/tooltip";
import {FiletypeExtensionsIf} from "@fnf-data";




@Component({
  selector: "fnf-clean-template-dropdown",
  templateUrl: "./clean-template-dropdown.component.html",
  imports: [
    CommonModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltip,
  ]
})
export class CleanTemplateDropdownComponent {

  // TODO Make data editable and reload it
  fileTypes: FiletypeExtensionsIf[] = [
    {
      label: "Video RAR Leftovers",
      extensions: [
        "**/*.nfo",
        "**/*sample.mkv",
        "**/*proof.jpg",
        "**/*proof.jpeg",
        "**/Sample",
        "**/Proof",
        "**/Subs"
      ]
    },
    {
      label: "Warez Leftovers",
      extensions: [
        "**/*.dlc",
        "**/*.ccf",
        "**/*.rsdf",
        "**/*.nzf",
        "**/*.nzb",
        "**/*.metalink",
        "**/*.meta4",
        "**/*.torrent"
      ]
    },
    {
      label: "System Junk (macOS)",
      extensions: [
        "**/.DS_Store",
        "**/.Spotlight-V100",
        "**/.TemporaryItems",
        "**/.Trashes",
        "**/.AppleDouble",
        "**/.AppleDesktop"
      ]
    },
    {
      label: "System Junk (Windows)",
      extensions: [
        "**/Thumbs.db",
        "**/desktop.ini",
        "**/~*",
        "**/*.lnk"
      ]
    },
    {
      label: "System Junk (Linux)",
      extensions: [
        "**/.Trash-*",
        "**/*.swp",
        "**/*.tmp",
        "**/*~"
      ]
    },
    {
      label: "Mac App Artifacts",
      extensions: [
        "**/__MACOSX",
        "**/*.DS_Store"
      ]
    },
    {
      label: "Par2 / Usenet Recovery Files",
      extensions: [
        "**/*.par2",
        "**/*.sfv"
      ]
    }
  ];


  @Output() onSelected = new EventEmitter<string>();


  onItemClicked(ft: FiletypeExtensionsIf) {
    this.onSelected.emit(ft.extensions.join('|'));
  }

}