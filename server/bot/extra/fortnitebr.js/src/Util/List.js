/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-useless-constructor */
/**
 * Works like an array, but easier to use.
 * @extends {Map}
 */
class List extends Map {
	constructor(iterable) {
		super(iterable);
	}

	set(key, val) {
		return super.set(key, val);
	}

	delete(key) {
		return super.delete(key);
	}

	get(key) {
		return super.get(key);
	}

	deleteAll() {
		const returns = [];
		for (const item of this.values()) {
			if (item.delete) returns.push(item.delete());
		}
		return returns;
	}

	find(propOrFn) {
		for (const [key, val] of this) {
			if (propOrFn(val, key, this)) return val;
		}
		return null;
	}

	map(fn, thisArg) {
		if (thisArg) fn = fn.bind(thisArg);
		const arr = new Array(this.size);
		let i = 0;
		for (const [key, val] of this) arr[(i += 1)] = fn(val, key, this);
		return arr;
	}

	some(fn, thisArg) {
		if (thisArg) fn = fn.bind(thisArg);
		for (const [key, val] of this) {
			if (fn(val, key, this)) return true;
		}
		return false;
	}

	equals(collection) {
		if (!collection) return false;
		if (this === collection) return true;
		if (this.size !== collection.size) return false;
		return !this.find((value, key) => {
			const testVal = collection.get(key);
			return testVal !== value || (testVal === undefined && !collection.has(key));
		});
	}

	sort(compareFunction = (x, y) => +(x > y) || +(x === y) - 1) {
		return new List([...this.entries()].sort((a, b) => compareFunction(a[1], b[1], a[0], b[0])));
	}
}

module.exports = List;
