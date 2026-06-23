// src/app/components/search-dashboard/search-dashboard.component.ts

import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { FilingService } from '../../services/filing.service';
import {
  MandatoryFiling,
  PERIODICITY_OPTIONS,
  SearchRequest
} from '../../models/filing.model';
import { Router } from '@angular/router';
import { PressSearchComponent } from '../press-search/press-search.component';

type SearchTab = 'search' | 'advanced' | 'insert' | 'Press';

@Component({
  selector: 'app-search-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PdfViewerModule,
    PressSearchComponent
  ],
  templateUrl: './search-dashboard.component.html',
  styleUrls: ['./search-dashboard.component.scss']
})
export class SearchDashboardComponent implements OnInit {

  // =========================================================
  // STATE
  // =========================================================

  activeTab: SearchTab = 'search';
  public searchInput: string = '';

  advancedForm!: FormGroup;
  insertForm!: FormGroup;
  pressForm!: FormGroup;
  revisionForm!: FormGroup;


  results: MandatoryFiling[] = [];
  selectedFiling: MandatoryFiling | null = null;
  // String ki jagah Set use karo
activeDetailPanel: Set<string> = new Set();
  moreDetailsFiling: MandatoryFiling | null = null;
  showDakDetails = false;
  showRevisionDetails = false;
  revisionSuccess = '';
revisionError = '';
revisionSubmitting = false;
  pdfSourceUrl: string | null = null;

  loading = false;
  searched = false;
  errorMsg = '';
  successMsg = '';
  currentUser = '';

  // Periodicity//
  periodicities: any[] =[];
  states: string[] = [];
  districts: string[] = [];

  // languages//
  languages: any[] =[];

  // Printing Press
  pressList: any[] = [];
  pressSearchText = '';
  selectedPress: any = null;
  showPressView = false;
  isPressEdit = false;
  editingPressId: number | null = null;

  // Other options toggle in Insert form
  showOtherOptions = false;

  // =========================================================
  // FILES
  // =========================================================

  document1: File | null = null;
  document2: File | null = null;
  otherDocuments: File[] = [];

  @ViewChild('doc1Input', { static: false })
  doc1Input?: ElementRef<HTMLInputElement>;

  @ViewChild('doc2Input', { static: false })
  doc2Input?: ElementRef<HTMLInputElement>;

  // =========================================================
  // SESSION
  // =========================================================

  private sessionTimer: any;

  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    public filingService: FilingService,
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) { }

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.currentUser = localStorage.getItem('username') || '';
    console.log('Current User = ', this.currentUser);

    const loggedUser = localStorage.getItem('loggedUser');
    if (!loggedUser) {
      this.router.navigate(['/login']);
      return;
    }

    // ADVANCED SEARCH FORM
    this.advancedForm = this.fb.group({
      diaryNumber: [''],
      regNo: [''],
      titleName: [''],
      ownerName: [''],
      publisherName: [''],
      state: [''],
      district: [''],
      periodicity: ['']
    });

    // INSERT FORM
this.insertForm = this.fb.group({
  diaryNumber:     ['', [Validators.required]],
  regNo:           [''],
  titleName:       ['', [Validators.required, Validators.minLength(3)]],
  periodicity:     [''],
  language:        [''],
  state:           [''],
  district:        [''],
  pinCode:         ['', [Validators.pattern('^[0-9]{6}$')]],
  status:          ['ACTIVE'],
  ownerName:       [''],
  publisherName:   [''],
  searchType:      [''],
  otherValue:      [''],
  dakReceivedDate: [''],
  dakDiaryNo:      [''],
  dakState:        [''],
  dakDistrict:     [''],
  dakSection:      [''],
  dakProcessed:    [''],
  dakForwardTo:    ['']
});

    // PRESS FORM
    this.pressForm = this.fb.group({
      filingId: [''],
      pressName: ['', [Validators.required, Validators.minLength(3)]],
      pressApplicationNo: ['', Validators.required],
      printerName: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', Validators.required],
      state: ['', Validators.required],
      district: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });
this.revisionForm = this.fb.group({
  titleName: [''],
  regNo: [''],
  reason: [''],
  changes: [''],
  revisionDate: ['']
});
    this.loadStates();
    //this.loadPress();
    this.loadPeriodicities();
    this.loadLanguages();

    
  }
openPrintingPress(): void {
  this.activeTab = 'Press';
  this.results = [];
  this.selectedFiling = null;
  this.moreDetailsFiling = null;
  this.pdfSourceUrl = null;
  this.errorMsg = '';
  this.searched = false;
  this.showDakDetails = false;
}

  // =========================================================
  // TAB
  // =========================================================

  setTab(tab: SearchTab): void {
    this.activeTab = tab;
    this.results = [];
    this.selectedFiling = null;
    this.pdfSourceUrl = null;
    this.errorMsg = '';
    this.successMsg = '';
    this.searched = false;
    this.moreDetailsFiling = null;
    this.showRevisionDetails = false;
    this.activeDetailPanel = new Set();
  }

  // =========================================================
  // SEARCH
  // =========================================================

// Periodicity Record//
loadPeriodicities(): void {

  this.filingService.getPeriodicities()
    .subscribe({

      next: (data) => {

        console.log('PERIODICITIES =>', data);

        this.periodicities = data;

      },

      error: (err) => {

        console.error('Periodicity Error', err);

      }

    });

}

// lOAD lANGUAGES//
loadLanguages() {

  this.filingService.getLanguages()
    .subscribe({

      next: (data) => {

        console.log('LANGUAGES =>', data);

        this.languages = data;

      },

      error: (err) => {

        console.error(err);

      }

    });

}

  searchRecords(): void {

  const keyword = this.searchInput.trim();

  this.filingService.searchByDiaryNumber(keyword)
    .subscribe({
      next: (res) => this.handleSearchResponse(res),
      error: (err) => this.handleError()
    });
}
  searchAdvanced(): void {
    const req: SearchRequest = this.advancedForm.value;
    this.startLoading();
    this.filingService.advancedSearch(req).subscribe({
      next: (res) => { this.handleSearchResponse(res); this.cdr.detectChanges(); },
      error: (err) => { console.error(err); this.handleError(); this.cdr.detectChanges(); }
    });
  }

  resetAdvanced(): void {
    this.advancedForm.reset();
    this.results = [];
    this.selectedFiling = null;
    this.pdfSourceUrl = null;
    this.errorMsg = '';
    this.searched = false;
    this.moreDetailsFiling = null;
  }

  private startLoading(): void {
    this.loading = true;
    this.searched = false;
    this.errorMsg = '';
    this.results = [];
    this.selectedFiling = null;
    this.pdfSourceUrl = null;
    this.moreDetailsFiling = null;
  }

  private handleSearchResponse(res: any): void {
    this.loading = false;
    this.searched = true;
    if (res?.success && res?.data?.length > 0) {
      // Normalize incoming data to ensure `filing_date` is present
      this.results = res.data.map((r: any) => ({
        ...r,
        filing_date:
          r.filing_date ?? r.filingDate ?? r.registration_date ?? r.registrationDate ?? r.createdAt ?? r.created_at ?? undefined,
        address:
          r.address ?? r.placeAddress ?? r.publicationAddress ?? r.publisherAddress ?? undefined
      }));
    } else {
      this.errorMsg = res?.message || 'No records found.';
    }
    this.cdr.detectChanges();
  }

  private handleError(): void {
    this.loading = false;
    this.searched = true;
    this.errorMsg = 'Server error. Please try again.';
  }

  // =========================================================
  // FILING SELECTION & DETAIL
  // =========================================================

selectFiling(filing: MandatoryFiling): void {
  if (this.selectedFiling?.id === filing.id) {
    this.selectedFiling = null;
    this.moreDetailsFiling = null;
    this.showDakDetails = false;
    this.activeDetailPanel = new Set();
  } else {
    this.selectedFiling = filing;
    this.moreDetailsFiling = null;
    this.showDakDetails = false;
    this.activeDetailPanel = new Set();
  }
}

  closeDetail(): void {
    this.selectedFiling = null;
    this.moreDetailsFiling = null;
    this.pdfSourceUrl = null;
    this.activeDetailPanel = new Set();
  }
closeDetailPanel(): void {
  this.selectedFiling = null;
  this.activeDetailPanel = new Set();
}

  openMoreDetails(filing: MandatoryFiling): void {
    this.moreDetailsFiling = filing;
  }

  closeMoreDetails(): void {
    this.moreDetailsFiling = null;
    this.showDakDetails = false;
      this.showRevisionDetails = false;
  this.revisionForm?.reset();
  }
  toggleDakDetails(): void {
  this.showDakDetails = !this.showDakDetails;
}
toggleRevisionDetails(): void {
  this.showRevisionDetails = !this.showRevisionDetails;
  this.revisionSuccess = '';
  this.revisionError = '';
}

submitRevision(): void {
  if (!this.moreDetailsFiling) return;

  this.revisionSubmitting = true;
  this.revisionSuccess = '';
  this.revisionError = '';

  const req = {
    filingId: this.moreDetailsFiling.id,
    titleName: this.revisionForm.value.titleName || '',
    regNo: this.revisionForm.value.regNo || '',
    reason: this.revisionForm.value.reason || '',
    changes: this.revisionForm.value.changes || '',
    revisionDate: this.revisionForm.value.revisionDate || ''
  };

  this.filingService.addRevision(req).subscribe({
    next: (res: any) => {
      this.revisionSubmitting = false;
      this.revisionSuccess = 'Revision added successfully!';
      this.revisionForm.reset();
      if (this.moreDetailsFiling) {
        if (!this.moreDetailsFiling.revisions) {
          this.moreDetailsFiling.revisions = [];
        }
        this.moreDetailsFiling.revisions.unshift(res.data);
        this.moreDetailsFiling.revisionCount =
          (this.moreDetailsFiling.revisionCount || 0) + 1;
      }
      this.cdr.detectChanges();
    },
    error: (err: any) => {
      this.revisionSubmitting = false;
      this.revisionError = 'Failed to add revision. Please try again.';
      console.error(err);
    }
  });
}


  // =========================================================
  // DOCUMENT
  // =========================================================

  viewDocument(filing: MandatoryFiling, fileName: string): void {
    if (!fileName) { alert('Document not available.'); return; }
    const url = this.filingService.getDocumentUrl(filing.id, fileName);
    console.log(url);
    window.open(url, '_blank');
  }

  previewPdf(filing: MandatoryFiling, fileName: string): void {
    if (!fileName) { alert('Document not available.'); return; }
    this.pdfSourceUrl = this.filingService.getDocumentUrl(filing.id, fileName);
    setTimeout(() => {
      document.querySelector('pdf-viewer')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  closePdfPreview(): void {
    this.pdfSourceUrl = null;
  }

  getDocumentFolderPath(filing: MandatoryFiling): string {
    return filing.filePath || 'Path not available';
  }

  getFolderUrl(filing: MandatoryFiling): string {
    const path = this.getDocumentFolderPath(filing);
    if (path === 'Path not available') return '';
    return 'file:///' + path.replace(/\\/g, '/').replace(/ /g, '%20');
  }

  openFolder(filing: MandatoryFiling): void {
    const folderUrl = this.getFolderUrl(filing);
    if (!folderUrl) { alert('Folder path not available.'); return; }
    window.open(folderUrl, '_blank');
  }

  copyFolderPath(filing: MandatoryFiling): void {
    const path = this.getDocumentFolderPath(filing);
    if (path === 'Path not available') { alert('Folder path not available.'); return; }
    navigator.clipboard.writeText(path)
      .then(() => alert('Folder path copied to clipboard:\n' + path))
      .catch(() => alert('Unable to copy folder path.'));
  }

  // =========================================================
  // PRINTING PRESS
  // =========================================================

  // savePress(): void {
  //   this.http.post('http://localhost:8181/api/printing-press/add', this.pressForm.value)
  //     .subscribe({
  //       next: () => { alert('Press Saved'); this.pressForm.reset(); this.loadPress(); },
  //       error: (err) => alert(err.error)
  //     });
  // }

  // loadPress(): void {
  //   this.http.get<any[]>('http://localhost:8181/api/printing-press/search')
  //     .subscribe(res => this.pressList = res);
  // }

  // viewPress(id: number): void {
  //   this.http.get(`http://localhost:8181/api/printing-press/${id}`)
  //     .subscribe((res: any) => { this.selectedPress = res; this.showPressView = true; });
  // }

  // editPress(id: number): void {
  //   this.http.get(`http://localhost:8181/api/printing-press/${id}`)
  //     .subscribe((res: any) => { this.isPressEdit = true; this.editingPressId = id; this.pressForm.patchValue(res); });
  // }

  // updatePress(): void {
  //   this.http.put(`http://localhost:8181/api/printing-press/update/${this.editingPressId}`, this.pressForm.value)
  //     .subscribe({
  //       next: () => {
  //         alert('Updated Successfully');
  //         this.loadPress();
  //         this.isPressEdit = false;
  //         this.editingPressId = null;
  //         this.pressForm.reset();
  //       },
  //       error: (err) => { console.error(err); alert('Update Failed'); }
  //     });
  // }

  // openPressDetails(pressName: string | undefined): void {
  //   if (!pressName) { alert('Press details not available'); return; }
  //   window.open(`/press-details/${encodeURIComponent(pressName)}`, '_blank');
  // }

  // =========================================================
  // HELPERS
  // =========================================================

  getStatusClass(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'ACTIVE':   return 'status-active';
      case 'INACTIVE': return 'status-inactive';
      case 'PENDING':  return 'status-pending';
      default:         return '';
    }
  }
  getPeriodicityClass(periodicity: string): string {

  switch ((periodicity || '').toUpperCase()) {

    case 'DAILY':
      return 'badge-daily';

    case 'WEEKLY':
      return 'badge-weekly';

    case 'MONTHLY':
      return 'badge-monthly';

    case 'FORTNIGHTLY':
      return 'badge-fortnightly';

    case 'QUARTERLY':
      return 'badge-quarterly';

    case 'YEARLY':
      return 'badge-yearly';

    default:
      return '';
  }
}

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  getShortName(fileName: string): string {
    if (!fileName) return 'Unknown';
    const clean = fileName.replace(/^\d+_slot\d+_/i, '');
    return clean.length > 22 ? clean.substring(0, 20) + '...' : clean;
  }

  toggleOtherOptions(): void {
    this.showOtherOptions = !this.showOtherOptions;
  }

  // =========================================================
  // PRINT / EXPORT
  // =========================================================

  printResults(): void {
    if (!this.results.length) { alert('No data available to print.'); return; }
    const printContents = document.getElementById('print-section')?.innerHTML;
    if (!printContents) { alert('Print section not found.'); return; }
    const popup = window.open('', '_blank', 'width=1200,height=800');
    if (!popup) { alert('Unable to open print window.'); return; }
    const html = `
      <html><head><title>Mandatory Filing Search Results</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;font-size:12px;}
      h2{text-align:center;}table{width:100%;border-collapse:collapse;}
      th,td{border:1px solid #000;padding:6px;text-align:left;}th{background:#f2f2f2;}</style>
      </head><body>
      <h2>Mandatory Filing Search Results</h2>
      <p>Printed on: ${new Date().toLocaleString('en-IN')}</p>
      ${printContents}</body></html>`;
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  downloadCSV(): void {
    if (!this.results.length) { alert('No data available to download.'); return; }
    const headers = ['Diary Number','Registration Number','Title Name','Owner Name','Publisher Name','State','District','Periodicity','Status','Filing Date'];
    const rows = this.results.map(item => [
      item.diaryNumber ?? '', item.regNo ?? '', item.titleName ?? '',
      item.ownerName ?? '', item.publisherName ?? '', item.state ?? '',
      item.district ?? '', item.periodicity ?? '', item.status ?? '', item.filing_date ?? ''
    ]);
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mandatory_filing_results_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadJSON(): void {
    if (!this.results.length) { alert('No data available to download.'); return; }
    const blob = new Blob([JSON.stringify(this.results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mandatory_filing_results_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // =========================================================
  // FILE SELECT
  // =========================================================

  onFile1Selected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { alert('Only PDF files are allowed'); event.target.value = ''; return; }
    this.document1 = file;
    this.cdr.detectChanges();
  }

  onFile2Selected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { alert('Only PDF files are allowed'); event.target.value = ''; return; }
    this.document2 = file;
    this.cdr.detectChanges();
  }

  canAddAnotherDocument(): boolean {
    if (!this.document1 || !this.document2) return false;
    if (this.otherDocuments.length === 0) return true;
    return !!this.otherDocuments[this.otherDocuments.length - 1];
  }

  isAddButtonDisabled(): boolean {
    if (!this.document1 || !this.document2) return true;
    if (this.otherDocuments.length === 0) return false;
    return !this.otherDocuments[this.otherDocuments.length - 1];
  }

  addMoreDocument(): void {
    if (this.otherDocuments.length >= 10) { alert('Maximum 10 additional documents allowed'); return; }
    this.otherDocuments.push(null as any);
  }

  onOtherDocumentSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { alert('Only PDF files are allowed'); event.target.value = ''; return; }
    this.otherDocuments[index] = file;
  }

  removeOtherDocument(index: number): void {
    this.otherDocuments.splice(index, 1);
  }

  removeDocument1(): void {
    this.document1 = null;
    const inputs = document.querySelectorAll('input[type="file"]');
    if (inputs[0]) (inputs[0] as HTMLInputElement).value = '';
  }

  removeDocument2(): void {
    this.document2 = null;
    const inputs = document.querySelectorAll('input[type="file"]');
    if (inputs[1]) (inputs[1] as HTMLInputElement).value = '';
  }

  // =========================================================
  // INSERT FORM SUBMIT
  // =========================================================

    submitInsertForm(): void {
  if (this.insertForm.invalid) {
    this.insertForm.markAllAsTouched();
    this.cdr.detectChanges();
    return;
  }
    this.loading = true;
    const formData = new FormData();
    formData.append('createdBy', localStorage.getItem('username') || '');
    Object.keys(this.insertForm.value).forEach(key => {
      formData.append(key, this.insertForm.value[key] ?? '');
    });
    if (this.document1) formData.append('document1', this.document1);
    if (this.document2) formData.append('document2', this.document2);
    this.otherDocuments.forEach(file => { if (file) formData.append('otherDocuments', file); });

    this.filingService.insertFiling(formData).subscribe({
      next: (res: any) => {
        console.log(res);
        this.loading = false;
        this.successMsg = 'Filing inserted successfully';
        alert('Filing inserted successfully');
        this.insertForm.reset();
        this.document1 = null;
        this.document2 = null;
        this.otherDocuments = [];
        this.insertForm.patchValue({ status: 'ACTIVE' });
        this.activeTab = 'search';
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.errorMsg = 'Insert failed';
        alert('Insert failed');
      }
    });
  }

  resetForm(): void {
    this.insertForm.reset();
    this.document1 = null;
    this.document2 = null;
    this.otherDocuments = [];
    this.insertForm.patchValue({ status: 'ACTIVE' });
    document.querySelectorAll('input[type="file"]').forEach((input: any) => input.value = '');
  }

  // =========================================================
  // STATES & DISTRICTS
  // =========================================================

  loadStates(): void {
    this.filingService.getStates().subscribe({
      next: (data: string[]) => this.states = data,
      error: (err) => console.error(err)
    });
  }

  onStateChange(event: any): void {
    const state = event.target.value;
    this.districts = [];
    if (state) {
      this.filingService.getDistricts(state).subscribe({
        next: (data: string[]) => { this.districts = data; this.cdr.detectChanges(); },
        error: (err) => console.error(err)
      });
    }
  }

  // =========================================================
  // SESSION & LOGOUT
  // =========================================================

  startSessionTimer(): void {
    clearTimeout(this.sessionTimer);
    this.sessionTimer = setTimeout(() => {
      alert('Session expired. Please login again.');
      localStorage.clear();
      sessionStorage.clear();
      this.router.navigate(['/login']);
    }, 5 * 60 * 1000);
  }

  logout(): void {
    clearTimeout(this.sessionTimer);
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}