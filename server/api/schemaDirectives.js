const { SchemaDirectiveVisitor } = require("graphql-tools");
const { defaultFieldResolver } = require("graphql");
const { AuthenticationError, ForbiddenError } = require("apollo-server-express");

class auth extends SchemaDirectiveVisitor {
	visitFieldDefinition(field) {
		console.log(field);
		const { resolve } = field;
		field.resolve = async function (parent, args, context, info) {
			if (!context.user) {
				// throw new AuthenticationError("User not authenticated");
			}
			const result = await resolve.apply(this, args);
			return result;
		};
	}

	visitObject(object) {
		console.log(object);
	}
}

module.exports = { auth };
