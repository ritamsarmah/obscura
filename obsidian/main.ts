import { Plugin, TFile } from 'obsidian';
import { Base64 } from 'js-base64';

const marker = "$~>";

export default class Scrambler extends Plugin {
  async onload() {
    this.addCommand({
      id: 'scrambler-toggle-current-file',
      name: 'Toggle current file encryption',
      checkCallback: (checking) => {
        // Check that a file is open and focused
        let file = this.app.workspace.getActiveFile();
        if (checking) return file != null;

        if (file != null) this.toggleFile(file);
      },
    });

    this.addCommand({
      id: 'scrambler-encrypt-vault',
      name: 'Encrypt vault',
      callback: () => {
        let files = this.app.vault.getFiles()
        files.forEach(file => this.encryptFile(file));
      }
    });

    this.addCommand({
      id: 'scrambler-decrypt-vault',
      name: 'Decrypt vault',
      callback: () => {
        let files = this.app.vault.getFiles()
        files.forEach(file => this.decryptFile(file));
      }
    });
  }

  private async toggleFile(file: TFile) {
    let text = await this.app.vault.read(file);
    const encrypted = text.startsWith(marker);

    text = encrypted ? this.decrypt(text) : this.encrypt(text);
    this.app.vault.modify(file, text);
  }

  private async encryptFile(file: TFile) {
    let text = await this.app.vault.read(file);
    const encrypted = text.startsWith(marker);

    if (!encrypted) {
      text = this.encrypt(text);
      this.app.vault.modify(file, text);
    }
  }

  private async decryptFile(file: TFile) {
    let text = await this.app.vault.read(file);
    const encrypted = text.startsWith(marker);

    if (encrypted) {
      text = this.decrypt(text);
      this.app.vault.modify(file, text);
    }
  }

  private encrypt(text: string): string {
    // Encode to base64 after XOR'ing
    text = this.xor(text);
    return marker + Base64.encode(text);
  }

  private decrypt(data: string): string {
    // Decode from base64 (ignoring marker) and XOR
    data = Base64.decode(data.slice(marker.length));
    return this.xor(data)
  }

  private xor(text: string): string {
    // Iterate through data and use index to XOR
    let data = new Array(text.length)
    for (let i = 0; i < text.length; i++) {
      data[i] = String.fromCharCode(text.charCodeAt(i) ^ (i % 32));
    }

    return data.join("");
  }
}
