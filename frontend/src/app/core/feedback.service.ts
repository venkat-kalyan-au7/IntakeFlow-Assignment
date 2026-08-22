import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly messages = signal<ToastMessage[]>([]);
  private nextId = 1;

  success(title: string, message?: string) {
    this.show('success', title, message, 4000);
  }

  error(title: string, message?: string) {
    this.show('error', title, message, 6500);
  }

  info(title: string, message?: string) {
    this.show('info', title, message, 4500);
  }

  dismiss(id: number) {
    this.messages.update((items) => items.filter((item) => item.id !== id));
  }

  private show(kind: ToastKind, title: string, message: string | undefined, duration: number) {
    const toast = { id: this.nextId++, kind, title, message };
    this.messages.update((items) => [...items, toast].slice(-4));
    window.setTimeout(() => this.dismiss(toast.id), duration);
  }
}

@Injectable({ providedIn: 'root' })
export class LoadingService {
  readonly visible = signal(false);
  private active = 0;
  private showTimer?: number;
  private hideTimer?: number;
  private shownAt = 0;

  begin() {
    this.active++;
    if (this.active !== 1) return;
    window.clearTimeout(this.hideTimer);
    this.showTimer = window.setTimeout(() => {
      if (this.active > 0) {
        this.shownAt = Date.now();
        this.visible.set(true);
      }
    }, 180);
  }

  end() {
    this.active = Math.max(0, this.active - 1);
    if (this.active > 0) return;
    window.clearTimeout(this.showTimer);
    const remaining = Math.max(0, 240 - (Date.now() - this.shownAt));
    this.hideTimer = window.setTimeout(() => this.visible.set(false), remaining);
  }
}
