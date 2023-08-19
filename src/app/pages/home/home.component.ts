import { Component, Input, WritableSignal, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Address, NetworkType, RepositoryFactoryHttp, TransferTransaction } from 'symbol-sdk';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ZXingScannerModule],
  template: `
    <h2>アドレス入力 or QRコードスキャン</h2>
    <form #form="ngForm" (ngSubmit)="handleSubmit()">
      <label>
        ノードURL
        <input
          name="nodeUrl"
          [ngModel]="$nodeUrl()"
          (ngModelChange)="$nodeUrl.set($event)"
          type="text"
        />
      </label>
      <br>
      <label>
        アドレス
        <input
          name="address"
          [ngModel]="$address()"
          (ngModelChange)="$address.set($event)"
          type="text"
        />
      </label>
      <div>委任ハーベスター？</div>
      <div>{{ $isHarvester() ? "YES" : "NO" }}</div>
    </form>
    <a routerLink="/scan">QRコードをスキャン</a>
    <p>{{qr}}</p>
  `,
  styles: [
  ]
})
export class HomeComponent {
  @Input() qr: string = "";

  $nodeUrl = signal("https://symbol-main-1.nemtus.com:3001");
  $repositofyFactoryHttp = computed(() => new RepositoryFactoryHttp(this.$nodeUrl()));
  $accountRepository = computed(() => this.$repositofyFactoryHttp().createAccountRepository());
  $nodeRepository = computed(() => this.$repositofyFactoryHttp().createNodeRepository());
  $address: WritableSignal<string> = signal("");
  $linkedKey: WritableSignal<string> = signal("");
  $unlockedLinkedKeys: WritableSignal<string[]> = signal([]);
  $isHarvester = computed(() => {
    const linkedKey = this.$linkedKey();
    const unlockedLinkedKeys = this.$unlockedLinkedKeys();
    const isHarvester = unlockedLinkedKeys.includes(linkedKey);
    console.log({isHarvester});
    return isHarvester;
  });

  constructor() {
    effect(() => {
      this.handleQrReceived(this.qr);

      const nodeUrl = this.$nodeUrl();
      if (!nodeUrl) return;

      const address = this.$address();
      if (!nodeUrl || !address) return;

      firstValueFrom(this.$accountRepository().getAccountInfo(Address.createFromRawAddress(address))).then((accountInfo) => {
        console.log({accountInfo})
        this.$linkedKey.set(accountInfo.supplementalPublicKeys.linked?.publicKey ?? "")
      }).catch((error) => {
        console.error(error);
        this.$linkedKey.set("");
      });

      this.$nodeRepository().getUnlockedAccount().subscribe((unlockedLinkedKeys) => {
        console.log({unlockedLinkedKeys})
        this.$unlockedLinkedKeys.set(unlockedLinkedKeys)
      });

      if (this.$isHarvester()) window.alert("委任ハーベストありがとうございます！");
    }, { allowSignalWrites: true });
  }

  handleSubmit() {
    console.log("handleSubmit")
  }

  handleQrReceived(qr: string) {
    console.log({qr});

    // AEM+のアドレスQRコード=アドレス文字列
    try {
      const address = Address.createFromRawAddress(qr);
      this.$address.set(address.plain());
      return;
    } catch (error) {
      console.error(error);
    }

    // Symbol QR Library (AddressQR, ConactQR)
    try {
      const qrJson = JSON.parse(qr);
      console.log({qrJson});
      const publicKeyString = qrJson.data?.publicKey;
      const addressString = qrJson.data?.address;
      if (!publicKeyString && !addressString) throw new Error("This QR Code is not AddressQR or ConactQR");
      if (publicKeyString) {
        const address = Address.createFromPublicKey(publicKeyString, NetworkType.MAIN_NET);
        this.$address.update((_) => address.plain());
        return;
      }
      if (addressString) {
        const address = Address.createFromRawAddress(addressString);
        this.$address.update((_) => address.plain());
        return;
      }
    } catch (error) {
      console.error(error);
    }

    // Symbol QR Library (TransactionQR)
    try {
      const qrJson = JSON.parse(qr);
      console.log({qrJson});
      const payload = qrJson.data?.payload;
      if (!payload) throw new Error("This QR Code is not TransactionQR");
      const transferTx = TransferTransaction.createFromPayload(payload) as TransferTransaction;
      const address = transferTx.recipientAddress;
      this.$address.update((_) => address.plain());
      return;
    } catch (error) {
      console.error(error);
    }
  }
}
