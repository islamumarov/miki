export const COLORS = {
  default: "var(--note-default)",
  red: "var(--note-red)",
  orange: "var(--note-orange)",
  yellow: "var(--note-yellow)",
  green: "var(--note-green)",
  teal: "var(--note-teal)",
  blue: "var(--note-blue)",
  purple: "var(--note-purple)",
  pink: "var(--note-pink)",
  gray: "var(--note-gray)",
} as const;
export type Color = keyof typeof COLORS;

export type Item = { text: string; done: boolean };
export type Note = {
  id: number;
  title: string;
  content: string;
  items: Item[];
  labels: string[];
  reminder: string | null; // ISO datetime
  color: Color;
  pinned: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
};
export type NoteInput = Partial<Omit<Note, "id" | "created_at" | "updated_at">>;
