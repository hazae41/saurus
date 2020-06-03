import { Buffer } from "../buffer.ts";
import { BedrockPacket } from "../mod.ts";

export class JWT {
  public header: any;
  public payload: any;
  public signature: string;

  constructor(jwt: string) {
    const { parse } = JSON;
    const [header, payload, signature] = jwt.split(".");
    this.header = parse(atob(header));
    this.payload = parse(atob(payload));
    this.signature = signature;
  }

  export() {
    const { stringify } = JSON;
    const header = stringify(btoa(this.header));
    const payload = stringify(btoa(this.payload));
    const signature = this.signature;
    return [header, payload, signature].join(".");
  }
}

export class ServerToClientHandshakePacket extends BedrockPacket {
  static id = 0x03;

  constructor(
    public jwt: JWT,
  ) {
    super();
  }

  static from(buffer: Buffer) {
    super.check(buffer);
    const compact = buffer.readUVIntString();
    const jwt = new JWT(compact);
    return new this(jwt);
  }

  to(buffer: Buffer) {
    super.to(buffer);
    buffer.writeUVIntString(this.jwt.export());
  }
}
