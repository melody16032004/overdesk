export type MsgType = {
  id: number;
  from: "me" | "other" | "phone";
  type: "text" | "file";
  content: string;
  senderName?: string;
  fileData?: Blob;
};

export type AppSettings = {
  username: string;
  themeColor: string;
  enableStars: boolean;
};
