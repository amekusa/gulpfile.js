/*!
 * gulp utils
 * @author amekusa
 */

const fs = require('node:fs');
const { exec } = require('node:child_process');
const { Transform } = require('node:stream');

const x = {

	/**
	 * Executes the given shell command, and returns a Promise that resolves the stdout
	 * @return {Promise}
	 */
	exec(cmd) {
		return new Promise((resolve, reject) => {
			exec(cmd, (err, stdout, stderr) => {
				if (err) reject(stderr);
				resolve(stdout);
			});
		});
	},

	/**
	 * Deletes the contents of the given directory
	 * @return {Promise}
	 */
	clean(dir, pattern, depth = 1) {
		return x.exec(`find '${dir}' -type f -name '${pattern}' -maxdepth ${depth} -delete`);
	},

	/**
	 * Deletes the given file or directory
	 * @param {string} file
	 * @return {Promise}
	 */
	rm(file) {
		return new Promise((resolve, reject) => {
			fs.rm(file, { force: true, recursive: true }, err => err ? reject(err) : resolve());
		});
	},

	/**
	 * Returns a Transform stream object with the given function as its transform() method.
	 * `fn` must return a string which is to be the new content, or a Promise which resolves a string.
	 * @param {function} fn
	 * @return {Transform}
	 * @author amekusa
	 */
	modify(fn) {
		return new Transform({
			objectMode: true,
			transform(file, enc, done) {
				let r = fn(file.contents.toString(enc), enc);
				if (r instanceof Promise) {
					r.then(modified => {
						file.contents = Buffer.from(modified, enc);
						this.push(file);
						done();
					});
				} else {
					file.contents = Buffer.from(r, enc);
					this.push(file);
					done();
				}
			}
		});
	},

};

module.exports = x;
