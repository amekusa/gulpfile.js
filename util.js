/*!
 * gulp utils
 * @author amekusa
 */

const { exec } = require('node:child_process');
const { Transform } = require('node:stream');

const x = {

	/**
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
	 * @return {Promise}
	 */
	clean(dir, fn, depth = 1) {
		return this.exec(`find '${dir}' -type f -maxdepth ${depth} -delete`, fn);
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
