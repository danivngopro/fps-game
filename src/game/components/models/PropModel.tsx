import { ModelLoader } from "./ModelLoader";
import type { ReactNode } from "react";

interface PropModelProps {
  src?: string;
  fallback: ReactNode;
}

export function PropModel({ src, fallback }: PropModelProps) {
  return <ModelLoader src={src} fallback={fallback} />;
}
