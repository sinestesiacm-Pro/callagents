import Retell from "retell-sdk";

let _retellClient: Retell | null = null;

export function getRetellClient(): Retell {
  if (!_retellClient) {
    _retellClient = new Retell({
      apiKey: process.env.RETELL_API_KEY || "sk_dummy_key_for_build",
    });
  }
  return _retellClient;
}
