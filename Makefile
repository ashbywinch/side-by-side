setup:
	npm install 

clean:
	rm -rf node_modules

.PHONY: data
data:
	npm run data

.PHONY: check-corpus
check-corpus:
	npm run check-corpus

.PHONY: typecheck
typecheck:
	npm run typecheck

lint: 
	npm run lint
	
.PHONY: test
test:
	npm run coverage

.PHONY: dist
dist:
	npm run build

.PHONY: deploy
deploy:
	npm run deploy

.PHONY: smoke
smoke:
	npm run smoke
