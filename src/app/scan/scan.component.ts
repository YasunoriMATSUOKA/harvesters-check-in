import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { Router } from '@angular/router';

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule],
  template: `
    <zxing-scanner
      (scanSuccess)="handleScanSuccess($event)"
    ></zxing-scanner>
  `,
  styles: [
  ]
})
export class ScanComponent {
  router = inject(Router);

  handleScanSuccess($event: any) {
    this.router.navigate(['home', {
      qr: $event
    }]);
  }
}
