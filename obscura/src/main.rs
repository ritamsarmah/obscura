use base64::{engine::general_purpose::STANDARD as b64, Engine as _};

use std::path::{Path, PathBuf};
use std::process::exit;
use std::{env, fs};

const MARKER: &str = "$~>";

#[derive(Copy, Clone)]
enum Action {
    Encrypt,
    Decrypt,
}

fn main() {
    let (path, action) = parse_args();
    obscura(&path, action);
}

fn parse_args() -> (PathBuf, Action) {
    let args: Vec<String> = env::args().collect();

    if args.len() != 3 || !args[1].starts_with('-') {
        eprintln!("Usage: obscura [-e | -d] PATH");
        exit(1);
    }

    let action = match args[1].as_str() {
        "-e" | "--encrypt" => Action::Encrypt,
        "-d" | "--decrypt" => Action::Decrypt,
        _ => {
            eprintln!("Error: Unrecognized flag provided {}", args[1]);
            exit(1);
        }
    };

    (PathBuf::from(&args[2]), action)
}

fn obscura(path: &Path, action: Action) {
    if path.exists() {
        eprintln!("Error: Path not found");
        exit(1);
    }

    if is_hidden(path) {
        return;
    }

    if path.is_dir() {
        walk_dir(path, action)
    } else if path.is_file() {
        let extension = path
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or_default();

        // Only modify text files
        if extension != "md" && extension != "txt" {
            return;
        }

        println!("{}", &path.display());

        let mut data = fs::read(path).expect("Read file contents");

        if !data.is_empty() {
            match action {
                Action::Encrypt => encrypt(&mut data),
                Action::Decrypt => decrypt(&mut data),
            };

            fs::write(path, data).expect("Write file contents");
        }
    }
}

fn walk_dir(path: &Path, action: Action) {
    fs::read_dir(path)
        .expect("Read directory")
        .map(|entry| entry.unwrap().path())
        .for_each(|path| obscura(&path, action))
}

fn encrypt(data: &mut Vec<u8>) {
    if is_encrypted(data) {
        return;
    }

    // XOR and encode to base64
    xor(data);
    let encoded = format!("{}{}", MARKER, b64.encode(&data));
    *data = encoded.as_bytes().to_vec();
}

fn decrypt(data: &mut Vec<u8>) {
    if !is_encrypted(data) {
        return;
    }

    // Decode from base64 (ignoring marker) and XOR
    *data = b64
        .decode(&data[MARKER.len()..])
        .expect("Decode base64")
        .to_vec();
    xor(data);
}

fn xor(data: &mut Vec<u8>) {
    for (index, value) in data.iter_mut().enumerate() {
        *value ^= (index as u8) % 32;
    }
}

/* Utilities */

fn is_hidden(path: &Path) -> bool {
    path.starts_with(".")
}

fn is_encrypted(data: &Vec<u8>) -> bool {
    data.starts_with(MARKER.as_bytes())
}
