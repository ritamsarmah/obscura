package scrambler

import "core:encoding/base64"
import "core:fmt"
import "core:os"
import "core:slice"
import "core:strings"

MARKER: string : "$~>"

main :: proc() {
	if len(os.args) < 2 {
		fmt.eprintln("Usage: cryptaxor PATH...")
		os.exit(1)
	}

	for path in os.args[1:] {
		info, err := os.lstat(path)
		if err != os.ERROR_NONE {
			print_read_error(info)
			continue
		}
		defer os.file_info_delete(info)

		if info.is_dir do walk_dir(info)
		else do toggle_file(info)
	}
}

walk_dir :: proc(info: os.File_Info) {
	// Skip hidden directories
	if info.name[0] == '.' do return

	fd, err := os.open(info.fullpath)
	if err != os.ERROR_NONE {
		print_read_error(info)
		return
	}
	defer os.close(fd)

	files, _ := os.read_dir(fd, 0)
	for file in files {
		if file.is_dir do walk_dir(file)
		else do toggle_file(file)
	}
}

toggle_file :: proc(info: os.File_Info) {
	// Skip hidden files
	if info.name[0] == '.' do return

	fd, err := os.open(info.fullpath, os.O_RDONLY)
	if err != os.ERROR_NONE {
		print_read_error(info)
		return
	}

	data, _ := os.read_entire_file(fd)
	os.close(fd)

	encrypted := slice.equal(data[:len(MARKER)], transmute([]byte)MARKER)

	// If decrypting, decode from base64 (removing marker)
	if encrypted do data = base64.decode(string(data[len(MARKER):]))

	for b, i in data do data[i] ~= u8(i) % 32

	if encrypted {
		// Write decrypted data
		os.write_entire_file(info.fullpath, data)
	} else {
		// Write encrypted data after base64 encoding
		fd, _ := os.open(info.fullpath, os.O_RDWR | os.O_TRUNC)
		defer os.close(fd)

		data = transmute([]u8)base64.encode(data)
		os.write_at(fd, transmute([]byte)MARKER, 0)
		os.write_at(fd, data, len(MARKER))
	}

	fmt.println(info.name)
}

print_read_error :: proc(info: os.File_Info) {
	type := info.is_dir ? "directory:" : "file:"
	fmt.eprintln("Failed to read", type, info.fullpath)
}
