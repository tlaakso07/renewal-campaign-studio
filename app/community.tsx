import React, { useEffect, useRef, useState } from "react";
import { api } from "./api";
import { useResource } from "./discovery";
import { Field, Notice } from "./ui";

export function CommunityText({ text }: { text: string }) {
  return (
    <div className="community-copy">
      {text.split("\n").map((line, lineIndex) => (
        <p key={lineIndex}>
          {line
            .split(/(https?:\/\/[^\s]+|@[a-z0-9][a-z0-9_-]{1,29}\b)/gi)
            .map((part, index) => {
              if (/^https?:\/\//.test(part))
                return (
                  <a href={part} target="_blank" rel="noreferrer" key={index}>
                    {part}
                  </a>
                );
              if (/^@[a-z0-9][a-z0-9_-]{1,29}$/i.test(part))
                return (
                  <a
                    href={`#/feed/members?query=${encodeURIComponent(part.slice(1))}`}
                    key={index}
                  >
                    {part}
                  </a>
                );
              return <React.Fragment key={index}>{part}</React.Fragment>;
            })}
        </p>
      ))}
    </div>
  );
}

export async function uploadCommunityMedia(
  file: File,
  audience: "company" | "shared",
  alt = file.name,
) {
  if (file.size > 100 * 1024 * 1024)
    throw new Error("Community attachments must be 100 MB or smaller.");
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/"))
    throw new Error("Choose an image or video attachment.");
  const upload = await fetch("/api/assets/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "X-Studio-Request": "1",
      "X-File-Name": encodeURIComponent(file.name),
    },
    body: file,
  });
  const asset = await upload.json();
  if (!upload.ok) throw new Error(asset.error);
  return api("/community/media", {
    assetId: asset.id,
    audience,
    alt,
  });
}

export function CommunityAttachment({ attachment }: { attachment: any }) {
  if (!attachment) return null;
  return (
    <figure className="community-attachment">
      {attachment.mediaType === "video" ? (
        <video controls preload="metadata" src={attachment.mediaUrl} />
      ) : (
        <img src={attachment.mediaUrl} alt={attachment.title} />
      )}
      <figcaption>
        {attachment.href ? (
          <a href={attachment.href}>{attachment.title}</a>
        ) : (
          <strong>{attachment.title}</strong>
        )}
        <small>{attachment.note}</small>
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
    [commentFile, setCommentFile] = useState<File | null>(null),
    [commentAlt, setCommentAlt] = useState(""),
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
            <CommunityText
              text={
                c.body.removed
                  ? "Comment removed. Replies remain in the discussion."
                  : c.body.text
              }
            />
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
        <p role="alert" aria-live="assertive" className="failure">
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
          <CommunityText text={data.post.body.text} />
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
                const media = commentFile
                  ? await uploadCommunityMedia(
                      commentFile,
                      data.post.company ? "company" : "shared",
                      commentAlt,
                    )
                  : null;
                await api(`/feed/${id}/comments`, {
                  text,
                  parentId: reply?.id,
                  publicationId: commentPublication || null,
                  communityMediaId: media?.id || null,
                });
                setText("");
                setReply(null);
                setCommentPublication("");
                setCommentFile(null);
                setCommentAlt("");
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
                  onChange={(event) => {
                    setCommentPublication(event.target.value);
                    if (event.target.value) setCommentFile(null);
                  }}
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
            <Field label="Attach an image or video (optional)">
              <input
                type="file"
                accept="image/*,video/mp4,video/quicktime"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setCommentFile(file);
                  setCommentAlt(file?.name.replace(/\.[^.]+$/, "") || "");
                  if (file) setCommentPublication("");
                }}
              />
            </Field>
            {commentFile && (
              <>
                <Field label="Attachment description">
                  <input
                    required
                    maxLength={300}
                    value={commentAlt}
                    onChange={(event) => setCommentAlt(event.target.value)}
                  />
                </Field>
                <Notice>
                  {commentFile.name} will be sanitized and published to the{" "}
                  {data.post.company
                    ? "company discussion"
                    : "shared community"}
                  when you post this comment.
                </Notice>
              </>
            )}
            <button
              className="primary"
              disabled={
                busy || !text.trim() || (!!commentFile && !commentAlt.trim())
              }
            >
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
