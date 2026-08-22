import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ApiService } from '../../core/api.service';
import { FieldDefinition, FieldType, FormDefinition } from '../../core/models';
import { StatusBadge } from '../../shared/status-badge';
@Component({
  selector: 'app-form-studio',
  imports: [FormsModule, CdkDropList, CdkDrag, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <main class="page page--studio">
    <header class="page-header">
      <div>
        <span class="eyebrow">Workspace configuration</span>
        <h1>Form Studio</h1>
        <p>Design a structured intake experience without writing code.</p>
      </div>
      <button class="button button--secondary" (click)="newForm()">New form</button>
    </header>
    <section class="studio">
      <aside class="studio-library">
        <div class="studio-title">
          <span>Forms</span><small>{{ forms().length }}</small>
        </div>
        @for (form of forms(); track form.id) {
          <button
            class="form-list-item"
            [class.active]="selectedForm()?.id === form.id"
            (click)="load(form)"
          >
            <span class="form-list-item__icon"></span
            ><span
              ><strong>{{ form.title }}</strong
              ><small>Version {{ form.version }}</small></span
            ><app-status-badge [status]="form.status" />
          </button>
        }
        <div class="studio-title studio-title--fields"><span>Field library</span></div>
        <p class="helper">Add a field, then refine it in the properties panel.</p>
        <div class="field-palette">
          <button (click)="add('TEXT')">
            <span class="palette-icon">Aa</span><span>Text</span></button
          ><button (click)="add('NUMBER')">
            <span class="palette-icon">#</span><span>Number</span></button
          ><button (click)="add('DROPDOWN')">
            <span class="palette-icon">⌄</span><span>Dropdown</span></button
          ><button (click)="add('DATE')">
            <span class="palette-icon calendar-icon"></span><span>Date</span>
          </button>
        </div>
      </aside>
      <section class="studio-canvas">
        <header>
          <div>
            <input
              class="title-input"
              [(ngModel)]="title"
              aria-label="Form title"
              placeholder="Untitled form"
            /><input
              class="description-input"
              [(ngModel)]="description"
              aria-label="Form description"
              placeholder="Describe what this form helps your team collect"
            />
          </div>
          <div class="studio-actions">
            <span class="save-state">{{ message() }}</span
            ><button class="button button--secondary" (click)="save()" [disabled]="saving()">
              Save draft</button
            ><button
              class="button button--primary"
              (click)="publish()"
              [disabled]="saving() || !selectedForm()"
            >
              Publish
            </button>
          </div>
        </header>
        <div class="canvas-label">
          <span>Form structure</span><small>Drag fields to reorder</small>
        </div>
        <div cdkDropList class="field-canvas" (cdkDropListDropped)="drop($event)">
          @for (field of fields; track field.key; let i = $index) {
            <article
              cdkDrag
              class="field-block"
              [class.selected]="selectedIndex() === i"
              (click)="selectedIndex.set(i)"
            >
              <span class="drag-handle" cdkDragHandle aria-label="Drag field"
                ><i></i><i></i><i></i
              ></span>
              <div>
                <span class="field-type">{{ field.type }}</span
                ><strong
                  >{{ field.label || 'Untitled field' }}
                  @if (field.required) {
                    <em>*</em>
                  }</strong
                ><small>{{ field.description || 'No supporting text' }}</small>
              </div>
              <button
                class="icon-button remove-button"
                (click)="remove(i); $event.stopPropagation()"
                aria-label="Remove field"
              >
                ×
              </button>
            </article>
          } @empty {
            <div class="canvas-empty">
              <span class="canvas-empty__icon">+</span>
              <h3>Start with a field</h3>
              <p>Choose a field type from the library to shape this intake form.</p>
            </div>
          }
        </div>
      </section>
      <aside class="properties">
        <div class="properties-tabs">
          <button class="active">Properties</button><button>Preview</button>
        </div>
        @if (activeField(); as field) {
          <div class="properties-body">
            <span class="eyebrow">Field {{ selectedIndex() + 1 }}</span>
            <h2>{{ field.label || 'Untitled field' }}</h2>
            <label>Label<input [(ngModel)]="field.label" (ngModelChange)="syncKey(field)" /></label
            ><label
              >Supporting text<textarea
                rows="3"
                [(ngModel)]="field.description"
                placeholder="Give people useful context"
              ></textarea></label
            ><label
              >Field type<select [(ngModel)]="field.type">
                <option value="TEXT">Text</option>
                <option value="NUMBER">Number</option>
                <option value="DROPDOWN">Dropdown</option>
                <option value="DATE">Date</option>
              </select></label
            ><label class="toggle-row"
              ><span
                ><strong>Required field</strong><small>People must complete this field</small></span
              ><input type="checkbox" role="switch" [(ngModel)]="field.required"
            /></label>
            @if (field.type === 'DROPDOWN') {
              <div class="option-editor">
                <label>Options</label>
                @for (option of field.options; track $index; let i = $index) {
                  <div>
                    <span class="option-order">{{ i + 1 }}</span
                    ><input [(ngModel)]="field.options[i]" /><button
                      class="icon-button"
                      (click)="field.options.splice(i, 1)"
                    >
                      ×
                    </button>
                  </div>
                }
                <button class="text-button" (click)="field.options.push('New option')">
                  + Add option
                </button>
              </div>
            }
            <div class="preview-card">
              <span>Live preview</span
              ><label
                >{{ field.label }}
                @if (field.required) {
                  <em>*</em>
                }
                @switch (field.type) {
                  @case ('DROPDOWN') {
                    <select disabled>
                      <option>Select an option</option>
                    </select>
                  }
                  @case ('DATE') {
                    <input type="date" disabled />
                  }
                  @case ('NUMBER') {
                    <input type="number" placeholder="Enter a number" disabled />
                  }
                  @default {
                    <input placeholder="Enter a response" disabled />
                  }
                }
                <small>{{ field.description }}</small></label
              >
            </div>
          </div>
        } @else {
          <div class="properties-empty">
            <span></span>
            <h3>Select a field</h3>
            <p>Field settings and a live preview will appear here.</p>
          </div>
        }
      </aside>
    </section>
  </main>`,
})
export class FormStudioComponent {
  private api = inject(ApiService);
  forms = signal<FormDefinition[]>([]);
  selectedForm = signal<FormDefinition | null>(null);
  selectedIndex = signal(-1);
  saving = signal(false);
  message = signal('');
  title = '';
  description = '';
  fields: FieldDefinition[] = [];
  constructor() {
    this.refresh();
  }
  activeField() {
    return this.fields[this.selectedIndex()] ?? null;
  }
  refresh() {
    this.api.forms().subscribe((x) => this.forms.set(x));
  }
  newForm() {
    this.selectedForm.set(null);
    this.title = 'New intake form';
    this.description = '';
    this.fields = [];
    this.selectedIndex.set(-1);
    this.message.set('New draft');
  }
  load(form: FormDefinition) {
    this.selectedForm.set(form);
    this.title = form.title;
    this.description = form.description ?? '';
    this.fields = form.fields.map((f) => ({ ...f, options: [...f.options] }));
    this.selectedIndex.set(this.fields.length ? 0 : -1);
    this.message.set(form.status === 'PUBLISHED' ? 'Published version' : 'Draft');
  }
  add(type: FieldType) {
    const index = this.fields.length + 1;
    this.fields.push({
      key: `field_${index}`,
      label: `${type.charAt(0) + type.slice(1).toLowerCase()} field`,
      description: '',
      type,
      required: false,
      options: type === 'DROPDOWN' ? ['Option one', 'Option two'] : [],
    });
    this.selectedIndex.set(this.fields.length - 1);
  }
  remove(i: number) {
    this.fields.splice(i, 1);
    this.selectedIndex.set(Math.min(i, this.fields.length - 1));
  }
  drop(e: CdkDragDrop<FieldDefinition[]>) {
    moveItemInArray(this.fields, e.previousIndex, e.currentIndex);
    this.selectedIndex.set(e.currentIndex);
  }
  syncKey(field: FieldDefinition) {
    if (!field.id)
      field.key =
        field.label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_|_$/g, '') || field.key;
  }
  body() {
    return {
      title: this.title.trim(),
      description: this.description.trim(),
      fields: this.fields.map((f) => ({
        key: f.key,
        label: f.label,
        description: f.description,
        type: f.type,
        required: f.required,
        options: f.options,
      })),
    };
  }
  save() {
    if (!this.title.trim() || !this.fields.length) {
      this.message.set('Add a title and at least one field');
      return;
    }
    this.saving.set(true);
    const request = this.selectedForm()
      ? this.api.updateForm(this.selectedForm()!.id, this.body())
      : this.api.createForm(this.body());
    request.subscribe({
      next: (f) => {
        this.selectedForm.set(f);
        this.saving.set(false);
        this.message.set('Draft saved');
        this.refresh();
      },
      error: (e) => {
        this.saving.set(false);
        this.message.set(e.error?.detail ?? 'Could not save');
      },
    });
  }
  publish() {
    const selected = this.selectedForm();
    if (!selected) return;
    const proceed = () =>
      this.api.publishForm(selected.id).subscribe({
        next: (f) => {
          this.load(f);
          this.saving.set(false);
          this.message.set('Published');
          this.refresh();
        },
        error: (e) => {
          this.saving.set(false);
          this.message.set(e.error?.detail ?? 'Could not publish');
        },
      });
    this.saving.set(true);
    this.api.updateForm(selected.id, this.body()).subscribe({
      next: () => proceed(),
      error: (e) => {
        this.saving.set(false);
        this.message.set(e.error?.detail ?? 'Could not publish');
      },
    });
  }
}
