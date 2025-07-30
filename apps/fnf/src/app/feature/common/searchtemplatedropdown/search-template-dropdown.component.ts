import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output} from "@angular/core";
import {CommonModule} from "@angular/common";
import {MatMenuModule} from "@angular/material/menu";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {MatDividerModule} from "@angular/material/divider";
import {FiletypeExtensionsIf} from "@fnf-data";
import {SearchPatternsService} from "../../../service/config/search-patterns.service";


@Component({
  selector: "fnf-search-template-dropdown",
  templateUrl: "./search-template-dropdown.component.html",
  imports: [
    CommonModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchTemplateDropdownComponent implements OnInit {


  fileTypes: FiletypeExtensionsIf[] = [];

  constructor(
    private readonly searchPatternsService: SearchPatternsService,
    private readonly cdr: ChangeDetectorRef,
  ) {
  }

  ngOnInit(): void {
    this.searchPatternsService
      .load()
      .subscribe(patterns => {
        this.fileTypes = patterns;
        this.cdr.detectChanges();
      })
  }



  @Output() onSelected = new EventEmitter<string>();


  onItemClicked(ft: FiletypeExtensionsIf) {
    this.onSelected.emit(ft.extensions.join('|'));
  }

}
