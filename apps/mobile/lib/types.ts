export type PostFormat = "any" | "media" | "discussion";

export type SessionUser = {
  id: string;
  username: string;
  email?: string | null;
  image?: string | null;
  showNsfw?: boolean;
};

export type AuthSession = {
  user: SessionUser;
} | null;

export type Community = {
  id?: string;
  name: string;
  title: string;
  description: string;
  nsfw?: boolean;
  postFormat?: PostFormat;
  createdAt?: string;
  postCount?: number;
  joined?: boolean;
};

export type FeedPost = {
  id: string;
  title: string;
  body: string | null;
  url: string | null;
  thumbnail: string | null;
  score: number;
  commentCount?: number;
  nsfw?: boolean;
  createdAt: string;
  communityId?: string;
  authorId?: string;
  moderationStatus?: string;
  author: { id?: string; username: string };
  community: { id?: string; name: string; title: string; postFormat?: PostFormat };
  _count?: { comments: number };
};

export type CommentNode = {
  id: string;
  body: string;
  imageUrl?: string | null;
  score: number;
  parentId?: string | null;
  createdAt: string;
  moderationStatus?: string;
  authorId?: string;
  author: { id?: string; username: string };
  replies?: CommentNode[];
};

export type FeedResponse = {
  posts: FeedPost[];
  nextPage: number | null;
};

export type PostDetailResponse = {
  post: FeedPost;
  comments: CommentNode[];
};
