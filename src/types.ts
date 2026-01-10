import { ReactNode } from "react";

export interface LayoutItem {
  id: string;
  width: number;
  height: number;
  content: ReactNode;
}

export interface HermitageLayoutProps {
  items: LayoutItem[];
  containerWidth: number;
  gap?: number;
  className?: string;
}
