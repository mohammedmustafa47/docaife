import { Component, OnInit } from '@angular/core';
import { DocumentService } from 'src/app/core/services/document.service';
import { switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone:false
})
export class DashboardPage implements OnInit {

  isUploading = false;
  isIngesting = false;
  isDocumentReady = false;
  documentId: number | null = null;

  selectedFile: File | null = null;

  constructor(private documentService: DocumentService) {}
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  uploadDocument() {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.isDocumentReady = false;

    this.documentService.uploadDocument(this.selectedFile).pipe(

      tap((res: any) => {
        this.documentId = res.data.id;
        this.isUploading = false;
        this.isIngesting = true;
      }),

      switchMap((res: any) => 
        this.documentService.ingestDocument(res.data.id)
      )

    ).subscribe({
      next: () => {
        this.isIngesting = false;
        this.isDocumentReady = true;
      },
      error: () => {
        this.isUploading = false;
        this.isIngesting = false;
      }
    });
  }

  sendMessage() {
    if (!this.isDocumentReady) return;
    console.log("Ready to send question for doc:", this.documentId);
  }
}