import React, { createContext, useContext } from "react";
import {
  Folder,
  Megaphone,
  Image,
  Video,
  Grid2X2,
  Repeat2,
  Sparkles,
  LibraryBig,
  BarChart3,
  ClipboardCheck,
  Palette,
  Activity,
  FolderDown,
  Radio,
  BookOpen,
  Settings,
  Building2,
  Info,
} from "lucide-react";
export const Context = createContext<any>(null);
export const useApp = () => useContext(Context);
const pageIdentity: Record<string, [React.ComponentType<any>, string]> = {
  campaigns: [Megaphone, "Your workspace"],
  static: [Image, "Creative tools"],
  video: [Video, "Creative tools"],
  templates: [Grid2X2, "Creative tools"],
  remix: [Repeat2, "Creative tools"],
  models: [Sparkles, "Discover"],
  shared: [LibraryBig, "Discover"],
  insights: [BarChart3, "Insights & results"],
  performance: [BarChart3, "Insights & results"],
  review: [ClipboardCheck, "Creative tools"],
  assets: [Folder, "Your library"],
  ads: [LibraryBig, "Your library"],
  brand: [Palette, "Your brand"],
  activity: [Activity, "Your workspace"],
  export: [FolderDown, "Your workspace"],
  feed: [Radio, "Community"],
  classroom: [BookOpen, "Learn & create"],
  settings: [Settings, "Your workspace"],
  operator: [Building2, "Company management"],
};
function usePageIdentity() {
  const context = useApp();
  return (
    pageIdentity[context?.path?.split(/[/?]/)[0]] || [Folder, "Your workspace"]
  );
}
export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="notice" role="status" aria-live="polite">
      <Info size={17} strokeWidth={1.7} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
export function Empty({
  title,
  children,
  headingLevel = 2,
}: {
  title: string;
  children?: React.ReactNode;
  headingLevel?: 1 | 2;
}) {
  const [Icon] = usePageIdentity();
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={26} strokeWidth={1.5} aria-hidden="true" />
      </div>
      <Heading>{title}</Heading>
      {children}
    </div>
  );
}
export function Header({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  const [Icon, category] = usePageIdentity();
  return (
    <div className="page-heading">
      <div className="page-heading-copy">
        <div className="page-eyebrow">
          <span className="page-symbol">
            <Icon size={19} strokeWidth={1.65} aria-hidden="true" />
          </span>
          {category}
        </div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="actions">{children}</div>}
    </div>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
