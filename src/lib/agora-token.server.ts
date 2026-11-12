import { createHmac, randomInt } from "node:crypto";
import { deflateSync } from "node:zlib";

const TOKEN_VERSION = "007";
const RTC_SERVICE_TYPE = 1;
const PRIVILEGE_JOIN_CHANNEL = 1;
const PRIVILEGE_PUBLISH_AUDIO = 2;
const PRIVILEGE_PUBLISH_VIDEO = 3;
const PRIVILEGE_PUBLISH_DATA = 4;

class ByteWriter {
  private readonly chunks: Buffer[] = [];

  u16(value: number) {
    const buf = Buffer.alloc(2);
    buf.writeUInt16LE(value);
    this.chunks.push(buf);
    return this;
  }

  u32(value: number) {
    const buf = Buffer.alloc(4);
    buf.writeUInt32LE(value);
    this.chunks.push(buf);
    return this;
  }

  bytes(value: Buffer) {
    this.u16(value.length);
    this.chunks.push(value);
    return this;
  }

  str(value: string) {
    return this.bytes(Buffer.from(value, "utf8"));
  }

  privilegeMap(map: Record<number, number>) {
    const keys = Object.keys(map).map(Number).sort((a, b) => a - b);
    this.u16(keys.length);
    for (const key of keys) {
      this.u16(key).u32(map[key]);
    }
    return this;
  }

  toBuffer() {
    return Buffer.concat(this.chunks);
  }
}

function hmacSha256(key: Buffer | string, message: Buffer | string) {
  return createHmac("sha256", key).update(message).digest();
}

function isHexId(value: string) {
  return /^[0-9a-fA-F]{32}$/.test(value);
}

export function buildAgoraRtcToken(input: {
  appId: string;
  appCertificate: string | null;
  channelName: string;
  ttlSeconds: number;
}): string | null {
  if (!input.appCertificate) return null;
  if (!isHexId(input.appId) || !isHexId(input.appCertificate)) {
    throw new Error("إعدادات Agora غير صالحة");
  }

  const issueTs = Math.floor(Date.now() / 1000);
  const salt = randomInt(1, 99999999);
  const privilegeExpireTs = issueTs + input.ttlSeconds;

  const rtcService = new ByteWriter()
    .u16(RTC_SERVICE_TYPE)
    .privilegeMap({
      [PRIVILEGE_JOIN_CHANNEL]: privilegeExpireTs,
      [PRIVILEGE_PUBLISH_AUDIO]: privilegeExpireTs,
      [PRIVILEGE_PUBLISH_VIDEO]: privilegeExpireTs,
      [PRIVILEGE_PUBLISH_DATA]: privilegeExpireTs,
    })
    .str(input.channelName)
    .str("")
    .toBuffer();

  const signingKey = hmacSha256(
    new ByteWriter().u32(salt).toBuffer(),
    hmacSha256(new ByteWriter().u32(issueTs).toBuffer(), input.appCertificate),
  );

  const signingInfo = Buffer.concat([
    new ByteWriter()
      .str(input.appId)
      .u32(issueTs)
      .u32(input.ttlSeconds)
      .u32(salt)
      .u16(1)
      .toBuffer(),
    rtcService,
  ]);

  const signature = hmacSha256(signingKey, signingInfo);
  const content = Buffer.concat([new ByteWriter().bytes(signature).toBuffer(), signingInfo]);

  return TOKEN_VERSION + deflateSync(content).toString("base64");
}
