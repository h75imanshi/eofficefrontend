import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PressFullDetail, PressSearchResult } from '../models/press.model';

@Injectable({
  providedIn: 'root'
})
export class PressService {

  private baseUrl = 'http://10.197.4.2:8181/api/press';

  constructor(private http: HttpClient) {}

  searchByName(name: string) {
    return this.http.get<PressSearchResult[]>(
      `${this.baseUrl}/search/name`,
      { params: { name } }
    );
  }

  searchByAppNo(appNo: string) {
    return this.http.get<PressSearchResult[]>(
      `${this.baseUrl}/search/appno?appNo=${appNo}`
    );
  }

  searchByPrinter(name: string) {
    return this.http.get<PressSearchResult[]>(
      `${this.baseUrl}/search/printer?name=${name}`
    );
  }

  searchByState(state: string, district: string) {
    return this.http.get<PressSearchResult[]>(
      `${this.baseUrl}/search/state?state=${state}&district=${district}`
    );
  }

  getFullDetail(id: string) {
    return this.http.get<PressFullDetail>(
      `${this.baseUrl}/${id}/detail`
    );
  }

  // NEW METHODS

  getKeeperDetails(id: string) {
  return this.http.get<any[]>(
    `http://10.197.4.2:8181/api/keeper/press/${id}`
  );
}
  getMachineDetails(id: string) {
  return this.http.get<any[]>(
    `http://10.197.4.2:8181/api/machine/press/${id}`
  );
}

  // Newspaper details can be fetched from a separate endpoint
getNewspapersByPressName(pressName: string) {

  return this.http.get<any[]>(
    `http://10.197.4.2:8181/api/newspaper/press-name/${encodeURIComponent(pressName.trim())}`
  );

}
  getStates() {
    return this.http.get<string[]>(
      `${this.baseUrl}/states`
    );
  }

  getDistricts(stateName: string) {
    return this.http.get<string[]>(
      `${this.baseUrl}/districts?stateName=${stateName}`
    );
  }
}