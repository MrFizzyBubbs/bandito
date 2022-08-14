import { bufferToFile, fileToBuffer, myName, visitUrl } from "kolmafia";

export class Mini {
  id: number;
  name: string;
  wins: number;
  losses: number;

  constructor(id: number, name: string, wins: number, losses: number) {
    this.id = id;
    this.name = name;
    this.wins = wins;
    this.losses = losses;
  }

  winningPercentage(): number {
    return this.wins / (this.wins + this.losses);
  }

  run(): void {
    // TODO accept attack type argument
    const page = visitUrl(
      `peevpee.php?action=fight&place=fight&pwd&ranked=1&stance=${this.id}&attacktype=lootwhatever`
    );
    const pattern = new RegExp("lost some dignity in the attempt");
    const won = pattern.exec(page) ? false : true;
    if (won) this.wins += 1;
    else this.losses += 1;
  }
}

export class Season {
  id: number;
  minis: Mini[];

  private constructor(id: number, minis: Mini[]) {
    this.id = id;
    this.minis = minis;
  }

  static parseCurrentId(): number {
    const pattern = new RegExp("<b>Current Season: </b>([\\d]+)<br />");
    const page = visitUrl("peevpee.php?place=rules");
    const match = pattern.exec(page);
    return match ? parseInt(match[1]) : 0;
  }

  static parseCurrentMinis(): Mini[] {
    const pattern = new RegExp('<option value="([\\d]*)" (?:selected)?>(.*?)</option>', "g");
    const page = visitUrl("peevpee.php?place=fight");
    let match;
    const result = [];
    while ((match = pattern.exec(page))) {
      result.push(new Mini(parseInt(match[1]), match[2], 0, 0));
    }
    return result;
  }

  static current(): Season {
    const id = this.parseCurrentId();
    const saved = Season.load();
    if (id === saved.id) {
      return saved;
    } else {
      return new Season(id, this.parseCurrentMinis());
    }
  }

  bestMini(): Mini {
    return this.minis.reduce((prev, cur) =>
      cur.winningPercentage() > prev.winningPercentage() ? cur : prev
    );
  }

  save(): void {
    bufferToFile(JSON.stringify(this), `bandito/${myName()}.json`);
  }

  static load(): Season {
    const fileValue = fileToBuffer(`bandito/${myName()}.json`);
    if (fileValue.length > 0) {
      const value: {
        id: number;
        minis: { id: number; name: string; wins: number; losses: number }[];
      } = JSON.parse(fileValue);
      const parsed = value.minis.map((x) => new Mini(x.id, x.name, x.wins, x.losses));
      return new Season(value.id, parsed);
    } else {
      return new Season(0, []);
    }
  }
}
