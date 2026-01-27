declare module "tauri-plugin-oauth" {
  export interface OauthConfig {
    ports?: number[];
  }

  /**
   * Starts the OAuth server.
   * Returns a promise that resolves with the redirect URL when the OAuth flow is completed.
   */
  export function start(config?: OauthConfig): Promise<string>;

  /**
   * Cancels the OAuth server.
   */
  export function cancel(port: number): Promise<void>;
}
