TESTS = test/*.js

test:
	@./node_modules/.bin/mocha \
		--reporter spec\
		$(TESTS)

.PHONY: test
