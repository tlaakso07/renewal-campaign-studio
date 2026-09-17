import React, { useState, useEffect } from "react";
import { Field, Notice, useApp } from "./ui";
import { api } from "./api";
export function ThemeControls() {
  const { boot, run, refresh } = useApp(),
    theme = JSON.parse(boot.company.theme),
    [color, setColor] = useState(theme.color);
  return (
    <section className="panel spaced">
      <h2>Workspace appearance · v{theme.version}</h2>
      <p>
        Changes the application interface. Saved creative documents keep their
        own design-system version.
      </p>
      <Field label="Interface accent">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </Field>
      <button
        disabled={boot.actor.role !== "owner"}
        onClick={() =>
          run(async () => {
            await api(
              "/theme",
              { color, expectedVersion: theme.version },
              "PUT",
            );
            await refresh();
          })
        }
      >
        Save interface theme
      </button>
    </section>
  );
}
export function SetupControls({ onSaved }: { onSaved: () => void }) {
  const { run } = useApp(),
    [name, setName] = useState(""),
    [color, setColor] = useState("#D5AE74"),
    [created, setCreated] = useState(""),
    [lesson, setLesson] = useState({
      title: "",
      description: "",
      transcript: "",
      category: "Getting Started",
      audience: "company",
      publicationId: null as string | null,
      target: "campaigns",
      state: "published",
    }),
    [publications, setPublications] = useState<any[]>([]),
    [notice, setNotice] = useState("");
  useEffect(() => {
    api("/publications").then(setPublications);
  }, []);
  return (
    <div className="two-columns spaced">
      <section className="panel form-grid">
        <h2>Configure a company</h2>
        <Field label="Company name">
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Company accent">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </Field>
        <button
          disabled={!name}
          onClick={() =>
            run(async () => {
              const c = await api("/operator/companies", { name, color });
              setCreated(c.name);
              onSaved();
            })
          }
        >
          Create isolated workspace
        </button>
        {created && (
          <Notice>
            {created} is ready for setup. Sign out and select its local operator
            identity to import assets and invite its owner.
          </Notice>
        )}
        <p>No source assets or company data are copied from Renewal.</p>
      </section>
      <section className="panel form-grid">
        <h2>Publish original training</h2>
        {["title", "description", "transcript"].map((k) => (
          <Field key={k} label={"Lesson " + k}>
            {k === "title" ? (
              <input
                value={(lesson as any)[k]}
                onChange={(e) => setLesson({ ...lesson, [k]: e.target.value })}
              />
            ) : (
              <textarea
                value={(lesson as any)[k]}
                onChange={(e) => setLesson({ ...lesson, [k]: e.target.value })}
              />
            )}
          </Field>
        ))}
        <Field label="Lesson audience">
          <select
            value={lesson.audience}
            onChange={(e) => setLesson({ ...lesson, audience: e.target.value })}
          >
            <option value="company">This company only</option>
            <option value="platform">All member companies</option>
          </select>
        </Field>
        <Field label="Recording (optional)">
          <select
            value={lesson.publicationId || ""}
            onChange={(e) =>
              setLesson({ ...lesson, publicationId: e.target.value || null })
            }
          >
            <option value="">Written guide · no recording</option>
            {publications
              .filter((p) => p.body.mediaType === "video")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.body.title}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Related tool">
          <select
            value={lesson.target}
            onChange={(e) => setLesson({ ...lesson, target: e.target.value })}
          >
            {[
              "campaigns",
              "static",
              "video",
              "insights",
              "assets",
              "brand",
              "shared",
            ].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <button
          disabled={!lesson.title || !lesson.transcript}
          onClick={() =>
            run(async () => {
              await api("/classroom/content", {
                ...lesson,
                kind: "lesson",
                tags: [],
                thumbnailAssetId: null,
                resources: [],
                archive: null,
              });
              setNotice(
                "Published original training to the selected audience.",
              );
            })
          }
        >
          Publish lesson
        </button>
        {notice && <Notice>{notice}</Notice>}
      </section>
    </div>
  );
}
