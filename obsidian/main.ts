import { Editor, MarkdownView, Plugin, TFile } from 'obsidian';
import { Base64 } from 'js-base64';

const marker = "$~>";

export default class Scrambler extends Plugin {
  async onload() {
    this.addCommand({
      id: 'scramble-current-file',
      name: 'Scramble current file',
      editorCallback: (_: Editor, view: MarkdownView) => {
        let file = view.file;
        if (file != null) {
          this.scramble(file);
        }
      },
    });

    this.addCommand({
      id: 'scramble-vault',
      name: 'Scramble vault',
      callback: () => {
        let files = this.app.vault.getFiles()
        files.forEach(file => this.scramble(file));
      }
    });
  }

  private async scramble(file: TFile) {
    let contents = await this.app.vault.read(file);
    const encrypted = contents.startsWith(marker);

    // If decrypting, decode from base64 (removing marker)
    if (encrypted) contents = Base64.decode(contents.slice(marker.length));

    // Iterate through data and use index to XOR
    let data = [...contents];
    for (let i = 0; i < data.length; i++) {
      data[i] = String.fromCharCode(contents.charCodeAt(i) ^ (i % 32));
    }

    if (encrypted) {
      // Decrypted data
      contents = data.join("");
    } else {
      // Encrypted data after base64 encoding
      contents = marker + Base64.encode(data.join(""));
    }

    this.app.vault.modify(file, contents);
  }
}
