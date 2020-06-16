import { Buffer } from "../buffer.ts";
import { BedrockPacket } from "../mod.ts";
import { JWT } from "./jwt.ts";

export class LoginPacket extends BedrockPacket {
  static id = 0x01;

  constructor(
    public protocol: number,
    public tokens: JWT[],
    public client: JWT,
  ) {
    super();
  }

  static from(buffer: Buffer): LoginPacket {
    super.check(buffer);

    const protocol = buffer.readInt();

    const sub = new Buffer(buffer.readUVIntArray());
    const data = JSON.parse(sub.readLIntString());

    const tokens = [];
    for (const [i, token] of data.chain.entries()) {
      tokens.push(new JWT(token, true, i === 0, i === 0));
    }

    const client = new JWT(sub.readLIntString(), true, true);

    return new this(protocol, tokens, client);
  }

  to(buffer: Buffer) {
    super.to(buffer);

    buffer.writeInt(this.protocol);

    const chain = [];
    for (const token of this.tokens) {
      chain.push(token.export());
    }

    const data = { chain };

    const sub = Buffer.empty(524288);
    sub.writeLIntString(JSON.stringify(data));
    sub.writeLIntString(this.client.export());
    buffer.writeUVIntArray(sub.export());
  }

  async export(): Promise<Uint8Array> {
    const buffer = Buffer.empty(524288);
    await this.to(buffer);
    return buffer.export();
  }
}

export class DisconnectPacket extends BedrockPacket {
  static id = 0x05;

  constructor(
    public message: string,
  ) {
    super();
  }

  static from(buffer: Buffer) {
    super.check(buffer);
    const hidden = buffer.readBool();
    const message = hidden ? "" : buffer.readUVIntString();
    return new this(message);
  }

  to(buffer: Buffer) {
    super.to(buffer);
    const hidden = !this.message;
    buffer.writeBool(hidden);
    if (hidden) return;
    buffer.writeUVIntString(this.message);
  }
}

export class PlayStatusPacket extends BedrockPacket {
  static id = 0x02;

  static LOGIN_SUCCESS = 0;
  static LOGIN_FAILED_CLIENT = 1;
  static LOGIN_FAILED_SERVER = 2;
  static PLAYER_SPAWN = 3;
  static LOGIN_FAILED_INVALID_TENANT = 4;
  static LOGIN_FAILED_VANILLA_EDU = 5;
  static LOGIN_FAILED_EDU_VANILLA = 6;
  static LOGIN_FAILED_SERVER_FULL = 7;

  constructor(
    public status: number,
  ) {
    super();
  }

  static from(buffer: Buffer): PlayStatusPacket {
    super.check(buffer);
    return new this(buffer.readInt());
  }

  to(buffer: Buffer) {
    super.to(buffer);
    buffer.writeInt(this.status);
  }
}
