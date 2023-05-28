/*!
 * gulp utils
 * @author amekusa
 */

const fs = require('node:fs/promises');
const { join, basename, dirname } = require('node:path');
const { exec } = require('node:child_process');
const { Transform } = require('node:stream');

const X = {

	/**
	 * Executes the given shell command, and returns a Promise that resolves the stdout
	 * @param {string} cmd
	 * @param {object} [opts]
	 * @return {Promise}
	 */
	exec(cmd, opts = {}) {
		opts = Object.assign({
			dryRun: false,
		}, opts);
		return new Promise((resolve, reject) => {
			if (opts.dryRun) {
				console.log(`[DRYRUN] ${cmd}`);
				return resolve();
			}
			exec(cmd, (err, stdout, stderr) => {
				if (err) reject(stderr);
				resolve(stdout);
			});
		});
	},

	/**
	 * Converts the given objects to shell arguments in a string form
	 * @param {object} args
	 * @param {object} [opts]
	 * @return {string}
	 */
	args(args, opts = {}) {
		opts = Object.assign({
			sep: ' ', // key-value separator
		}, opts);
		let r = [];
		for (let key in args) {
			let value = args[key];
			switch (typeof value) {
			case 'boolean':
				r.push(key);
				break;
			case 'number':
				r.push(key + opts.sep + value);
				break;
			case 'string':
				r.push(key + opts.sep + `"${value}"`);
				break;
			}
		}
		return r.join(' ');
	},

	/**
	 * Deletes the contents of the given directory
	 * @return {Promise}
	 */
	clean(dir, pattern, depth = 1) {
		return X.exec(`find '${dir}' -type f -name '${pattern}' -maxdepth ${depth} -delete`);
	},

	/**
	 * Deletes the given file or directory
	 * @param {string} file
	 * @return {Promise}
	 */
	rm(file) {
		return fs.rm(file, { force: true, recursive: true });
	},

	/**
	 * Copies the given file(s) to another directory
	 * @param {string|object|string[]|object[]} src
	 * @param {string} dst Base destination directory
	 * @return {Promise}
	 */
	copy(src, dst) {
		let proms = [];
		(Array.isArray(src) ? src : [src]).forEach(item => {
			let _src, _dst;
			switch (typeof item) {
			case 'object':
				_src = item.src;
				_dst = item.dst;
				break;
			case 'string':
				_src = item;
				break;
			default:
				throw 'invalid type';
			}
			_dst = join(dst, _dst || basename(_src));
			proms.push(
				fs.mkdir(dirname(_dst), { recursive: true })
				.then(fs.copyFile(_src, _dst))
			);
		});
		return Promise.all(proms);
	},

	/**
	 * Returns a Transform stream object with the given function as its transform() method.
	 * `fn` must return a string which is to be the new content, or a Promise which resolves a string.
	 *
	 * @example
	 * return gulp.src(src)
	 *   .pipe(modify((data, enc) => {
	 *     // do stuff
	 *     return newData;
	 *   }));
	 *
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

module.exports = X;
