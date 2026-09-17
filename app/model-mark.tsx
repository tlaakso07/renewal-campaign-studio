import { useState } from "react";
import { Image, Sparkles, Video } from "lucide-react";

export function ModelMark({ model }: { model: any }) {
  const [failed, setFailed] = useState(false);
  const Icon =
    model.observedTask === "video"
      ? Video
      : model.observedTask === "image"
        ? Image
        : Sparkles;
  return (
    <span
      className={`model-mark model-mark-${model.providerId || "unverified"}`}
      title={model.providerDisplayName || "Provider unverified"}
    >
      {model.officialLogoAsset && !failed ? (
        <img
          src={model.officialLogoAsset}
          alt={`${model.providerDisplayName} logo`}
          width={48}
          height={48}
          onError={() => setFailed(true)}
        />
      ) : (
        <Icon size={24} aria-hidden="true" />
      )}
    </span>
  );
}
