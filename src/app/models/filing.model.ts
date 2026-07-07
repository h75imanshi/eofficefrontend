// src/app/models/filing.model.ts

export interface MandatoryFiling {
filing_date: string|undefined;

  id: number;
  diaryNumber: string;
  regNo: string | null;
  titleName: string;
  ownerName: string;
  publisherName: string;
  periodicity: Periodicity | string;
  state: string;
  district: string;

  // ==========================
  // DOCUMENTS
  // ==========================
  documentName: string | null;
  documentName2?: string | null;
  documentType?: string | null;
  documentType2?: string | null;
  hasDocument: boolean;
  hasDocument2?: boolean;
  filePath?: string;
  filePath2?: string;
  documents?: string[];

  // ==========================
  // STATUS
  // ==========================
  status: FilingStatus | string;
  createdAt: string;
  updatedAt: string;

  // Registration Details//
  registerNo: string;
  newspaperTitle: string;
  oldRegistrationNoNews: string;
  registrationNoNews: string;

  // ==========================
  // OWNER DETAILS
  // ==========================
  ownerAddress?: string;
  ownerState?: string;
  ownerDistrict?: string;
  ownerCity?: string;
  ownerPincode?: string;
  ownership?: string;

  // ==========================
  // PUBLISHER DETAILS
  // ==========================
  publisherAddress?: string;
  publisherState?: string;
  publisherDistrict?: string;
  publisherCity?: string;
  publisherPincode?: string;

  // ==========================
  // EDITOR DETAILS
  // ==========================
  editorName?: string;
  editorAddress?: string;
  editorState?: string;
  editorDistrict?: string;
  editorCity?: string;
  editorPincode?: string;
  editorNationality?: string;
  // ==========================
  // PLACE OF PUBLICATION
  // ==========================
  publicationAddress?: string;
  publicationState?: string;
  publicationDistrict?: string;
  publicationCity?: string;
  publicationPincode?: string;
  publisherNationality?: string;


  // ==========================
  // PRINTING PRESS DETAILS
  // ==========================
  printerName?: string;
  pressName?: string;
  pressAddress?: string;
  pressState?: string;
  pressDistrict?: string;
  pressCity?: string;
  pressPincode?: string;
  printerNationality?: string;

  //Place of Publication//

  placeAddress?: string;
  address?: string;
  placeDistrict?: string;
  placeState?: string;
  placePincode?: string;

  // ==========================
  // DAK SECTION
  // ==========================
  dakReceivedDate?: string;
  dakDiaryNo?: string;
  dakState?: string;
  dakDistrict?: string;
  dakSection?: string;
  dakProcessed?: string;
  dakForwardTo?: string;

  // ==========================
  // OWNERSHIP TRANSFER
  // ==========================

  transferInfo?: {
    transferDate?: string;
    approvedDate?: string;
    status?: string;
  };

  oldOwner?: {
    name?: string;
    type?: string;
    contact?: string;
    email?: string;
    address?: string;
  };

  newOwner?: {
    name?: string;
    type?: string;
    contact?: string;
    email?: string;
    address?: string;
    gstNumber?: string;
  };

  // ==========================
  // REVISION
  // ==========================
  revisions?: RevisionResponse[];
  revisionCount?: number;
  
}

export type Periodicity =
  | 'DAILY'
  | 'WEEKLY'
  | 'FORTNIGHTLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'ANNUALLY'
  | 'IRREGULAR';

export type FilingStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'PENDING';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  count: number;
}

export interface SearchRequest {
  id?: number;
  diaryNumber?: string;
  regNo?: string;
  titleName?: string;
  ownerName?: string;
  publisherName?: string;
  state?: string;
  district?: string;
  periodicity?: string;
  status?: string;
  fileNo?: string;
  sectionName?: string;
}

// ==========================
// REVISION INTERFACES
// ==========================

export interface RevisionRequest {
  filingId: number;
  titleName: string;
  regNo: string;
  reason: string;
  changes: string;
  revisionDate: string;
}

export interface RevisionResponse {
  id: number;
  titleName: string;
  regNo: string;
  reason: string;
  changes: string;
  revisionDate: string;
  createdAt: string;
}

export const PERIODICITY_OPTIONS: {
  value: Periodicity;
  label: string;
}[] = [
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'FORTNIGHTLY', label: 'Fortnightly' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'QUARTERLY', label: 'Quarterly' },
    { value: 'ANNUALLY', label: 'Annually' },
    { value: 'IRREGULAR', label: 'Irregular' }
  ];

