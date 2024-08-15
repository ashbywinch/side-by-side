setup:
	npm install 

clean:
	rm -rf node_modules

lint: 
	npm run lint
	
.PHONY: test
test:
	npm run coverage

.PHONY: dist
dist:
	npm run build
