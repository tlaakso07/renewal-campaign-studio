import { useState } from "react";
import { Image, Video } from "lucide-react";

export function ModelMark({ model }: { model: any }) {
  const [failed, setFailed] = useState(false);
  const Icon = model.observedTask === "video" ? Video : Image;
  return (
    <span className="model-mark">
      {model.officialLogoAsset && !failed ? (
        <img
          src={model.officialLogoAsset}
          alt={model.providerDisplayName || ""}
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
