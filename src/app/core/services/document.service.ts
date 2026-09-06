import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

// -------------------------
// INTERFACES
// -------------------------
export interface DocumentDetail {
  id: number;
  filename: string;
  uploaded_at: string;
  is_ingested: boolean;
  file_size: number;
  user: { id: number; username: string; email: string };
  message_count: number;
  last_message: {
    content: string;
    role: string;
    timestamp: string;
  } | null;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  intent: string;
  timestamp: string;
}

export interface ChatHistoryResponse {
  user_id: number;
  user_email: string;
  document_id: number;
  document_name: string;
  messages: ChatMessage[];
  count: number;
}

export interface ChatResponse {
  answer: string;
  intent: string;
  document_id: number | null;
}

export interface SearchResult {
  question: string;
  results: any[];
}

export interface ChatRequest {
  question: string;
  document_id?: number;
  num_results?: number;
  strategy?: 'auto' | 'hybrid' | 'semantic' | 'heading';
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  private baseUrl = 'http://127.0.0.1:8000/api';

  private documentListRefresh = new Subject<void>();

  documentListRefresh$ = this.documentListRefresh.asObservable();

  triggerDocumentRefresh(): void {
  this.documentListRefresh.next();
  }

  // Shared state
  private currentDocSubject = new BehaviorSubject<number | null>(null);
  currentDoc$ = this.currentDocSubject.asObservable();

  constructor(private http: HttpClient) {}

  // -------------------------
  // STATE MANAGEMENT
  // -------------------------
  setCurrentDocument(id: number | null): void {
    this.currentDocSubject.next(id);
  }

  // -------------------------
  // DOCUMENT CRUD
  // -------------------------

  uploadDocument(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/documents/upload/`, formData);
  }

  listDocuments(): Observable<DocumentDetail[]> {
    return this.http.get<DocumentDetail[]>(`${this.baseUrl}/documents/list/`);
  }

  /** ❌ Was missing — maps to DocumentDetailView */
  getDocument(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/documents/${id}/`);
  }

  deleteDocument(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/documents/${id}/delete/`);
  }

  // -------------------------
  // INGESTION
  // -------------------------

  ingestDocument(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/documents/${id}/ingest/`, {});
  }

  // -------------------------
  // SEARCH — ❌ Both were missing
  // -------------------------

  /** Search across ALL user documents */
  searchDocuments(
    question: string,
    numResults: number = 5,
    strategy: 'auto' | 'hybrid' | 'semantic' | 'heading' = 'auto'
  ): Observable<SearchResult> {
    return this.http.post<SearchResult>(`${this.baseUrl}/documents/search/`, {
      question,
      num_results: numResults,
      strategy
    });
  }

  /** Search within a SPECIFIC document */
  searchInDocument(
    id: number,
    question: string,
    numResults: number = 5
  ): Observable<any> {
    return this.http.post(`${this.baseUrl}/documents/${id}/search/`, {
      question,
      num_results: numResults
    });
  }

  // -------------------------
  // HEADINGS — ❌ Was missing
  // -------------------------

  /** Get all headings, optionally filtered by document */
  getHeadings(documentId?: number): Observable<{ headings: any[]; count: number }> {
    let params = new HttpParams();
    if (documentId) {
      params = params.set('document_id', documentId.toString());
    }
    return this.http.get<{ headings: any[]; count: number }>(
      `${this.baseUrl}/documents/headings/`,
      { params }
    );
  }

  // -------------------------
  // CHAT HISTORY
  // -------------------------

  getHistory(id: number): Observable<ChatHistoryResponse> {
    return this.http.get<ChatHistoryResponse>(
      `${this.baseUrl}/documents/${id}/history/`
    );
  }

  clearHistory(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/documents/${id}/history/clear/`);
  }

  // -------------------------
  // CHAT — ⚠️ Updated to support all params
  // -------------------------

  askQuestion(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.baseUrl}/chat/`, {
      question: request.question,
      document_id: request.document_id,
      num_results: request.num_results ?? 5,
      strategy: request.strategy ?? 'auto'
    });
  }
}