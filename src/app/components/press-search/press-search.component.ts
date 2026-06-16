import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PressService } from '../../services/press.service';

import {
  PressSearchResult,
  PressFullDetail,
  SearchType
} from '../../models/press.model';

@Component({
  selector: 'app-press-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './press-search.component.html',
  styleUrls: ['./press-search.component.scss']
})
export class PressSearchComponent implements OnInit {

  activeTab: SearchType = 'name';

  searchName = '';
  searchAppNo = '';
  searchPrinter = '';
  searchState = '';
  searchDist = '';

  states: string[] = [];
  districts: string[] = [];

  results: PressSearchResult[] = [];

  selectedPress: any = null;
  selectedKeeper: any = null;
  selectedMachine: any[] = [];
  selectedNewspapers: any[] = [];
  resultCount = 0;
  totalNewspapers = 0;
  
  

  searched = false;
  loading = false;

  modalOpen = false;
  modalLoading = false;

  modalDetail: PressFullDetail | null = null;

  expandedId: string | null = null;

  constructor(
    private pressService: PressService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadStates();
  }

  loadStates(): void {

    this.pressService
      .getStates()
      .subscribe({
        next: (data) => {
          this.states = data;
        },
        error: (err) => {
          console.error(err);
        }
      });

  }

  onStateChange(): void {

    this.searchDist = '';
    this.districts = [];

    this.pressService
      .getDistricts(this.searchState)
      .subscribe({
        next: (data) => {

          this.districts = [...data];

          this.cd.detectChanges();

        },
        error: (err) => {
          console.error(err);
        }
      });

  }

  switchTab(tab: SearchType): void {

    this.activeTab = tab;

    this.results = [];

    this.searched = false;

  }

  search(): void {

    if (
      this.activeTab === 'name' &&
      this.searchName.trim().length < 3
    ) {
      alert('Enter minimum 3 characters');
      return;
    }

    this.loading = true;
    this.results = [];

    let obs$;

    switch (this.activeTab) {

      case 'name':
        obs$ = this.pressService.searchByName(
          this.searchName
        );
        break;

      case 'appno':
        obs$ = this.pressService.searchByAppNo(
          this.searchAppNo
        );
        break;

      case 'printer':
        obs$ = this.pressService.searchByPrinter(
          this.searchPrinter
        );
        break;

      case 'state':
        obs$ = this.pressService.searchByState(
          this.searchState,
          this.searchDist
        );
        break;

      default:
        return;
    }

    obs$.subscribe({
      next: (data: PressSearchResult[]) => {

        console.log('======================');
        console.log('API RESPONSE => ', data);

        data.forEach((item) => {
          console.log(
            'PRESS = ' + item.pressName +
            ' | STATE = ' + item.state +
            ' | DISTRICT = ' + item.district
          );
        });

        console.log('======================');

        this.results = data;

        this.resultCount = data.length;

        this.searched = true;

        this.loading = false;

        this.cd.detectChanges();

      },

      error: (err) => {

        console.error('Search Error => ', err);

        this.loading = false;

        this.searched = true;

        this.cd.detectChanges();

      }
    });
  }

  toggleDetail(id: string): void {

    this.expandedId =
      this.expandedId === id ? null : id;

    if (this.expandedId) {

      this.loadPressDetail(id);

      this.loadKeeperDetail(id);

      this.loadMachineDetail(id);


    }

  }


  openModal(id: string): void {

    this.modalOpen = true;

    this.modalLoading = true;

    this.pressService
      .getFullDetail(id)
      .subscribe({
        next: (data: PressFullDetail) => {

          this.modalDetail = data;

          this.modalLoading = false;

        },
        error: (err) => {

          console.error(err);

          this.modalLoading = false;

        }
      });


  }

  closeModal(): void {

    this.modalOpen = false;

    this.modalDetail = null;

  }

  loadPressDetail(id: string): void {

    this.pressService.getFullDetail(id)
      .subscribe({
        next: (data) => {
          console.log('PRESS DETAIL => ', data);

          this.selectedPress = data;

            // NEW CODE
        if (data?.pressName) {

          this.loadNewspaperDetail(
            data.pressName
          );

        }


        },
        error: (err) => {
          console.error(err);
        }
      });

  }

  loadKeeperDetail(id: string) {

    this.pressService.getKeeperDetails(id)
      .subscribe((data: any) => {

        console.log("KEEPER DATA =>", data);
        if (Array.isArray(data)) {
          this.selectedKeeper = data.length > 0 ? data[0] : null;
        } else {
          this.selectedKeeper = data;
        }

        console.log("SELECTED KEEPER =>", this.selectedKeeper);
      });
  }

  loadMachineDetail(id: string): void {

    this.selectedMachine = [];

    this.pressService
      .getMachineDetails(id)
      .subscribe({

        next: (data: any) => {

          console.log('MACHINE DATA =>', data);

          this.selectedMachine =
            Array.isArray(data) ? data : [];

          this.cd.detectChanges();

        },

        error: (err: any) => {

          console.error('MACHINE ERROR =>', err);

          this.selectedMachine = [];

        }

      });

  }
loadNewspaperDetail(pressName: string): void {

  this.selectedNewspapers = [];

  this.pressService
    .getNewspapersByPressName(pressName)
    .subscribe({

      next: (data: any[]) => {

        console.log('NEWSPAPERS =>', data);

        this.selectedNewspapers = data;

        this.totalNewspapers = data.length;

        this.cd.detectChanges();
      },

      error: (err) => {

        console.error(
          'NEWSPAPER ERROR =>',
          err
        );

      }

    });
}
}




