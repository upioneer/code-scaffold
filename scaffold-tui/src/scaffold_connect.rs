use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit},
    Aes256Gcm, Key, Nonce,
};
use anyhow::{anyhow, Result};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use futures_util::{SinkExt, StreamExt};
use rand::{rngs::OsRng, RngCore};
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;
use tokio_tungstenite::{connect_async, tungstenite::protocol::Message};

#[derive(Debug, Clone)]
pub struct ScaffoldConnectSession {
    pub pin: String,
    pub key: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct RpcPayload {
    jsonrpc: String,
    method: Option<String>,
    params: Option<serde_json::Value>,
    id: Option<u64>,
}

impl ScaffoldConnectSession {
    /// Generates a secure ephemeral pairing session for Scaffold Connect.
    pub fn new_ephemeral() -> Self {
        let mut rng = OsRng;
        let mut pin_bytes = [0u8; 4];
        rng.fill_bytes(&mut pin_bytes);
        let pin = format!("{:06}", (u32::from_le_bytes(pin_bytes) % 1_000_000));

        let mut key_bytes = [0u8; 32];
        rng.fill_bytes(&mut key_bytes);
        let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
        let key_b64 = BASE64.encode(key);

        Self { pin, key: key_b64 }
    }

    /// Establishes a Zero-Trust Ephemeral Bridge to the edge relay.
    pub async fn connect(&self, tx: mpsc::UnboundedSender<String>) -> Result<()> {
        let relay_url = format!(
            "wss://code-scaffold-relay.upioneer.deno.net/room/{}",
            self.pin
        );
        tx.send(format!(
            "Establishing zero-trust Scaffold Connect bridge [Room: {}]...",
            self.pin
        ))?;

        let (ws_stream, _) = connect_async(&relay_url).await?;
        tx.send("Connection established. Waiting for remote agent...".to_string())?;

        let (mut write, mut read) = ws_stream.split();
        let key_bytes = BASE64.decode(&self.key)?;
        let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key_bytes));

        while let Some(msg) = read.next().await {
            let msg = msg?;
            if let Message::Binary(ciphertext) = msg {
                if ciphertext.len() < 12 {
                    continue; // Invalid payload
                }
                let (nonce_bytes, enc_data) = ciphertext.split_at(12);
                let nonce = Nonce::from_slice(nonce_bytes);

                match cipher.decrypt(nonce, enc_data) {
                    Ok(plaintext) => {
                        if let Ok(json_str) = String::from_utf8(plaintext) {
                            if let Ok(rpc) = serde_json::from_str::<RpcPayload>(&json_str) {
                                if rpc.method.as_deref() == Some("initialize") {
                                    if let Some(params) = rpc.params {
                                        if let Some(client_info) = params.get("clientInfo") {
                                            if let Some(name) =
                                                client_info.get("name").and_then(|n| n.as_str())
                                            {
                                                tx.send(format!("AGENT_PAIRED:{}", name))?;
                                                
                                                // Send handshake acknowledgment
                                                let res_payload = serde_json::json!({
                                                    "jsonrpc": "2.0",
                                                    "id": rpc.id,
                                                    "result": { "status": "connected" }
                                                }).to_string();
                                                
                                                let mut rng = OsRng;
                                                let mut nonce_bytes = [0u8; 12];
                                                rng.fill_bytes(&mut nonce_bytes);
                                                let out_nonce = Nonce::from_slice(&nonce_bytes);
                                                
                                                if let Ok(encrypted) = cipher.encrypt(out_nonce, res_payload.as_bytes()) {
                                                    let mut final_payload = nonce_bytes.to_vec();
                                                    final_payload.extend(encrypted);
                                                    use futures_util::SinkExt;
                                                    let _ = write.send(Message::Binary(final_payload.into())).await;
                                                }
                                            }
                                        }
                                    }
                                } else if rpc.method.as_deref() == Some("execute_command") {
                                    if let Some(params) = rpc.params {
                                        if let Some(cmd) = params.get("command").and_then(|c| c.as_str()) {
                                            tx.send(format!("⚡ Agent executing: {}", cmd))?;
                                            
                                            // Execute command natively
                                            let output = std::process::Command::new("cmd")
                                                .args(&["/C", cmd])
                                                .output();
                                                
                                            let result = match output {
                                                Ok(out) => {
                                                    let mut s = String::from_utf8_lossy(&out.stdout).to_string();
                                                    if !out.stderr.is_empty() {
                                                        s.push_str("\nSTDERR:\n");
                                                        s.push_str(&String::from_utf8_lossy(&out.stderr));
                                                    }
                                                    s
                                                },
                                                Err(e) => format!("Execution Failed: {}", e),
                                            };
                                            
                                            // Echo the output directly back into the user's TUI so they can see what the agent sees
                                            tx.send(format!("Output: {}", result.trim()))?;
                                            
                                            // Encrypt and send result back to agent
                                            let res_payload = serde_json::json!({
                                                "jsonrpc": "2.0",
                                                "id": rpc.id,
                                                "result": result
                                            }).to_string();
                                            
                                            let mut rng = OsRng;
                                            let mut nonce_bytes = [0u8; 12];
                                            rng.fill_bytes(&mut nonce_bytes);
                                            let out_nonce = Nonce::from_slice(&nonce_bytes);
                                            
                                            if let Ok(encrypted) = cipher.encrypt(out_nonce, res_payload.as_bytes()) {
                                                let mut final_payload = nonce_bytes.to_vec();
                                                final_payload.extend(encrypted);
                                                use futures_util::SinkExt;
                                                let _ = write.send(Message::Binary(final_payload.into())).await;
                                            }
                                        }
                                    }
                                } else {
                                    tx.send(format!("Received RPC: {:?}", rpc.method))?;
                                }
                            }
                        }
                    }
                    Err(_) => {
                        tx.send("Failed to decrypt incoming payload. Dropping...".to_string())?;
                    }
                }
            }
        }

        Ok(())
    }
}
