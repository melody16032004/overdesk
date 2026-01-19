export type Tab = "generator" | "github" | "cheatsheet";

export interface GitHubProfile {
  login: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
  name: string;
  bio: string;
  html_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  description: string;
  stargazers_count: number;
  language: string;
  html_url: string;
}
