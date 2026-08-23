import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/feedback.service';
import { FieldDefinition, FieldType, FormDefinition } from '../../core/models';
import { StatusBadge } from '../../shared/status-badge';
@Component({
  selector: 'app-form-studio',
  imports: [FormsModule, CdkDropList, CdkDrag, CdkTrapFocus, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <main class="page page--studio">
    <header class="page-header">
      <div>
        <span class="eyebrow">Workspace configuration</span>
        <h1>Form Studio</h1>
        <p>Design a structured intake experience without writing code.</p>
      </div>
      <button class="button button--primary create-form-button" type="button" (click)="newForm()">
        <span aria-hidden="true">+</span> Create form
      </button>
    </header>
    <section class="studio">
      <aside class="studio-library">
        <div class="studio-title">
          <span>Forms</span><small>{{ forms().length }}</small>
        </div>
        <p class="helper form-picker-help">Select a form to open it in the workspace.</p>
        @if (loadingForms()) {
          <p class="helper">Loading forms…</p>
        } @else if (formsError()) {
          <div class="compact-error" role="alert">
            <span>{{ formsError() }}</span>
            <button class="text-button" (click)="refresh()">Try again</button>
          </div>
        } @else {
          @for (form of forms(); track form.id) {
            <button
              type="button"
              class="form-list-item"
              [class.active]="selectedForm()?.id === form.id"
              (click)="load(form)"
              [attr.aria-label]="'Open ' + form.title + ', version ' + form.version + ', ' + form.status.toLowerCase()"
            >
              <span class="form-list-item__icon"></span
              ><span
                ><strong>{{ form.title }}</strong
                ><small>Version {{ form.version }}</small></span
              ><app-status-badge [status]="form.status" /><span class="form-list-item__chevron" aria-hidden="true">›</span>
            </button>
          } @empty {
            <p class="helper">No forms have been created yet.</p>
          }
        }
        <div class="studio-title studio-title--fields"><span>Field library</span></div>
        <p class="helper">
          {{ canEdit() ? 'Choose a field type to add it to this form.' : 'Published versions are read-only. Create an editable draft to add fields.' }}
        </p>
        <div class="field-palette">
          <button type="button" (click)="add('TEXT')" [disabled]="!canEdit()">
            <span class="palette-icon">Aa</span><span>Text</span></button
          ><button type="button" (click)="add('NUMBER')" [disabled]="!canEdit()">
            <span class="palette-icon">#</span><span>Number</span></button
          ><button type="button" (click)="add('DROPDOWN')" [disabled]="!canEdit()">
            <span class="palette-icon">⌄</span><span>Dropdown</span></button
          ><button type="button" (click)="add('DATE')" [disabled]="!canEdit()">
            <span class="palette-icon calendar-icon"></span><span>Date</span>
          </button>
        </div>
      </aside>
      <section class="studio-canvas">
        <header>
          <div class="form-identity">
            <div class="form-mode" [class.form-mode--published]="isPublished()">
              <strong>{{ modeTitle() }}</strong>
              <span>{{ modeDescription() }}</span>
            </div>
            <input
              class="title-input"
              [(ngModel)]="title"
              aria-label="Form title"
              placeholder="Enter form title"
              [readOnly]="!canEdit()"
            /><input
              class="description-input"
              [(ngModel)]="description"
              aria-label="Form description"
              placeholder="Describe what this form helps your team collect"
              [readOnly]="!canEdit()"
            />
          </div>
          <div class="studio-actions">
            <span class="save-state">{{ message() }}</span>
            @if (isPublished()) {
              <button
                class="button button--secondary button--danger"
                type="button"
                (click)="archiveOpen.set(true)"
                [disabled]="saving()"
              >
                Archive
              </button>
              <button class="button button--primary" type="button" (click)="createRevision()" [disabled]="saving()">
                {{ saving() ? 'Creating draft…' : 'Create editable draft' }}
              </button>
            } @else {
              @if (selectedForm()) {
                <button
                  class="button button--secondary button--danger"
                  type="button"
                  (click)="archiveOpen.set(true)"
                  [disabled]="saving()"
                >
                  Archive
                </button>
              }
              <button class="button button--secondary" type="button" (click)="save()" [disabled]="saving()">
                {{ saving() ? 'Saving…' : 'Save draft' }}</button
              ><button
                class="button button--primary"
                type="button"
                (click)="publish()"
                [disabled]="saving() || !selectedForm()"
              >
                {{ selectedForm() ? 'Publish draft' : 'Save draft first' }}
              </button>
            }
          </div>
        </header>
        <div class="canvas-label">
          <span>Form structure</span><small>Drag fields to reorder</small>
        </div>
        <div cdkDropList class="field-canvas" [class.is-readonly]="!canEdit()" (cdkDropListDropped)="drop($event)">
          @for (field of fields; track field.key; let i = $index) {
            <article
              cdkDrag
              [cdkDragDisabled]="!canEdit()"
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
              @if (canEdit()) {
                <button
                  class="icon-button remove-button"
                  type="button"
                  (click)="remove(i); $event.stopPropagation()"
                  aria-label="Remove field"
                >
                  ×
                </button>
              } @else {
                <span class="field-block__open" aria-hidden="true">›</span>
              }
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
      <aside class="properties" [class.is-readonly]="!canEdit()">
        <div class="properties-heading">
          <strong>Field settings</strong><small>{{ canEdit() ? 'Editable' : 'Read only' }}</small>
        </div>
        @if (activeField(); as field) {
          <div class="properties-body">
            <span class="eyebrow">Field {{ selectedIndex() + 1 }}</span>
            <h2>{{ field.label || 'Untitled field' }}</h2>
            <label>Label<input [(ngModel)]="field.label" [readOnly]="!canEdit()" (ngModelChange)="syncKey(field)" /></label
            ><label
              >Supporting text<textarea
                rows="3"
                [(ngModel)]="field.description"
                placeholder="Give people useful context"
                [readOnly]="!canEdit()"
              ></textarea></label
            ><label
              >Field type<select
                [(ngModel)]="field.type"
                (ngModelChange)="changeType(field, $event)"
                [disabled]="!canEdit()"
              >
                <option value="TEXT">Text</option>
                <option value="NUMBER">Number</option>
                <option value="DROPDOWN">Dropdown</option>
                <option value="DATE">Date</option>
              </select></label
            ><label class="toggle-row"
              ><span
                ><strong>Required field</strong><small>People must complete this field</small></span
              ><input type="checkbox" role="switch" [(ngModel)]="field.required" [disabled]="!canEdit()"
            /></label>
            @if (field.type === 'DROPDOWN') {
              <div class="option-editor">
                <label>Options</label>
                @for (option of field.options; track $index; let i = $index) {
                  <div>
                    <span class="option-order">{{ i + 1 }}</span
                    ><input
                      [(ngModel)]="field.options[i]"
                      [readOnly]="!canEdit()"
                      [attr.aria-label]="'Option ' + (i + 1)"
                    />
                    @if (canEdit()) {
                      <button
                        class="icon-button"
                        type="button"
                        (click)="field.options.splice(i, 1)"
                        [disabled]="field.options.length === 1"
                        [attr.aria-label]="'Remove option ' + (i + 1)"
                      >
                        ×
                      </button>
                    }
                  </div>
                }
                @if (canEdit()) {
                  <button class="text-button" type="button" (click)="field.options.push('New option')">
                    + Add option
                  </button>
                }
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
    @if (archiveOpen() && selectedForm(); as form) {
      <div class="modal-backdrop" (click)="archiveOpen.set(false)">
        <section
          class="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="archive-title"
          cdkTrapFocus
          [cdkTrapFocusAutoCapture]="true"
          (click)="$event.stopPropagation()"
        >
          <span class="modal__mark">!</span>
          <h2 id="archive-title">Archive form?</h2>
          <p>
            {{ form.title }} will no longer accept new requests. Existing submissions and history
            will remain available.
          </p>
          <footer>
            <button class="button button--secondary" (click)="archiveOpen.set(false)">
              Cancel
            </button>
            <button class="button button--danger-solid" (click)="archive()" [disabled]="saving()">
              {{ saving() ? 'Archiving…' : 'Archive form' }}
            </button>
          </footer>
        </section>
      </div>
    }
  </main>`,
})
export class FormStudioComponent {
  private api = inject(ApiService);
  private toasts = inject(ToastService);
  private route = inject(ActivatedRoute);
  private baseline = '';
  forms = signal<FormDefinition[]>([]);
  loadingForms = signal(true);
  formsError = signal('');
  selectedForm = signal<FormDefinition | null>(null);
  newFormActive = signal(false);
  selectedIndex = signal(-1);
  saving = signal(false);
  archiveOpen = signal(false);
  message = signal('');
  title = '';
  description = '';
  fields: FieldDefinition[] = [];
  constructor() {
    this.captureBaseline();
    if (this.route.snapshot.queryParamMap.get('new') === 'true') this.newForm(false);
    this.refresh();
  }
  activeField() {
    return this.fields[this.selectedIndex()] ?? null;
  }
  canEdit() {
    return !this.selectedForm() || this.selectedForm()?.status === 'DRAFT';
  }
  isPublished() {
    return this.selectedForm()?.status === 'PUBLISHED';
  }
  modeTitle() {
    const form = this.selectedForm();
    if (!form) return 'New form · Not saved yet';
    return form.status === 'PUBLISHED'
      ? `Published · Version ${form.version}`
      : `Editable draft · Version ${form.version}`;
  }
  modeDescription() {
    const form = this.selectedForm();
    if (!form) return 'Add a title and fields, then save the first draft.';
    return form.status === 'PUBLISHED'
      ? 'This live version is locked to protect existing requests. Create a draft before changing it.'
      : 'Changes stay private until you publish this draft.';
  }
  refresh() {
    this.loadingForms.set(true);
    this.formsError.set('');
    this.api.forms().subscribe({
      next: (x) => {
        this.forms.set(x);
        this.loadingForms.set(false);
        if (!this.selectedForm() && !this.newFormActive()) {
          if (x.length) this.load(x[0], false);
          else this.newForm(false);
        }
      },
      error: () => {
        this.loadingForms.set(false);
        this.formsError.set('Could not load forms.');
      },
    });
  }
  newForm(confirmDiscard = true) {
    if (confirmDiscard && !this.confirmDiscard()) return;
    this.selectedForm.set(null);
    this.newFormActive.set(true);
    this.title = '';
    this.description = '';
    this.fields = [];
    this.selectedIndex.set(-1);
    this.message.set('');
    this.captureBaseline();
  }
  load(form: FormDefinition, confirmDiscard = true) {
    if (confirmDiscard && this.selectedForm()?.id !== form.id && !this.confirmDiscard()) return;
    this.selectedForm.set(form);
    this.newFormActive.set(false);
    this.title = form.title;
    this.description = form.description ?? '';
    this.fields = form.fields.map((f) => ({ ...f, options: [...f.options] }));
    this.selectedIndex.set(this.fields.length ? 0 : -1);
    this.message.set('');
    this.captureBaseline();
  }
  add(type: FieldType) {
    if (!this.canEdit()) return;
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
    if (!this.canEdit()) return;
    this.fields.splice(i, 1);
    this.selectedIndex.set(Math.min(i, this.fields.length - 1));
  }
  drop(e: CdkDragDrop<FieldDefinition[]>) {
    if (!this.canEdit()) return;
    moveItemInArray(this.fields, e.previousIndex, e.currentIndex);
    this.selectedIndex.set(e.currentIndex);
  }
  syncKey(field: FieldDefinition) {
    if (!this.canEdit()) return;
    if (!field.id)
      field.key =
        field.label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_|_$/g, '') || field.key;
  }
  changeType(field: FieldDefinition, type: FieldType) {
    if (!this.canEdit()) return;
    field.type = type;
    if (type === 'DROPDOWN' && !field.options.length) field.options = ['Option one', 'Option two'];
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
    if (!this.canEdit()) {
      this.toasts.info(
        'Published versions are read-only',
        'Create an editable draft before changing this form.',
      );
      return;
    }
    if (!this.validateForm()) return;
    this.saving.set(true);
    const creating = !this.selectedForm();
    const request = this.selectedForm()
      ? this.api.updateForm(this.selectedForm()!.id, this.body())
      : this.api.createForm(this.body());
    request.subscribe({
      next: (f) => {
        this.load(f, false);
        this.saving.set(false);
        this.message.set('Draft saved');
        this.toasts.success(
          creating ? 'Form created' : 'Draft saved',
          `${f.title} is ready for further editing.`,
        );
        this.refresh();
      },
      error: (e) => {
        this.saving.set(false);
        this.message.set(`Not saved — ${e.error?.detail ?? 'Check the form and try again.'}`);
      },
    });
  }
  createRevision() {
    const selected = this.selectedForm();
    if (!selected || selected.status !== 'PUBLISHED') return;
    this.saving.set(true);
    this.message.set('Creating an editable copy…');
    this.api.updateForm(selected.id, this.body()).subscribe({
      next: (draft) => {
        this.load(draft, false);
        this.saving.set(false);
        this.message.set('Editable draft created');
        this.toasts.success(
          `Draft version ${draft.version} created`,
          'Your published version remains live until this draft is published.',
        );
        this.refresh();
      },
      error: (e) => {
        this.saving.set(false);
        this.message.set(
          `Draft not created — ${e.error?.detail ?? 'Reload the form and try again.'}`,
        );
      },
    });
  }
  publish() {
    const selected = this.selectedForm();
    if (!selected) return;
    if (selected.status !== 'DRAFT') {
      this.toasts.info(
        'Create a draft first',
        'Published versions are locked. Create an editable draft, make the changes, then publish it.',
      );
      return;
    }
    if (!this.validateForm()) return;
    const proceed = () =>
      this.api.publishForm(selected.id).subscribe({
        next: (f) => {
          this.load(f, false);
          this.saving.set(false);
          this.message.set('Published');
          this.toasts.success('Form published', `${f.title} is now available to requesters.`);
          this.refresh();
        },
        error: (e) => {
          this.saving.set(false);
          this.message.set(`Not published — ${e.error?.detail ?? 'Check the draft and try again.'}`);
        },
      });
    this.saving.set(true);
    this.api.updateForm(selected.id, this.body()).subscribe({
      next: () => proceed(),
      error: (e) => {
        this.saving.set(false);
        this.message.set(`Not published — ${e.error?.detail ?? 'Check the draft and try again.'}`);
      },
    });
  }
  archive() {
    const selected = this.selectedForm();
    if (!selected) return;
    this.saving.set(true);
    this.api.archiveForm(selected.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.archiveOpen.set(false);
        this.toasts.success(
          'Form archived',
          `${selected.title} is no longer available for new requests.`,
        );
        this.newForm(false);
        this.refresh();
      },
      error: () => this.saving.set(false),
    });
  }
  hasUnsavedChanges() {
    return this.baseline !== this.snapshot();
  }
  canDeactivate() {
    return this.confirmDiscard();
  }
  private confirmDiscard() {
    return (
      !this.hasUnsavedChanges() ||
      window.confirm('Discard your unsaved form changes? This action cannot be undone.')
    );
  }
  private snapshot() {
    return JSON.stringify(this.body());
  }
  private captureBaseline() {
    this.baseline = this.snapshot();
  }
  private validateForm() {
    let detail = '';
    if (!this.title.trim() || !this.fields.length) detail = 'Add a title and at least one field.';
    else if (this.title.trim().length > 160)
      detail = 'Shorten the form title to 160 characters or fewer.';
    else if (this.description.trim().length > 600)
      detail = 'Shorten the form description to 600 characters or fewer.';
    else if (this.fields.some((field) => !field.label.trim()))
      detail = 'Give every field a clear label.';
    else if (this.fields.some((field) => field.label.trim().length > 140))
      detail = 'Shorten field labels to 140 characters or fewer.';
    else if (new Set(this.fields.map((field) => field.key)).size !== this.fields.length)
      detail = 'Two fields have the same name. Rename one of them before saving.';
    else if (this.fields.some((field) => (field.description?.trim().length ?? 0) > 300))
      detail = 'Shorten field supporting text to 300 characters or fewer.';
    else if (
      this.fields.some(
        (field) =>
          field.type === 'DROPDOWN' && !field.options.some((option) => option.trim().length > 0),
      )
    )
      detail = 'Dropdown fields need at least one option.';
    else if (this.fields.some((field) => field.options.some((option) => option.trim().length > 180)))
      detail = 'Shorten dropdown options to 180 characters or fewer.';
    if (!detail) return true;
    this.message.set(detail);
    this.toasts.error('Form is incomplete', detail);
    return false;
  }
  @HostListener('document:keydown.escape')
  closeArchive() {
    if (this.archiveOpen() && !this.saving()) this.archiveOpen.set(false);
  }
}
