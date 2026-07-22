import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MandatoryFiling, ApiResponse, SearchRequest } from '../models/filing.model';

@Injectable({
  providedIn: 'root'
})
export class FilingService {

  private baseUrl = 'http://10.197.4.2:8181/api/mandatory-filings';

  constructor(private http: HttpClient) {}

  // =======================================
  // SEARCH
  // =======================================

  searchByDiaryNumber(diaryNumber: string): Observable<ApiResponse<MandatoryFiling[]>> {
    const params = new HttpParams().set('diaryNumber', diaryNumber);
    return this.http.get<ApiResponse<MandatoryFiling[]>>(
      `${this.baseUrl}/search/diary`,
      { params }
    );
  }

  searchByRegNo(regNo: string): Observable<ApiResponse<MandatoryFiling[]>> {
    const params = new HttpParams().set('regNo', regNo);
    return this.http.get<ApiResponse<MandatoryFiling[]>>(
      `${this.baseUrl}/search/regno`,
      { params }
    );
  }

  searchByTitle(titleName: string): Observable<ApiResponse<MandatoryFiling[]>> {
    const params = new HttpParams().set('titleName', titleName);
    return this.http.get<ApiResponse<MandatoryFiling[]>>(
      `${this.baseUrl}/search/title`,
      { params }
    );
  }

  search(keyword: string): Observable<ApiResponse<MandatoryFiling[]>> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<ApiResponse<MandatoryFiling[]>>(
      `${this.baseUrl}/search`,
      { params }
    );
  }

  advancedSearch(request: SearchRequest): Observable<ApiResponse<MandatoryFiling[]>> {
    return this.http.post<ApiResponse<MandatoryFiling[]>>(
      `${this.baseUrl}/search/advanced`,
      request
    );
  }

  // =======================================
  // INSERT FILING
  // =======================================

  insertFiling(data: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/insert`, data);
  }

  // =======================================
  // DOCUMENT URL
  // =======================================

  getDocumentUrl(id: number, fileName?: string): string {
    if (fileName) {
      return `${this.baseUrl}/${id}/documents/${encodeURIComponent(fileName)}/preview`;
    }
    return `${this.baseUrl}/${id}/document/preview`;
  }

  getDownloadUrl(id: number, fileName?: string): string {
    if (fileName) {
      return `${this.baseUrl}/${id}/documents/${encodeURIComponent(fileName)}/preview`;
    }
    return `${this.baseUrl}/${id}/document/preview`;
  }

  // =======================================
  // STATES
  // =======================================

  getStates(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/states`);
  }

  // =======================================
  // DISTRICTS
  // =======================================

  getDistricts(stateName: string): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.baseUrl}/districts`,
      { params: { stateName } }
    );
  }

  // =========================
// REGISTRATION SEARCH
// =========================

searchRegistrationByNewRegNo(regNo: string) {
  return this.http.get<any[]>(
    `http://10.197.4.2:8181/api/registration/new-reg-no?value=${regNo}`
  );
}

searchRegistrationByOldRegNo(oldRegNo: string) {
  return this.http.get<any[]>(
    `http://10.197.4.2:8181/api/registration/old-reg-no?value=${oldRegNo}`
  );
}

searchRegistrationByTitle(title: string) {
  return this.http.get<any[]>(
    `http://10.197.4.2:8181/api/registration/title?value=${title}`
  );
}

//Periodicity api  //
getPeriodicities() {
  return this.http.get<any[]>(
    'http://10.197.4.2:8181/api/periodicity'
  );
}

//Languages api //
getLanguages() {
  return this.http.get<any[]>(
    'http://10.197.4.2:8181/api/languages'
  );
}

  // =======================================
  // REVISION
  // =======================================

  addRevision(req: {
    filingId: number;
    titleName: string;
    regNo: string;
    reason: string;
    changes: string;
    revisionDate: string;
  }): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/revisions`,
      req
    );
  }

  getRevisions(filingId: number): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/${filingId}/revisions`
    );
  }

universalSearch(keyword: string) {
  return this.http.get<any>(
    `${this.baseUrl}/search?keyword=${encodeURIComponent(keyword)}`
  );
}

}