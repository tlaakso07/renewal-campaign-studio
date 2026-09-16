import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Check,
  Home as HomeIcon,
  MessageSquare,
  Megaphone,
  Image,
  Video,
  Repeat2,
  Folder,
  BookOpen,
  Palette,
  Settings,
  Sparkles,
  ArrowUp,
  Plus,
  History,
  ArrowRight,
  Activity,
  BarChart3,
  Users,
  Grid2X2,
  Search,
  PanelLeftClose,
  LogOut,
  Link as LinkIcon,
} from "lucide-react";
import { api, go, media } from "./api";
import "./style.css";
import { Context, useApp, Notice, Field } from "./ui";
const nav: ReadonlyArray<
  readonly [
    string,
    ReadonlyArray<readonly [string, string, React.ComponentType<any>]>,
  ]
> = [
  [
    "Workspace",
    [
      ["", "Home", HomeIcon],
      ["campaigns", "Campaigns", Megaphone],
    ],
  ],
  [
    "Create",
    [
      ["static", "Static Studio", Image],
      ["video", "Video & UGC", Video],
      ["templates", "Templates", Grid2X2],
      ["remix", "Remix", Repeat2],
    ],
  ],
  [
    "Discover",
    [
      ["models", "AI Models", Sparkles],
      ["shared", "Winning Ads", Grid2X2],
      ["insights", "Creative Insights", BarChart3],
      ["crm", "CRM outcomes", BarChart3],
      ["review", "Creative review", Check],
    ],
  ],
  [
    "Library",
    [
      ["assets", "My Assets", Folder],
      ["brand", "Brand System", Palette],
      ["activity", "Activity & downloads", Activity],
      ["export", "Campaign export", Folder],
    ],
  ],
  [
    "Community",
    [
      ["feed", "Feed", Users],
      ["classroom", "Classroom", BookOpen],
    ],
  ],
] as const;
function App() {
  const [boot, setBoot] = useState<any>(null),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(""),
    [path, setPath] = useState(location.hash.slice(2)),
    [mobile, setMobile] = useState(false);
  async function refresh() {
    try {
      setBoot(await api("/bootstrap"));
    } catch {}
    setLoaded(true);
  }
  useEffect(() => {
    refresh();
    const f = () => {
      setPath(location.hash.slice(2));
      setMobile(false);
      setError("");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  async function run(fn: () => Promise<any>) {
    try {
      setError("");
      return await fn();
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }
  if (!loaded) return <div className="loading">Opening your workspace…</div>;
  if (!boot) return <Login onLogin={refresh} />;
  const section = path.split(/[/?]/)[0],
    title =
      nav.flatMap((n) => n[1]).find((n) => n[0] === section)?.[1] || "Settings";
  const logo = boot.brand?.body.logoAssetId;
  return (
    <Context.Provider value={{ boot, refresh, run, setError, path }}>
      <div
        className={"app " + (mobile ? "nav-open" : "")}
        style={
          {
            "--accent": JSON.parse(boot.company.theme).color,
          } as React.CSSProperties
        }
      >
        <aside className="sidebar">
          <a href="#/" className="identity">
            {logo ? (
              <img src={media(logo)} alt={boot.company.name} />
            ) : (
              <strong>{boot.company.name}</strong>
            )}
            <span>Creative Studio</span>
          </a>
          <nav aria-label="Main navigation">
            {nav.map(([group, items]) => (
              <div className="nav-group" key={group}>
                <div className="nav-label">{group}</div>
                {items.map(([route, label, Icon]) => (
                  <a
                    href={"#/" + route}
                    className={section === route ? "active" : ""}
                    key={route}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </a>
                ))}
              </div>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <a href="#/settings">
              <Settings size={18} />
              Settings
            </a>
            {boot.actor.staff && <a href="#/operator">Company setup</a>}
            <button
              className="profile"
              onClick={() =>
                run(async () => {
                  await api("/auth/logout", {});
                  if (boot.mode === "hosted-review") window.location.assign("/");
                  else setBoot(null);
                })
              }
            >
              <span className="avatar">{boot.actor.name[0]}</span>
              <span>
                {boot.actor.name}
                <small>{boot.actor.role} · {boot.mode === "hosted-review" ? "Private review" : "Local prototype"}</small>
              </span>
              <LogOut size={16} />
            </button>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <button
              className="icon mobile-toggle"
              aria-label="Toggle navigation"
              onClick={() => setMobile(!mobile)}
            >
              <PanelLeftClose size={21} />
            </button>
            <div>
              Workspace <span>/</span>{" "}
              <strong>{section ? title : "Assistant"}</strong>
            </div>
            <a className="prototype" href="#/settings">
              <span className="dot" />
              {boot.company.name} prototype
            </a>
          </header>
          {error && (
            <div className="error" role="alert">
              {error}
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                ×
              </button>
            </div>
          )}
          <main>{!section ? <Home /> : <LazyPage section={section} />}</main>
        </div>
      </div>
    </Context.Provider>
  );
}
function Login({ onLogin }: { onLogin: () => void }) {
  const [options, setOptions] = useState<any[]>([]),
    [error, setError] = useState(""),
    [credentials, setCredentials] = useState(false),
    [email, setEmail] = useState(""),
    [name, setName] = useState(""),
    [password, setPassword] = useState("");
  const invitation =
    location.pathname === "/invite"
      ? new URLSearchParams(location.search).get("token")
      : null;
  useEffect(() => {
    if (!invitation)
      api("/auth/options")
        .then(setOptions)
        .catch((e) => setError(e.message));
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api(
        invitation ? "/auth/accept" : "/auth/login",
        invitation
          ? { token: invitation, name, password }
          : { email, password },
      );
      history.replaceState(null, "", "/");
      onLogin();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="login">
      <div className="login-box">
        <h1>
          {invitation ? "Join your workspace." : "Your creative workspace."}
        </h1>
        <Notice>
          Local prototype · Development sign-in is disabled in production.
        </Notice>
        {error && <p role="alert">{error}</p>}
        {invitation || credentials ? (
          <form className="form-grid" onSubmit={submit}>
            {invitation ? (
              <Field label="Your name">
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
            ) : (
              <Field label="Email">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
            )}
            <Field label="Password">
              <input
                type="password"
                minLength={12}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={invitation ? "new-password" : "current-password"}
              />
            </Field>
            <button className="primary">
              {invitation ? "Accept invitation" : "Sign in"}
            </button>
          </form>
        ) : (
          <>
            {options.map((o) => (
              <button
                key={o.id + o.company}
                className="login-option"
                onClick={async () => {
                  try {
                    await api("/auth/local", {
                      user: o.id,
                      company: o.company,
                    });
                    onLogin();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <div>
                  <strong>{o.name}</strong>
                  <small>
                    {o.companyName} · {o.role}
                  </small>
                </div>
                <ArrowRight size={18} />
              </button>
            ))}
            <button
              className="text-button spaced"
              onClick={() => setCredentials(true)}
            >
              Sign in with an invited account
            </button>
          </>
        )}
      </div>
    </div>
  );
}
function Home() {
  const { boot, run, refresh } = useApp(),
    [message, setMessage] = useState(""),
    [conversation, setConversation] = useState<any>(null),
    [campaign, setCampaign] = useState(""),
    [busy, setBusy] = useState(false),
    [history, setHistory] = useState<any[] | null>(null);
  async function send(action?: string, text = message) {
    if (!text.trim()) return;
    setBusy(true);
    await run(async () => {
      const c = await api("/assistant", {
        message: text,
        conversationId: conversation?.id,
        campaignId: campaign || undefined,
        action,
      });
      setConversation(c);
      setMessage("");
      await refresh();
    });
    setBusy(false);
  }
  return (
    <div className="home">
      <div className="home-toolbar">
        <button
          className="text-button"
          onClick={() => {
            setConversation(null);
            setHistory(null);
          }}
        >
          <MessageSquare size={17} />
          New conversation
        </button>
        <button
          className="text-button"
          onClick={() =>
            run(async () => setHistory(await api("/records/conversation")))
          }
        >
          <History size={17} />
          Conversation history
        </button>
      </div>
      {history && (
        <div className="history panel">
          <h3>Your conversations</h3>
          {history.length ? (
            history.map((c) => (
              <button
                className="list-button"
                key={c.id}
                onClick={() => {
                  setConversation(c);
                  setHistory(null);
                }}
              >
                {c.body.title}
                <ArrowRight size={16} />
              </button>
            ))
          ) : (
            <p>No conversations yet.</p>
          )}
        </div>
      )}
      {!conversation ? (
        <div className="welcome">
          <div className="assistant-label">
            <Sparkles size={16} />
            Your {boot.company.name} assistant
          </div>
          <h1>What can I help you create today?</h1>
          <p>Ask a question, plan a campaign, or bring an idea to life.</p>
        </div>
      ) : (
        <div className="conversation">
          {conversation.body.messages.map((m: any, i: number) => (
            <div className={"message " + m.role} key={i}>
              <span className="message-author">
                {m.role === "assistant" ? "Renewal guide" : "You"}
              </span>
              <p>{m.text}</p>
              {m.links?.map((l: any) => (
                <a className="button" key={l.route} href={"#/" + l.route}>
                  {l.label}
                  <ArrowRight size={16} />
                </a>
              ))}
              {m.sources?.map((s: any) => (
                <a className="source" key={s.route} href={"#/" + s.route}>
                  <LinkIcon size={13} />
                  {s.label}
                  {s.version && ` · v${s.version}`}
                </a>
              ))}
            </div>
          ))}
        </div>
      )}
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          aria-label="Message the Renewal assistant"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask about your brand, campaigns, or next idea…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <div className="composer-footer">
          <span className="chip">
            <Sparkles size={14} />
            Local guide
          </span>
          <select
            aria-label="Campaign context"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
          >
            <option value="">＋ Add campaign</option>
            {boot.campaigns.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.body.name}
              </option>
            ))}
          </select>
          <button
            className="send"
            disabled={busy || !message.trim()}
            aria-label="Send message"
          >
            <ArrowUp size={22} />
          </button>
        </div>
      </form>
      <p className="composer-note">
        Your company’s knowledge and creative tools, in one place. AI reasoning
        is not connected.
      </p>
      {!conversation ? (
        <>
          <div className="starter-actions">
            <button
              onClick={() => {
                setMessage("Create campaign: ");
                document.querySelector("textarea")?.focus();
              }}
            >
              <Megaphone size={18} />
              Plan this month’s campaign
            </button>
            <button
              onClick={() => send(undefined, "What are our brand rules?")}
            >
              <Sparkles size={18} />
              Explore our brand
            </button>
          </div>
          <section className="toolkit">
            <h2>Your toolkit</h2>
            <div className="toolkit-links">
              {[
                ["static", "Static ad", Image],
                ["video", "Video & UGC", Video],
                ["templates", "Remix", Repeat2],
                ["assets", "My Assets", Folder],
              ].map(([route, label, Icon]: any) => (
                <a key={route} href={"#/" + route}>
                  <Icon size={19} />
                  {label}
                </a>
              ))}
            </div>
          </section>
          <section className="home-discovery">
            <div className="section-heading">
              <h2>Creative Studio</h2>
              <a href="#/models">
                Browse all models <ArrowRight size={15} />
              </a>
            </div>
            <p>
              Explore the full catalog. Availability is verified before a model
              can create.
            </p>
            <div className="model-preview">
              {boot.models
                .filter((m: any) => m.observedTask !== "assistant")
                .slice(0, 3)
                .map((m: any) => (
                  <a href="#/models" key={m.id}>
                    <Sparkles size={22} />
                    <h3>{m.observedLabel}</h3>
                    <span>{m.observedTask} · Not connected</span>
                  </a>
                ))}
            </div>
            <div className="section-heading">
              <h2>Latest winning ads</h2>
              <a href="#/shared">
                Explore the library <ArrowRight size={15} />
              </a>
            </div>
            <p>
              Published references will appear here. Private company work stays
              private until shared.
            </p>
          </section>
        </>
      ) : (
        <div className="starter-actions">
          <button
            disabled={!campaign}
            onClick={() => send("create-static", "Create a static draft")}
          >
            <Image size={17} />
            Create static
          </button>
          <button
            disabled={!campaign}
            onClick={() => send("create-video", "Build a video draft")}
          >
            <Video size={17} />
            Build video
          </button>
        </div>
      )}
    </div>
  );
}
function LazyPage({ section }: { section: string }) {
  const { setError } = useApp();
  const [Page, setPage] = useState<React.ComponentType<{
    section: string;
  }> | null>(null);
  useEffect(() => {
    import("./pages")
      .then((m) => setPage(() => m.Pages))
      .catch((e) =>
        setError("Page could not load. Refresh to retry. " + e.message),
      );
  }, []);
  return Page ? (
    <Page section={section} />
  ) : (
    <div className="loading">Loading workspace…</div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
