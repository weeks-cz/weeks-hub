# Board Redesign — Asana-like Task Management

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the kanban board into an Asana-like task management system with rich task detail panel, comments, file attachments, nested subtasks, and full mobile responsiveness.

**Architecture:** Replace the current modal-based task detail with a slide-over panel (drawer). Add `task_comments` and `task_attachments` DB tables. Extend subtasks with `assignee_id` and `description` to support nesting. Use Supabase Storage bucket `attachments` for files. Rich text editing via a lightweight contenteditable approach (no heavy editor dependency).

**Tech Stack:** Next.js 16 App Router, React 19, Supabase (Postgres + Storage + Realtime), @hello-pangea/dnd, Tailwind CSS v4, Framer Motion, Lucide icons.

---

## Phase 1: Task Detail Panel + Enhanced Task Cards

### Task 1: DB migration — comments, attachments, subtask extensions

**Files:**
- Create: `supabase/migrations/005_board_redesign.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ===== TASK COMMENTS =====
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_task ON task_comments (task_id, created_at);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view task comments" ON task_comments FOR SELECT USING (is_weeks_user());
CREATE POLICY "Users can create comments" ON task_comments FOR INSERT WITH CHECK (is_weeks_user() AND auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON task_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON task_comments FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON task_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;

-- ===== TASK ATTACHMENTS =====
CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attachments_task ON task_attachments (task_id);

ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments" ON task_attachments FOR SELECT USING (is_weeks_user());
CREATE POLICY "Users can create attachments" ON task_attachments FOR INSERT WITH CHECK (is_weeks_user());
CREATE POLICY "Users can delete own attachments" ON task_attachments FOR DELETE USING (auth.uid() = user_id);

-- ===== EXTEND SUBTASKS =====
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS parent_subtask_id UUID REFERENCES subtasks(id) ON DELETE CASCADE;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/005_board_redesign.sql
git commit -m "feat: add DB migration for comments, attachments, subtask nesting"
```

---

### Task 2: TypeScript types for comments, attachments, extended subtasks

**Files:**
- Modify: `src/types/database.ts`

- [ ] **Step 1: Add new types after existing Subtask interface**

Add after the `Subtask` interface (~line 55):

```typescript
export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  // Joined
  user?: User;
  attachments?: TaskAttachment[];
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  comment_id: string | null;
  user_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  created_at: string;
}
```

- [ ] **Step 2: Extend Subtask interface**

Add fields to existing `Subtask` interface:

```typescript
export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  position: number;
  assignee_id: string | null;
  description: string | null;
  parent_subtask_id: string | null;
  created_at: string;
  // Joined
  assignee?: User | null;
}
```

- [ ] **Step 3: Add comments and attachments to Task joined fields**

In the Task interface, add to joined fields section:

```typescript
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
```

- [ ] **Step 4: Commit**

```bash
git add src/types/database.ts
git commit -m "feat: add TypeScript types for comments, attachments, extended subtasks"
```

---

### Task 3: useTaskComments hook

**Files:**
- Create: `src/hooks/useTaskComments.ts`

- [ ] **Step 1: Create the hook**

Hook that fetches comments for a specific task with realtime subscription. Provides `addComment`, `updateComment`, `deleteComment` functions.

Query: `task_comments` with joined `user:users(*)` and `attachments:task_attachments(*)`, ordered by `created_at ASC`.

Realtime: subscribe to `postgres_changes` on `task_comments` filtered by `task_id`.

`addComment(taskId, content)` — insert with current user ID, refetch.

`updateComment(commentId, content)` — update content, refetch.

`deleteComment(commentId)` — delete, refetch.

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useTaskComments.ts
git commit -m "feat: add useTaskComments hook with realtime"
```

---

### Task 4: useTaskAttachments hook

**Files:**
- Create: `src/hooks/useTaskAttachments.ts`

- [ ] **Step 1: Create the hook**

Hook for uploading/deleting files from `attachments` Supabase Storage bucket.

`uploadAttachment(taskId, file, commentId?)` — upload to `tasks/{taskId}/{uuid}.{ext}`, insert row into `task_attachments`, return attachment.

`deleteAttachment(attachmentId, fileUrl)` — delete from storage + delete DB row.

Max file size: 10MB. Allowed types: images, PDFs, documents.

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useTaskAttachments.ts
git commit -m "feat: add useTaskAttachments hook with Supabase Storage"
```

---

### Task 5: Task Detail Panel (replaces TaskDetailModal)

**Files:**
- Create: `src/components/board/TaskDetailPanel.tsx`
- Delete content of: `src/components/board/TaskDetailModal.tsx` (keep as re-export or redirect)

- [ ] **Step 1: Build the TaskDetailPanel**

A slide-over drawer from the right side (not a centered modal). Full height, 50% width on desktop (min 480px, max 640px), full-screen on mobile.

**Layout (top to bottom):**

1. **Header bar** — close button (X), task title (inline editable), "Mark complete" button (checkmark that moves task to `done`), delete button
2. **Meta section** — horizontal bar with:
   - Status dropdown (current column, can change)
   - Assignee (avatar + name, click to change via dropdown)
   - Priority (colored badge, click to change)
   - Due date (click to edit)
   - Labels (badges, click to add/remove)
3. **Description** — contenteditable div with basic formatting toolbar (bold, italic, link). Saves on blur. Placeholder: "Přidej popis..."
4. **Subtasks section** — enhanced SubtaskList (see Task 7)
5. **Attachments section** — file list + drag-and-drop upload area
6. **Comments section** — comment list + new comment input at bottom

**Mobile behavior:**
- Full-screen overlay (inset-0) instead of half-width drawer
- Header becomes sticky
- Touch-friendly tap targets (min 44px)
- Swipe right to close

**Animation:** Framer Motion slide from right, backdrop blur.

- [ ] **Step 2: Build inline-editable title component**

Click on title → becomes input. Enter or blur saves. Escape cancels.

- [ ] **Step 3: Build quick-change assignee dropdown**

Click on assignee avatar → opens dropdown with user list. Click user to assign. Click "Odebrat" to unassign.

- [ ] **Step 4: Build quick-change status dropdown**

Shows current status as colored pill. Click → dropdown with all 5 statuses. Select → calls moveTask.

- [ ] **Step 5: Build quick-change priority selector**

Click priority badge → shows 4 priority options inline. Select → updates immediately.

- [ ] **Step 6: Commit**

```bash
git add src/components/board/TaskDetailPanel.tsx
git commit -m "feat: add TaskDetailPanel slide-over drawer with inline editing"
```

---

### Task 6: Comments UI component

**Files:**
- Create: `src/components/board/CommentList.tsx`
- Create: `src/components/board/CommentInput.tsx`

- [ ] **Step 1: Build CommentList**

Renders list of TaskComment objects. Each comment shows:
- User avatar + name + relative time
- Comment content (with @mention highlighting)
- Edit/delete buttons (only for own comments, appear on hover)
- Attached files (if any)

- [ ] **Step 2: Build CommentInput**

Textarea at bottom of panel. Features:
- @mention: typing `@` opens user dropdown, selecting inserts `@Name`
- Attach button: opens file picker, uploads via useTaskAttachments
- Submit on Ctrl+Enter or click button
- Shows attached files as chips before sending
- Placeholder: "Napiš komentář... (@zmínka)"

- [ ] **Step 3: Commit**

```bash
git add src/components/board/CommentList.tsx src/components/board/CommentInput.tsx
git commit -m "feat: add comment list and input with @mentions"
```

---

### Task 7: Enhanced SubtaskList with nesting and assignees

**Files:**
- Modify: `src/components/board/SubtaskList.tsx`
- Modify: `src/hooks/useTasks.ts` (extend subtask operations)

- [ ] **Step 1: Extend useTasks subtask operations**

Update `addSubtask(taskId, title, parentSubtaskId?)` to support `parent_subtask_id`.

Add `updateSubtask(subtaskId, updates)` for changing assignee, description, title.

Update `fetchTasks` query to include `subtasks(*, assignee:users!subtasks_assignee_id_fkey(*))`.

- [ ] **Step 2: Redesign SubtaskList**

Each subtask item shows:
- Checkbox (toggle complete)
- Title (click to expand/edit)
- Assignee avatar (click to assign, small dropdown)
- Delete button (hover)
- Expand arrow if has children

**Expanded subtask** shows:
- Description (inline editable)
- Nested subtask list (recursive, max 2 levels deep)
- Add child subtask input

**Add subtask input** at bottom of each level.

- [ ] **Step 3: Commit**

```bash
git add src/components/board/SubtaskList.tsx src/hooks/useTasks.ts
git commit -m "feat: enhanced subtasks with nesting, assignees, and inline editing"
```

---

### Task 8: File attachments UI

**Files:**
- Create: `src/components/board/AttachmentList.tsx`
- Create: `src/components/board/FileUploadZone.tsx`

- [ ] **Step 1: Build AttachmentList**

Displays task attachments as a list. Each item shows:
- File icon (by type: image preview thumbnail, PDF icon, doc icon, generic)
- File name + size (formatted)
- Download link
- Delete button (own files only)

- [ ] **Step 2: Build FileUploadZone**

Drag-and-drop area + click-to-browse. Shows upload progress. Validates file size (10MB max) and type.

- [ ] **Step 3: Commit**

```bash
git add src/components/board/AttachmentList.tsx src/components/board/FileUploadZone.tsx
git commit -m "feat: add file attachment list and drag-drop upload zone"
```

---

### Task 9: Integrate TaskDetailPanel into KanbanBoard

**Files:**
- Modify: `src/components/board/KanbanBoard.tsx`

- [ ] **Step 1: Replace TaskDetailModal with TaskDetailPanel**

Remove TaskDetailModal import, add TaskDetailPanel. The panel renders alongside the board (not as overlay modal). On desktop, the board columns shrink to accommodate the panel when open. On mobile, panel is full-screen overlay.

Board layout changes:
- Wrap board in flex container
- When panel open: board takes remaining width, panel takes fixed width
- Smooth transition when opening/closing panel

- [ ] **Step 2: Pass required props**

TaskDetailPanel needs: task, onClose, useTasks operations, useTaskComments, useTaskAttachments.

- [ ] **Step 3: Update URL state**

When task is selected, update URL to `/board?task={taskId}` (shallow). On load, if `task` param exists, auto-open that task's panel.

- [ ] **Step 4: Commit**

```bash
git add src/components/board/KanbanBoard.tsx
git commit -m "feat: integrate TaskDetailPanel into KanbanBoard with URL state"
```

---

### Task 10: Enhanced TaskCard

**Files:**
- Modify: `src/components/board/TaskCard.tsx`

- [ ] **Step 1: Improve task card display**

Changes:
- Assignee avatar always visible (top-right corner, overlapping card edge slightly)
- Priority shown as colored left border (like dashboard MyTasks) instead of dot
- Comment count icon (if has comments)
- Attachment count icon (if has attachments)
- Subtask progress mini-bar (thin line at bottom of card)
- Quick complete: checkbox icon appears on hover (top-left), clicking it marks task as done without opening detail

- [ ] **Step 2: Commit**

```bash
git add src/components/board/TaskCard.tsx
git commit -m "feat: enhanced task cards with quick-complete, avatars, and activity indicators"
```

---

### Task 11: Mobile responsiveness pass

**Files:**
- Modify: `src/components/board/KanbanBoard.tsx`
- Modify: `src/components/board/BoardColumn.tsx`
- Modify: `src/components/board/TaskDetailPanel.tsx`

- [ ] **Step 1: Board horizontal scroll on mobile**

Board columns: horizontal scroll with snap points. Touch-friendly drag handles. Column width: 85vw on mobile (so next column peeks).

- [ ] **Step 2: TaskDetailPanel mobile full-screen**

On mobile (< lg breakpoint): panel becomes full-screen, swipe-right-to-close gesture, sticky header with back button instead of X.

- [ ] **Step 3: Touch-friendly interactions**

All interactive elements min 44px touch target. Dropdowns use bottom-sheet style on mobile. Long-press on task card for quick actions menu.

- [ ] **Step 4: Commit**

```bash
git add src/components/board/KanbanBoard.tsx src/components/board/BoardColumn.tsx src/components/board/TaskDetailPanel.tsx
git commit -m "feat: full mobile responsiveness for board, panels, and interactions"
```

---

### Task 12: Notifications for comments and mentions

**Files:**
- Modify: `src/hooks/useTaskComments.ts`

- [ ] **Step 1: Add notification triggers**

When creating a comment:
- If comment contains `@Name`, find matching user, create `task_assigned` notification with link to `/board?task={taskId}`
- Notify task assignee about new comment (if commenter is not the assignee)

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useTaskComments.ts
git commit -m "feat: add notifications for comments and @mentions"
```

---

### Task 13: Final verification and cleanup

**Files:**
- Remove: old `TaskDetailModal.tsx` (if fully replaced)
- Verify: TypeScript check passes
- Verify: all components render correctly

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 2: Clean up unused imports and dead code**

Remove old TaskDetailModal if no longer used. Clean up any unused imports.

- [ ] **Step 3: Final commit and push**

```bash
git add -A
git commit -m "feat: complete board redesign phase 1 — task detail panel, comments, attachments"
git push
```

---

## Execution Notes

- **DB migrations** (005) must be run on Supabase before testing comments/attachments
- **Storage bucket** `attachments` must be created in Supabase Dashboard (public read) with RLS policies:
  - INSERT: `bucket_id = 'attachments' AND is_weeks_user()`
  - SELECT: `bucket_id = 'attachments' AND is_weeks_user()`
  - DELETE: `bucket_id = 'attachments' AND auth.uid() = owner`
- **Realtime** must be enabled for `task_comments` table
- Test drag-and-drop thoroughly after panel integration (known gotcha: moveTask must reorder ALL positions)
- Test on mobile devices for touch interactions
