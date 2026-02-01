import { PluginApi } from "openclaw/plugin-sdk";

/**
 * OpenClaw KakaoTalk Bridge Plugin (Custom)
 * This plugin sets up a generic webhook receiver for mobile bridge apps (like MessengerBotR).
 */

const KAKAO_CHANNEL_ID = "kakao";

const kakaoChannel = {
  id: KAKAO_CHANNEL_ID,
  meta: {
    id: KAKAO_CHANNEL_ID,
    label: "KakaoTalk",
    selectionLabel: "KakaoTalk (Mobile Bridge)",
    blurb: "Connects to KakaoTalk via an Android bridge app like MessengerBotR.",
    systemImage: "💬",
  },
  capabilities: {
    chatTypes: ["direct", "group"],
    media: false,
    reactions: false,
  },
  config: {
    // Config schema will be handled by the plugin entry
    listAccountIds: (cfg: any) => ["default"],
    resolveAccount: (cfg: any, accountId: string) => ({
      accountId: accountId || "default",
      bridgeUrl: cfg.channels?.kakao?.bridgeUrl || "http://localhost:5000/send",
    }),
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async ({ text, target, account }) => {
      console.log(`[Kakao Outbound] Sending to ${target}: ${text}`);
      try {
        const response = await fetch(account.bridgeUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            room: target,
            msg: text,
          }),
        });
        if (!response.ok) throw new Error(`Bridge responded with ${response.status}`);
        return { ok: true };
      } catch (err) {
        console.error("[Kakao Outbound] Failed to send:", err);
        return { ok: false, error: String(err) };
      }
    },
  },
};

export default function (api: PluginApi) {
  // 1. Register the Messaging Channel
  api.registerChannel({ plugin: kakaoChannel });

  // 2. Register a Webhook Endpoint to receive messages FROM the Kakao bridge
  // This will be available at: http://<gateway-ip>:<port>/hooks/kakao/receive
  api.registerHttpHandler("POST", "/kakao/receive", async (req, res) => {
    try {
      const payload = await req.json();
      const { sender, msg, room, isGroup } = payload;

      if (!sender || !msg) {
        return res.status(400).send({ error: "Missing sender or msg" });
      }

      console.log(`[Kakao Inbound] From ${sender} in ${room}: ${msg}`);

      // Inject the message into OpenClaw's processing pipeline
      await api.runtime.inbound.receive({
        channel: KAKAO_CHANNEL_ID,
        accountId: "default",
        authorId: sender,
        authorName: sender,
        chatId: room || sender,
        chatName: room || sender,
        isGroup: !!isGroup,
        text: msg,
      });

      res.status(200).send({ ok: true });
    } catch (err) {
      console.error("[Kakao Inbound] Error:", err);
      res.status(500).send({ error: "Internal Server Error" });
    }
  });

  api.logger.info("KakaoTalk Bridge Plugin Loaded. Webhook at /hooks/kakao/receive");
}
