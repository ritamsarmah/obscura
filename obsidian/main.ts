import { Editor, MarkdownView, Plugin, TFile } from 'obsidian';

const marker = "$~>";

export default class Scrambler extends Plugin {
  async onload() {
    this.addCommand({
      id: 'scramble-current-file',
      name: 'Scramble current file',
      editorCallback: (_: Editor, view: MarkdownView) => {
        console.log("hello from editor 2");
        console.log(view.file);

        let file = view.file
        if (file == null) return;

        this.scramble(file).then(data => {
          if (file != null) {
            this.app.vault.modify(file, data);
          }
        });
      },
    });
  }

  private async scramble(file: TFile): Promise<string> {
    let contents = await this.app.vault.read(file);
    const encrypted = contents.startsWith(marker);

    // If decrypting, decode from base64 (removing marker)
    if (encrypted) contents = atob(contents.slice(marker.length));

    // Iterate through data and use index to XOR
    let data = [...contents];
    for (let i = 0; i < data.length; i++) {
      data[i] = String.fromCharCode(contents.charCodeAt(i) ^ (i % 32));
    }

    if (encrypted) {
      // Return decrypted data
      return data.join("");
    } else {
      // Return encrypted data after base64 encoding
      return marker + btoa(data.join(""));
    }
  }
}
