import React, { useEffect, useRef, useState } from "react";
import { api } from "./api";
import { useResource } from "./discovery";
import { Field, Notice } from "./ui";

export function CommunityAttachment({ attachment }: { attachment: any }) {
  if (!attachment) return null;
  return (
    <figure className="community-attachment">
      {attachment.mediaType === "video" ? (
        <video controls preload="metadata" src={attachment.mediaUrl} />
      ) : (
        <img src={attachment.mediaUrl} alt="" />
      )}
      <figcaption>
        <a href={attachment.href}>{attachment.title}</a>
        <small>Explicitly published community derivative</small>
      </figcaption>
    </figure>
  );
}

export function CommunityThread({
  id,
  onClose,
  onChanged,
  fullPage = false,
  returnQuery = "",
}: {
  id: string;
  onClose: () => void;
  onChanged: () => void;
  fullPage?: boolean;
  returnQuery?: string;
}) {
  const { data, error, reload } = useResource(`/feed/${id}`);
  const publications = useResource<any[]>("/publications");
  const dialog = useRef<HTMLDialogElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(""),
    [reply, setReply] = useState<any>(null),
    [editing, setEditing] = useState<any>(null),
    [editText, setEditText] = useState(""),
    [commentPublication, setCommentPublication] = useState(""),
    [failure, setFailure] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (fullPage) return;
    const opener = document.activeElement as HTMLElement | null;
    const element = dialog.current!;
    element.showModal();
    return () => {
      element.close();
      if (opener?.isConnected) opener.focus();
      else if (opener?.dataset.threadId)
        document
          .querySelector<HTMLButtonElement>(
            `[data-thread-id="${CSS.escape(opener.dataset.threadId)}"]`,
          )
          ?.focus();
    };
  }, [fullPage]);
  async function perform(action: () => Promise<unknown>) {
    setBusy(true);
    setFailure("");
    try {
      await action();
      reload();
      onChanged();
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function change(c: any, action: string) {
    return perform(async () => {
      await api(
        `/feed/${id}/comments/${c.id}`,
        {
          action,
          expectedVersion: action === "edit" ? editing.rev : c.rev,
          ...(action === "edit" ? { text: editText } : {}),
        },
        "PATCH",
      );
      setEditing(null);
      if (reply?.id === c.id) setReply(null);
    });
  }
  function renderComment(c: any, nested = false) {
    return (
      <article
        className={`comment${nested ? " comment-reply" : ""}`}
        key={c.id}
      >
        <small>
          {c.body.author} · {new Date(c.created).toLocaleString()}
          {c.body.edited ? " · Edited" : ""}
        </small>
        {editing?.id === c.id ? (
          <>
            <Field label="Edit comment">
              <textarea
                value={editText}
                maxLength={5000}
                onChange={(e) => setEditText(e.target.value)}
              />
            </Field>
            {editing.rev !== c.rev && (
              <Notice>
                {c.body.removed
                  ? "This comment was removed while you were editing."
                  : `This comment changed. Latest text: ${c.body.text}`}
                {c.canEdit && (
                  <button onClick={() => setEditing(c)}>
                    Keep my edit using this latest version
                  </button>
                )}
              </Notice>
            )}
            <div className="actions">
              <button
                disabled={
                  busy ||
                  !editText.trim() ||
                  !c.canEdit ||
                  editing.rev !== c.rev
                }
                onClick={() => change(c, "edit")}
              >
                Save comment
              </button>
              <button disabled={busy} onClick={() => setEditing(null)}>
                Cancel edit
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="preserve">
              {c.body.removed
                ? "Comment removed. Replies remain in the discussion."
                : c.body.text}
            </p>
            <CommunityAttachment attachment={c.attachment} />
            <div className="actions">
              {!c.body.removed && (
                <button
                  disabled={busy}
                  onClick={() => {
                    setReply(c);
                    composer.current?.focus();
                  }}
                >
                  Reply
                </button>
              )}
              {c.canEdit && (
                <button
                  disabled={busy}
                  onClick={() => {
                    setEditing(c);
                    setEditText(c.body.text);
                  }}
                >
                  Edit comment
                </button>
              )}
              {c.canRemove && (
                <button disabled={busy} onClick={() => change(c, "remove")}>
                  Remove comment
                </button>
              )}
              {c.canRestore && (
                <button disabled={busy} onClick={() => change(c, "restore")}>
                  Restore comment
                </button>
              )}
            </div>
          </>
        )}
      </article>
    );
  }
  const content = (
    <>
      <div className="section-heading">
        <h2 id="community-thread-title">
          {data?.post.body.title || "Discussion"}
        </h2>
        <button autoFocus={!fullPage} onClick={onClose}>
          {fullPage ? "Back to Feed" : "Close thread"}
        </button>
      </div>
      <div className="actions">
        {!fullPage && (
          <a
            className="button"
            href={`#/feed/${id}${returnQuery}`}
            onClick={onClose}
          >
            Open full discussion
          </a>
        )}
        <button onClick={reload} disabled={busy}>
          Refresh discussion
        </button>
        <button onClick={() => composer.current?.focus()}>
          Jump to latest
        </button>
        {data && (
          <button
            aria-pressed={data.following}
            disabled={busy}
            onClick={() => perform(() => api(`/feed/${id}/follow`, {}))}
          >
            {data.following ? "Following" : "Follow discussion"}
          </button>
        )}
      </div>
      {failure && (
        <p role="alert" className="failure">
          {failure} Your text is retained; refresh the discussion before
          retrying.
        </p>
      )}
      {!data ? (
        <Notice>{error || "Loading discussion…"}</Notice>
      ) : (
        <>
          <p>
            <small>
              {data.post.body.author} ·{" "}
              {data.post.company ? "Company only" : "Shared community"} ·{" "}
              {data.post.body.category}
            </small>
          </p>
          <p className="preserve">{data.post.body.text}</p>
          <CommunityAttachment attachment={data.post.attachment} />
          <h3>
            {data.comments.filter((c: any) => !c.body.removed).length} comments
            and replies
          </h3>
          {!data.comments.length && <p>Be the first to comment.</p>}
          {data.comments
            .filter((c: any) => !c.body.parentId)
            .map((c: any) => (
              <React.Fragment key={c.id}>
                {renderComment(c)}
                {data.comments
                  .filter((reply: any) => reply.body.parentId === c.id)
                  .map((reply: any) => renderComment(reply, true))}
              </React.Fragment>
            ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              perform(async () => {
                await api(`/feed/${id}/comments`, {
                  text,
                  parentId: reply?.id,
                  publicationId: commentPublication || null,
                });
                setText("");
                setReply(null);
                setCommentPublication("");
              });
            }}
          >
            {reply && (
              <div className="toolbar spaced">
                <span>Replying to {reply.body.author}</span>
                <button type="button" onClick={() => setReply(null)}>
                  Cancel reply
                </button>
              </div>
            )}
            <Field label={reply ? "Your reply" : "Your comment"}>
              <textarea
                ref={composer}
                value={text}
                maxLength={5000}
                onChange={(e) => setText(e.target.value)}
              />
            </Field>
            {!!publications.data?.length && (
              <Field label="Attach a published ad (optional)">
                <select
                  value={commentPublication}
                  onChange={(event) => setCommentPublication(event.target.value)}
                >
                  <option value="">No attachment</option>
                  {publications.data.map((publication: any) => (
                    <option key={publication.id} value={publication.id}>
                      {publication.body.title}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <button className="primary" disabled={busy || !text.trim()}>
              {busy ? "Saving…" : reply ? "Post reply" : "Post comment"}
            </button>
          </form>
        </>
      )}
    </>
  );
  return fullPage ? (
    <section className="panel thread-page">{content}</section>
  ) : (
    <dialog
      className="thread-dialog"
      ref={dialog}
      aria-labelledby="community-thread-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {content}
    </dialog>
  );
}
