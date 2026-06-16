// src/app/models/press.model.ts
export interface PressSearchResult {
  id: string;
  appNo: string;
  regNo: string;
  pressName: string;
  pressType: string;
  printerName: string;
  state: string;
  district: string;
  status: string;
  pressAddress: string;
  pressPincode: string;
}
export interface PressKeeper {
  id: number;

  keeperName: string;

  keeperMobileNo: string;
  keeperEmail: string;

  address: string;

  keeperState: string;
  keeperDistrict: string;

  keeperPincode: string;
}

export interface PressMachine {

  id: number;

  machineType: string;

  model: string;

  serialNo: string;

  mfgYear: number;

  capacity: string;

  powerRating: number;
}

export interface PressFullDetail {
  id: string;

  appNo: string;
  regNo: string;

  pressName: string;
  pressType: string;

  estYear: number;
  floorArea: string;

  licenseNo: string;
  licenseValidity: string;

  state: string;
  district: string;

  status: string;
   pressAddress: string;
  pressPincode: string;



  keepers: PressKeeper[];
  machines: PressMachine[];
}


export interface NewspaperDetails {

  id?: number;

  regNo: string;

  newspaperName: string;

  placeOfPublication: string;

  state: string;

  district: string;

  pincode: string;

  language: string;

  periodicity: string;
}

export type SearchType = 'name' | 'appno' | 'printer' | 'state';
