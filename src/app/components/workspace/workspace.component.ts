import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Subscription } from 'rxjs';
import { switchMap, finalize } from 'rxjs/operators';
import { DocumentService, ChatMessage, ChatResponse } from 'src/app/core/services/document.service';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss'],  // ← Fixed: was .css
  standalone:false
})
export class WorkspaceComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  currentDocId: number | null = null;
  currentDocName: string = '';
  selectedFile: File | null = null;

  isUploading = false;
  isIngesting = false;
  isReady = false;
  isLoadingAnswer = false;
  isLoadingHistory = false;

  messages: ChatMessage[] = [];
  errorMessage = '';

  private shouldScroll = false;
  private subscriptions = new Subscription();

  constructor(private documentService: DocumentService) {}

  ngOnInit(): void {
    // React when sidebar selects a document (or resets to null)
    const sub = this.documentService.currentDoc$.subscribe(id => {
      this.resetState();

      if (id) {
        this.currentDocId = id;
        this.loadHistory(id);
      }
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  // -------------------------
  // STATE
  // -------------------------

  private resetState(): void {
    this.currentDocId = null;
    this.currentDocName = '';
    this.selectedFile = null;
    this.isUploading = false;
    this.isIngesting = false;
    this.isReady = false;
    this.isLoadingAnswer = false;
    this.isLoadingHistory = false;
    this.messages = [];
    this.errorMessage = '';
  }

  // -------------------------
  // FILE UPLOAD + INGEST
  // -------------------------

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input?.files?.[0] || null;
    //  Auto-trigger upload immediately after file is picked
    if (this.selectedFile) {
    this.uploadAndIngest();
  }

  // Reset so same file can be re-selected
  input.value = '';
  }

  uploadAndIngest(): void {
  if (!this.selectedFile) return;

  this.isUploading = true;
  this.errorMessage = '';

  this.documentService.uploadDocument(this.selectedFile).pipe(
    switchMap((uploadRes: any) => {
      this.currentDocId = uploadRes.data.id;
      this.currentDocName = uploadRes.data.filename || this.selectedFile!.name;
      this.documentService.setCurrentDocument(this.currentDocId!);

      this.isUploading = false;
      this.isIngesting = true;

      // ✅ Trigger sidebar refresh immediately after upload
      this.documentService.triggerDocumentRefresh();

      return this.documentService.ingestDocument(this.currentDocId!);
    }),
    finalize(() => {
      this.isUploading = false;
      this.isIngesting = false;
    })
      ).subscribe({
        next: () => {
          this.isReady = true;
          this.messages = [];
        },
        error: (err) => {
          console.error('Upload/Ingest failed:', err);
          this.errorMessage = err?.error?.message || 'Upload or processing failed. Please try again.';
        }
      });
    }
  // uploadAndIngest(): void {
  //   if (!this.selectedFile) return;

  //   this.isUploading = true;
  //   this.errorMessage = '';

  //   // Fixed: flattened nested subscribe using switchMap
  //   this.documentService.uploadDocument(this.selectedFile).pipe(
  //     switchMap((uploadRes: any) => {
  //       this.currentDocId = uploadRes.data.id;
  //       this.currentDocName = uploadRes.data.filename || this.selectedFile!.name;
  //       this.documentService.setCurrentDocument(this.currentDocId!);

  //       this.isUploading = false;
  //       this.isIngesting = true;

  //       return this.documentService.ingestDocument(this.currentDocId!);
  //     }),
  //     finalize(() => {
  //       this.isUploading = false;
  //       this.isIngesting = false;
  //     })
  //   ).subscribe({
  //     next: () => {
  //       this.isReady = true;
  //       this.messages = [];
  //     },
  //     error: (err) => {
  //       console.error('Upload/Ingest failed:', err);
  //       this.errorMessage = err?.error?.message || 'Upload or processing failed. Please try again.';
  //     }
  //   });
  // }

  // -------------------------
  // CHAT HISTORY
  // -------------------------

  loadHistory(id: number): void {
    this.isLoadingHistory = true;
    this.errorMessage = '';

    this.documentService.getHistory(id).subscribe({
      next: (res) => {
        this.currentDocName = res.document_name;
        this.messages = res.messages;
        this.isReady = true;
        this.isLoadingHistory = false;
        this.shouldScroll = true;
      },
      error: (err) => {
        console.error('Failed to load history:', err);
        this.errorMessage = 'Failed to load chat history';
        this.isLoadingHistory = false;
      }
    });
  }

  // -------------------------
  // SEND MESSAGE
  // -------------------------

  sendMessage(input: HTMLInputElement): void {
    const text = input.value.trim();
    if (!text || !this.currentDocId) return;

    // Add user message to UI immediately
    this.messages.push({
      role: 'user',
      content: text
    } as ChatMessage);

    input.value = '';
    this.isLoadingAnswer = true;
    this.shouldScroll = true;
    this.errorMessage = '';

    // Fixed: uses updated ChatRequest object signature
    this.documentService.askQuestion({
      question: text,
      document_id: this.currentDocId,
      num_results: 5,
      strategy: 'auto'
    }).subscribe({
      next: (res: ChatResponse) => {
        this.messages.push({
          role: 'assistant',
          content: res.answer
        } as ChatMessage);
        this.isLoadingAnswer = false;
        this.shouldScroll = true;
      },
      error: (err) => {
        console.error('Chat failed:', err);
        this.messages.push({
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.'
        } as ChatMessage);
        this.isLoadingAnswer = false;
        this.shouldScroll = true;
      }
    });
  }

  onKeyDown(event: KeyboardEvent, input: HTMLInputElement): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage(input);
    }
  }

  // -------------------------
  // HELPERS
  // -------------------------

  clearChat(): void {
    if (!this.currentDocId) return;

    this.documentService.clearHistory(this.currentDocId).subscribe({
      next: () => {
        this.messages = [];
      },
      error: (err) => {
        console.error('Failed to clear history:', err);
        this.errorMessage = 'Failed to clear chat history';
      }
    });
  }

  private scrollToBottom(): void {
    try {
      const el = this.chatContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch (err) {}
  }
}