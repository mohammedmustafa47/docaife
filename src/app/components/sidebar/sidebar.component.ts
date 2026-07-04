import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription,Subject  } from 'rxjs';
import { DocumentService, DocumentDetail } from 'src/app/core/services/document.service';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone:false
})
export class SidebarComponent implements OnInit, OnDestroy {

  documents: DocumentDetail[] = [];
  activeDocId: number | null = null;
  isLoading = false;
  errorMessage = '';
  profile: any = null;
  showProfileModal = false;
  isLoadingProfile = false;
  isLoggingOut = false;

  private destroy$ = new Subject<void>();

  private subscriptions = new Subscription();

  

  constructor(private documentService: DocumentService, private authService: AuthService,
    private router: Router
  ) {}

  // ngOnInit(): void {
  //   this.loadDocuments();

  //   // Track which document is currently active
  //   const sub = this.documentService.currentDoc$.subscribe(id => {
  //     this.activeDocId = id;
  //   });
  //   this.subscriptions.add(sub);
  // }
  ngOnInit(): void {
  // Initial load
  this.authService.profile$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(profile => {
      this.profile = profile;
      console.log('👤 Profile in sidebar:', this.profile);
    });

  this.loadDocuments();

  // ✅ Listen for refresh signals from workspace uploads
  this.documentService.documentListRefresh$
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.loadDocuments(); // Auto-refresh when workspace uploads a doc
        });
    }

  // ngOnDestroy(): void {
  //   this.subscriptions.unsubscribe();
  // }
  ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
  this.subscriptions.unsubscribe();
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.documentService.listDocuments().subscribe({
      next: (res) => {
        this.documents = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load documents:', err);
        this.errorMessage = 'Failed to load documents';
        this.isLoading = false;
      }
    });
  }

  openDocument(doc: DocumentDetail): void {
    this.documentService.setCurrentDocument(doc.id);
  }

  onNewChat(): void {
    // Reset current document — your chat component should 
    // react to this and show the upload/new chat screen
    this.documentService.setCurrentDocument(null);
  }

  // onFileSelected(event: Event): void {
  //   const input = event.target as HTMLInputElement;
  //   const file = input?.files?.[0];
  //   if (!file) return;

  //   this.documentService.uploadDocument(file).subscribe({
  //     next: () => {
  //       this.loadDocuments(); // Refresh list after upload
  //     },
  //     error: (err) => {
  //       console.error('Upload failed:', err);
  //       this.errorMessage = 'Upload failed';
  //     }
  //   });

    // Reset input so same file can be re-selected
  //   input.value = '';
  // }

  formatTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  openProfile(): void {
    this.showProfileModal = true;
    this.isLoadingProfile = true;

    // ✅ Refresh profile from API (optional - for latest data)
    this.authService.getProfile().subscribe({
      next: (res) => {
        this.profile = res.data || res;
        this.isLoadingProfile = false;
      },
      error: (err) => {
        console.error('Failed to load profile:', err);
        this.isLoadingProfile = false;
      }
    });
  }

  closeProfile(): void {
  this.showProfileModal = false;
}

onLogout(): void {
    this.isLoggingOut = true;

    this.authService.logout().subscribe({
      next: () => {
        this.isLoggingOut = false;
        this.showProfileModal = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout failed:', err);
        this.isLoggingOut = false;
      }
    });
  }


}



// import { Component, OnInit } from '@angular/core';

// @Component({
//   selector: 'app-sidebar',
//   templateUrl: './sidebar.component.html',
//   styleUrls: ['./sidebar.component.scss'],
// })
// export class SidebarComponent  implements OnInit {

//   constructor() { }

//   ngOnInit() {}

// }
