export type MusicConfig = {
  enabled: boolean;
  trackUrl?: string | null;
  uploadedFileName?: string | null;
  volume: number;
};

export type CaptionSegment = {
  text: string;
  start: number;
  end: number;
};

export type TextConfig = {
  overlayText: string;
  captions: CaptionSegment[];
};

export type GenerateVideoPayload = {
  script: string;
  musicConfig: MusicConfig | null;
  textConfig: TextConfig | null;
};

export type GenerateVideoResponse = {
  success: boolean;
  url?: string;
  error?: string;
  received?: GenerateVideoPayload;
};
